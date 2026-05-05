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
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import api from "@/services/api";

interface InstalledMeter {
  meterId: string;
  assignedHouseholdId: string;
  meterType?: string | null;
  assetSerialNumber?: string | null;
  installedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface InstalledMetersResponse {
  meters: InstalledMeter[];
  pagination: Pagination;
}

export default function InstalledMetersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [data, setData] = useState<InstalledMeter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [debouncedSearch] = useDebounce(search, 500);

  const fetchInstalledMeters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (debouncedSearch) params.append("search", debouncedSearch);

      const { data: res } = await api.get<{ data: InstalledMetersResponse }>(
        `/meters/installed?${params.toString()}`
      );
      setData(res.data.meters);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load installed meters");
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchInstalledMeters();
  }, [fetchInstalledMeters]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval) {
      intervalRef.current = setInterval(fetchInstalledMeters, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchInstalledMeters]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInstalledMeters();
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const columns: ColumnDef<InstalledMeter>[] = [
    {
      header: "Sr No.",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {(page - 1) * limit + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "meterId",
      header: "Meter ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded ml-[-15px] text-[15px]">
            {row.original.meterId}
          </code>
        </div>
      ),
    },
    {
      accessorKey: "assignedHouseholdId",
      header: "HHID",
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 ml-[-14px] text-[15px]">
          {row.original.assignedHouseholdId}
        </code>
      ),
    },
    // {
    //   accessorKey: "meterType",
    //   header: "Meter Type",
    //   cell: ({ row }) =>
    //     row.original.meterType ? (
    //       <Badge variant="secondary" className="font-normal text-xs">
    //         {row.original.meterType}
    //       </Badge>
    //     ) : (
    //       <span className="text-muted-foreground text-xs">—</span>
    //     ),
    // },
    // {
    //   accessorKey: "assetSerialNumber",
    //   header: "Serial No.",
    //   cell: ({ row }) => (
    //     <span className="font-mono text-xs text-muted-foreground">
    //       {row.original.assetSerialNumber || "—"}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "installedAt",
      header: "Installed On",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {new Date(row.original.installedAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.pages ?? 0,
  });

  const totalPages = pagination?.pages ?? 0;
  const total = pagination?.total ?? 0;

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Installed Meters"
        description="All meters currently assigned to a household"
        size="sm"
        badge={<Badge variant="outline">{total.toLocaleString()} installed</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search meter or HHID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 h-9 w-56 text-sm"
              />
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Auto-refresh */}
            <ButtonGroup>
              <Select
                value={refreshInterval ? String(refreshInterval) : "off"}
                onValueChange={(v) =>
                  setRefreshInterval(v === "off" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-fit h-9">
                  <SelectValue placeholder="Refresh: Off" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Refresh: Off</SelectItem>
                  <SelectItem value="10000">Every 10s</SelectItem>
                  <SelectItem value="30000">Every 30s</SelectItem>
                  <SelectItem value="60000">Every 1 min</SelectItem>
                  <SelectItem value="300000">Every 5 min</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="icon"
                className="h-9 w-9"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </ButtonGroup>
          </div>
        }
      />

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">Loading installed meters...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No installed meters found</EmptyTitle>
                        <EmptyDescription>
                          {search
                            ? "No meters match your search. Try a different Meter ID or HHID."
                            : "No meters have been assigned to a household yet."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {search && (
                        <EmptyContent>
                          <Button onClick={handleClearSearch} variant="outline">
                            <X className="mr-2 h-4 w-4" />
                            Clear Search
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
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

        {/* Pagination footer */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {total.toLocaleString()}
              </span>{" "}
              installed meters
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 py-1 border-y flex items-center tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
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