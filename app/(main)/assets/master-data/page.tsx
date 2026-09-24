/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Search,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";

import AssetsService from "@/services/assets.service";
import {
  getEnvironmentByMeterId,
  getDummyMeterStatus,
} from "@/lib/meter-utils";

/* ============================================================
   FILTERS
   ============================================================ */

interface Filters {
  search: string;
  status: string;
  powerHATStatus: string;
  page: number;
  limit: number;
}

/* ============================================================
   DEVICE ID GENERATORS
   ============================================================ */

/**
 * Creates a stable numeric hash from a string.
 *
 * The same meter ID will always produce the same hash.
 * Different meter IDs will produce different values in practice.
 */
function hashString(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Generates a stable, locally-administered MAC address.
 *
 * Example:
 * 02:7A:3F:91:C4:28
 *
 * The first octet is 02:
 * - bit 0 = 0 -> unicast
 * - bit 1 = 1 -> locally administered
 *
 * Therefore these are suitable as dummy/test MAC addresses.
 */
function getDummyMacId(meterId: string): string {
  const hash1 = hashString(`${meterId}-mac-1`);
  const hash2 = hashString(`${meterId}-mac-2`);

  const bytes = [
    0x02,
    (hash1 >>> 24) & 0xff,
    (hash1 >>> 16) & 0xff,
    (hash1 >>> 8) & 0xff,
    hash1 & 0xff,
    hash2 & 0xff,
  ];

  return bytes
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(":");
}

/**
 * Generates a Raspberry Pi style CPU serial.
 *
 * Example:
 * 10000000FEBA3699
 *
 * The value is:
 * - 16 hexadecimal characters
 * - stable for the same meter ID
 * - different for different meter IDs in practice
 */
function getDummyCpuSerial(meterId: string): string {
  const hash1 = hashString(`${meterId}-cpu-1`);
  const hash2 = hashString(`${meterId}-cpu-2`);

  const part1 = hash1.toString(16).padStart(8, "0");
  const part2 = hash2.toString(16).padStart(8, "0");

  return `${part1}${part2}`.toUpperCase();
}

export default function MasterDataPage() {
  /* ============================================================
     STATE
     ============================================================ */

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    powerHATStatus: "",
    page: 1,
    limit: 25,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [meters, setMeters] = useState<any[]>([]);
  const [totalMeters, setTotalMeters] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(
    null
  );

  const [debouncedSearch] = useDebounce(filters.search, 600);

  /* ============================================================
     ACTIVE FILTER CHECK
     ============================================================ */

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.powerHATStatus
  );

  /* ============================================================
     FETCH METERS
     ============================================================ */

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await AssetsService.getMeters({
        page: filters.page,
        limit: filters.limit,
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        powerHATStatus: filters.powerHATStatus || undefined,
      });

      setMeters(res.meters);

      console.log(res.meters);

      setTotalMeters(res.pagination.total);
    } catch (err) {
      console.error("Failed to load meters:", err);

      toast.error("Failed to load meters");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.powerHATStatus,
    debouncedSearch,
  ]);

  /* ============================================================
     INITIAL / FILTER DATA LOAD
     ============================================================ */

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ============================================================
     AUTO REFRESH
     ============================================================ */

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (refreshInterval) {
      intervalRef.current = setInterval(
        fetchData,
        refreshInterval
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, fetchData]);

  /* ============================================================
     REFRESH
     ============================================================ */

  const handleRefresh = () => {
    setRefreshing(true);

    fetchData();

    toast.success("Refreshed");
  };

  /* ============================================================
     FILTER HANDLERS
     ============================================================ */

  const handleApplyFilters = () => {
    setFilters({
      ...tempFilters,
      page: 1,
    });

    setDialogOpen(false);

    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset = {
      search: "",
      status: "",
      powerHATStatus: "",
      page: 1,
      limit: filters.limit,
    };

    setFilters(reset);
    setTempFilters(reset);

    toast("Filters cleared");
  };

  const openDialog = () => {
    setTempFilters(filters);
    setDialogOpen(true);
  };

  /* ============================================================
     METERS TABLE
     ============================================================ */

  const meterColumns: ColumnDef<any>[] = [
    {
      accessorKey: "meterId",
      header: "Meter ID",
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {row.original.meterId}
        </code>
      ),
    },

    {
      accessorKey: "meterType",
      header: "Type",
      cell: ({ row }) => row.original.meterType || "—",
    },

    /* ==========================================================
       MAC ID
       ========================================================== */

    {
      id: "macId",
      header: "MAC ID",
      cell: ({ row }) => (
        <code className="font-mono text-xs">
          {getDummyMacId(row.original.meterId)}
        </code>
      ),
    },

    /* ==========================================================
       CPU SERIAL
       ========================================================== */

    {
      id: "cpuSerial",
      header: "CPU Serial",
      cell: ({ row }) => (
        <code className="font-mono text-xs text-muted-foreground">
          {getDummyCpuSerial(row.original.meterId)}
        </code>
      ),
    },

    /* ==========================================================
       ENVIRONMENT
       ========================================================== */

    {
      id: "environment",
      header: "Environment",
      cell: ({ row }) => {
        const env = getEnvironmentByMeterId(
          row.original.meterId
        );

        const variant =
          env === "Production"
            ? "default"
            : env === "Staging"
            ? "outline"
            : "secondary";

        return (
          <Badge variant={variant}>
            {env}
          </Badge>
        );
      },
    },

    /* ==========================================================
       STATUS
       ========================================================== */

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const dummyStatus = getDummyMeterStatus(
          row.original.meterId,
          row.index
        );

        return (
          <Badge
            variant={
              dummyStatus === "Active"
                ? "default"
                : "destructive"
            }
          >
            {dummyStatus}
          </Badge>
        );
      },
    },
  ];

  const meterTable = useReactTable({
    data: meters,
    columns: meterColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(
      totalMeters / filters.limit
    ),
  });

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className="p-4 space-y-6">
      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <PageHeader
        title="Master Data"
        description="Meters & Sync Status"
        badge={<Database className="h-5 w-5" />}
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* ==================================================
                FILTERS
                ================================================== */}

            <ButtonGroup>
              <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={openDialog}
                  >
                    <Filter className="mr-2 h-4 w-4" />

                    Filters

                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="ml-2 text-xs"
                      >
                        {
                          [
                            filters.search && 1,
                            filters.status && 1,
                            filters.powerHATStatus && 1,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      Filter Meters
                    </DialogTitle>

                    <DialogDescription>
                      Filter the registered meters using the
                      available criteria.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* SEARCH */}

                    <div className="space-y-2">
                      <Label>Search</Label>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                        <Input
                          placeholder="Meter ID, Thing Name..."
                          value={tempFilters.search}
                          onChange={(e) =>
                            setTempFilters((p) => ({
                              ...p,
                              search: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* STATUS */}

                    <div className="space-y-2">
                      <Label>Meter Status</Label>

                      <Select
                        value={
                          tempFilters.status || "all"
                        }
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            status:
                              v === "all" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">
                            All
                          </SelectItem>

                          <SelectItem value="registered">
                            Registered
                          </SelectItem>

                          <SelectItem value="unregistered">
                            Unregistered
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* POWER HAT */}

                    <div className="space-y-2">
                      <Label>Power HAT</Label>

                      <Select
                        value={
                          tempFilters.powerHATStatus ||
                          "all"
                        }
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            powerHATStatus:
                              v === "all" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="all">
                            All
                          </SelectItem>

                          <SelectItem value="Flashed">
                            Flashed
                          </SelectItem>

                          <SelectItem value="No HAT">
                            No HAT
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDialogOpen(false)
                      }
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={handleApplyFilters}
                    >
                      Apply
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            {/* ==================================================
                AUTO REFRESH
                ================================================== */}

            <ButtonGroup>
              <Select
                value={
                  refreshInterval
                    ? String(refreshInterval)
                    : "off"
                }
                onValueChange={(v) =>
                  setRefreshInterval(
                    v === "off" ? null : Number(v)
                  )
                }
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Refresh: Off" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="off">
                    Refresh: Off
                  </SelectItem>

                  <SelectItem value="10000">
                    Every 10s
                  </SelectItem>

                  <SelectItem value="30000">
                    Every 30s
                  </SelectItem>

                  <SelectItem value="60000">
                    Every 1 min
                  </SelectItem>

                  <SelectItem value="300000">
                    Every 5 min
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="icon"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </Button>
            </ButtonGroup>
          </div>
        }
      />

      {/* ======================================================
          METERS TABLE
          ====================================================== */}

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {meterTable.getHeaderGroups().map(
                (headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(
                      (header) => (
                        <TableHead
                          key={header.id}
                          className="bg-background"
                        >
                          {flexRender(
                            header.column.columnDef
                              .header,
                            header.getContext()
                          )}
                        </TableHead>
                      )
                    )}
                  </TableRow>
                )
              )}
            </TableHeader>

            <TableBody>
              {/* LOADING */}

              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />

                      <p className="text-muted-foreground">
                        Loading meters...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : meters.length === 0 ? (
                /* EMPTY */

                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64"
                  >
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>

                        <EmptyTitle>
                          No meters found
                        </EmptyTitle>

                        <EmptyDescription>
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "No meters registered yet"}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                /* DATA */

                meterTable
                  .getRowModel()
                  .rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/50"
                    >
                      {row
                        .getVisibleCells()
                        .map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ====================================================
            PAGINATION
            ==================================================== */}

        {totalMeters > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {(filters.page - 1) *
                filters.limit +
                1}
              –
              {Math.min(
                filters.page * filters.limit,
                totalMeters
              )}{" "}
              of {totalMeters.toLocaleString()} meters
            </p>

            <div className="flex items-center gap-3">
              {/* PAGE SIZE */}

              <Select
                value={String(filters.limit)}
                onValueChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    limit: Number(v),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[10, 25, 50].map((n) => (
                    <SelectItem
                      key={n}
                      value={String(n)}
                    >
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* PAGINATION */}

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      page: p.page - 1,
                    }))
                  }
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs font-medium p-2 pb-0 border-y">
                  Page {filters.page} of{" "}
                  {Math.ceil(
                    totalMeters / filters.limit
                  )}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      page: p.page + 1,
                    }))
                  }
                  disabled={
                    filters.page >=
                    Math.ceil(
                      totalMeters / filters.limit
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
