/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Trash2,
  Home,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  AlertTriangle,
  Unlink,
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { Progress } from "@/components/ui/progress";

import DecommissionService, {
  AssignedMeter,
  DecommissionLog,
  DecommissionResponse,
} from "@/services/decommission.service";

interface Filters {
  search?: string;
  page: number;
  limit: number;
}

type TableRowData = AssignedMeter | DecommissionLog;

interface RetryStatus {
  attempt: number;
  maxAttempts: number;
  currentTimeout: number;
  status: "sending" | "waiting" | "success" | "failed";
  message: string;
}

export default function DecommissionPage() {
  const [assignedMeters, setAssignedMeters] = useState<AssignedMeter[]>([]);
  const [logs, setLogs] = useState<DecommissionLog[]>([]);
  const [totalAssigned, setTotalAssigned] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"assigned" | "logs">("assigned");

  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    limit: 25,
  });

  // Decommission dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] =
    useState<AssignedMeter | null>(null);
  const [reason, setReason] = useState("");
  const [decommissioning, setDecommissioning] = useState(false);
  const [retryStatus, setRetryStatus] = useState<RetryStatus | null>(null);

  // Unassign dialog state
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [selectedUnassignMeter, setSelectedUnassignMeter] =
    useState<AssignedMeter | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [debouncedSearch] = useDebounce(filters.search, 500);

  const hasActiveFilters = Boolean(filters.search);

  // ============================================================
  // FETCH ASSIGNED METERS
  // ============================================================

  const fetchAssignedMeters = useCallback(async () => {
    setLoading(true);

    try {
      const res = await DecommissionService.getAssignedMeters({
        search: debouncedSearch || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      setAssignedMeters(res.data.data);
      setTotalAssigned(res.data.pagination.total);
    } catch (err) {
      toast.error("Failed to load assigned meters");
      setAssignedMeters([]);
      setTotalAssigned(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filters.page, filters.limit]);

  // ============================================================
  // FETCH DECOMMISSION LOGS
  // ============================================================

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const res = await DecommissionService.getDecommissionLogs({
        page: filters.page,
        limit: filters.limit,
      });

      setLogs(res.data.data);
      setTotalLogs(res.data.pagination.total);
    } catch (err) {
      toast.error("Failed to load decommission logs");
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.page, filters.limit]);

  // ============================================================
  // NORMAL AUTO-REFRESH
  // ============================================================

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (refreshInterval) {
      intervalRef.current = setInterval(() => {
        activeTab === "assigned"
          ? fetchAssignedMeters()
          : fetchLogs();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    refreshInterval,
    activeTab,
    fetchAssignedMeters,
    fetchLogs,
  ]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (activeTab === "assigned") {
      fetchAssignedMeters();
    } else {
      fetchLogs();
    }
  }, [activeTab, fetchAssignedMeters, fetchLogs]);

  // ============================================================
  // AUTOMATIC UNASSIGN EXPIRY REFRESH
  // ============================================================
  //
  // When a decommission fails, the backend returns:
  //
  //   unassignAvailable: true
  //   unassignAvailableUntil: <5 minutes from now>
  //
  // This effect finds the nearest expiry time and schedules
  // a refresh exactly when that window expires.
  //
  // Therefore the user does NOT need to manually refresh
  // the page and does NOT need to enable normal auto-refresh.
  //
  // ============================================================

  useEffect(() => {
    // Only needed on the Assigned Meters tab.
    if (activeTab !== "assigned") {
      return;
    }

    const now = Date.now();

    // Find all currently active unassign expiry times.
    const expiryTimes = assignedMeters
      .map((meter) => {
        if (
          !meter.unassignAvailable ||
          !meter.unassignAvailableUntil
        ) {
          return null;
        }

        const expiryTime = new Date(
          meter.unassignAvailableUntil
        ).getTime();

        // Ignore expiry timestamps that have already passed.
        return expiryTime > now ? expiryTime : null;
      })
      .filter(
        (expiryTime): expiryTime is number =>
          expiryTime !== null
      );

    // No active Unassign windows.
    if (expiryTimes.length === 0) {
      return;
    }

    // If multiple meters have active windows,
    // use the earliest expiry.
    const nextExpiry = Math.min(...expiryTimes);

    // Calculate the time remaining until expiry.
    const delay = Math.max(
      nextExpiry - Date.now(),
      0
    );

    // Refresh shortly after the expiry time.
    //
    // +100ms gives the backend a small buffer so that:
    //
    // da.unassign_available_until > NOW()
    //
    // is definitely false after the refresh.
    const timeout = setTimeout(() => {
      fetchAssignedMeters();
    }, delay + 100);

    // Clean up the timer whenever the dependencies change.
    return () => {
      clearTimeout(timeout);
    };
  }, [
    assignedMeters,
    activeTab,
    fetchAssignedMeters,
  ]);

  // ============================================================
  // MANUAL REFRESH
  // ============================================================

  const handleRefresh = () => {
    setRefreshing(true);
    toast.success("Refreshed");

    activeTab === "assigned"
      ? fetchAssignedMeters()
      : fetchLogs();
  };

  // ============================================================
  // UNASSIGN METER
  // ============================================================

  const openUnassignDialog = (meter: AssignedMeter) => {
    setSelectedUnassignMeter(meter);
    setUnassignDialogOpen(true);
  };

  const handleUnassign = async () => {
    if (!selectedUnassignMeter) return;

    const hhid = selectedUnassignMeter.household?.hhid;

    if (!hhid) {
      toast.error(
        "This meter is not currently assigned to a household"
      );
      return;
    }

    setUnassigning(true);

    try {
      await DecommissionService.unassignMeter({
        meterId: selectedUnassignMeter.meterId,
        hhid,
      });

      toast.success(
        <div>
          <strong>{selectedUnassignMeter.meterId}</strong>{" "}
          unassigned successfully
          <br />
          <span className="text-xs text-muted-foreground">
            From household: {hhid}
          </span>
        </div>
      );

      setUnassignDialogOpen(false);
      setSelectedUnassignMeter(null);

      // Refresh so the meter disappears from the assigned list.
      await fetchAssignedMeters();
    } catch (err: any) {
      toast.error(
        <div>
          <strong>Unassign Failed</strong>
          <br />
          <span className="text-xs">
            {err.response?.data?.msg ||
              "Failed to unassign meter"}
          </span>
        </div>
      );
    } finally {
      setUnassigning(false);
    }
  };

  // ============================================================
  // DECOMMISSION METER
  // ============================================================

  const handleDecommission = async () => {
    if (!selectedMeter) return;

    setDecommissioning(true);

    setRetryStatus({
      attempt: 1,
      maxAttempts: 3,
      currentTimeout: 10000,
      status: "sending",
      message: "Initiating decommission process...",
    });

    try {
      const result: DecommissionResponse = (
        await DecommissionService.decommissionMeter({
          meterId: selectedMeter.meterId,
          reason: reason || undefined,
        })
      ).data;

      // SUCCESS
      setRetryStatus({
        attempt: 1,
        maxAttempts: 3,
        currentTimeout: 0,
        status: "success",
        message:
          "Device acknowledged - decommissioned successfully!",
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      toast.success(
        <div>
          <strong>{selectedMeter.meterId}</strong>{" "}
          decommissioned successfully
          <br />
          <span className="text-xs text-muted-foreground">
            From household: {result.previousHouseholdHhid}
          </span>
        </div>
      );

      // Cleanup
      setDialogOpen(false);
      setReason("");
      setSelectedMeter(null);
      setRetryStatus(null);

      // Refresh assigned meters after successful decommission.
      await fetchAssignedMeters();

      if (activeTab === "logs") {
        await fetchLogs();
      }
    } catch (err: any) {
      // Backend has already recorded the failed attempt.
      setRetryStatus({
        attempt: 3,
        maxAttempts: 3,
        currentTimeout: 0,
        status: "failed",
        message:
          err.response?.data?.msg ||
          "Failed after 3 attempts - device did not respond",
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 2000)
      );

      toast.error(
        <div>
          <strong>Decommission Failed</strong>
          <br />
          <span className="text-xs">
            {err.response?.data?.msg ||
              "Device did not respond after 3 attempts"}
          </span>
        </div>
      );

      setRetryStatus(null);

      // Backend has created the FAILED attempt.
      // Refresh so unassignAvailable becomes true.
      await fetchAssignedMeters();
    } finally {
      setDecommissioning(false);
    }
  };

  const openDecommissionDialog = (meter: AssignedMeter) => {
    setSelectedMeter(meter);
    setReason("");
    setRetryStatus(null);
    setDialogOpen(true);
  };

  // ============================================================
  // ASSIGNED METER COLUMNS
  // ============================================================

  const assignedColumns: ColumnDef<AssignedMeter>[] = [
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
      accessorKey: "meterrType",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.meterType || "—"}
        </span>
      ),
    },
    {
      accessorKey: "assetSerialNumber",
      header: "Serial No.",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.assetSerialNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "household",
      header: "Assigned To",
      cell: ({ row }) => {
        const h = row.original.household;

        return h ? (
          <div className="flex items-center gap-2">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />

            <code className="text-xs font-medium">
              {h.hhid}
            </code>
          </div>
        ) : (
          <span className="text-muted-foreground">
            —
          </span>
        );
      },
    },
    {
      accessorKey: "assignedAt",
      header: "Assigned On",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(
            new Date(row.original.assignedAt),
            "dd MMM yyyy"
          )}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const meter = row.original;

        return (
          <div className="flex items-center gap-2">
            {/* Decommission */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                openDecommissionDialog(meter)
              }
              className="h-8"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Decommission
            </Button>

            {/* Unassign - only available after failed decommission */}
            {meter.unassignAvailable && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  openUnassignDialog(meter)
                }
                className="h-8 border-orange-500/60 bg-orange-50 font-medium text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-400/50 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
              >
                <Unlink className="mr-1.5 h-3.5 w-3.5" />
                Unassign Meter
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ============================================================
  // LOG COLUMNS
  // ============================================================

  const logColumns: ColumnDef<DecommissionLog>[] = [
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
      accessorKey: "householdHhid",
      header: "From Household",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Home className="h-3.5 w-3.5 text-muted-foreground" />

          <code className="text-xs">
            {row.original.householdHhid}
          </code>
        </div>
      ),
    },
    {
      accessorKey: "decommissionedBy",
      header: "By",
      cell: ({ row }) => {
        const by = row.original.decommissionedBy;

        return by ? (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />

            <span className="text-xs">
              {by.name}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            System
          </span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.reason || (
            <em className="text-muted-foreground">
              No reason
            </em>
          )}
        </span>
      ),
    },
    {
      accessorKey: "decommissionedAt",
      header: "Decommissioned On",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />

          {format(
            new Date(
              row.original.decommissionedAt
            ),
            "dd MMM yyyy, HH:mm"
          )}
        </div>
      ),
    },
  ];

  // ============================================================
  // TABLE
  // ============================================================

  const table = useReactTable<TableRowData>({
    data:
      activeTab === "assigned"
        ? assignedMeters
        : logs,

    columns: (
      activeTab === "assigned"
        ? assignedColumns
        : logColumns
    ) as ColumnDef<TableRowData>[],

    getCoreRowModel: getCoreRowModel(),

    manualPagination: true,

    pageCount: Math.ceil(
      (activeTab === "assigned"
        ? totalAssigned
        : totalLogs) / filters.limit
    ),
  });

  // ============================================================
  // RETRY STATUS
  // ============================================================

  const getStatusIcon = () => {
    if (!retryStatus) return null;

    switch (retryStatus.status) {
      case "sending":
        return (
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        );

      case "waiting":
        return (
          <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
        );

      case "success":
        return (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        );

      case "failed":
        return (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        );
    }
  };

  const getStatusColor = () => {
    if (!retryStatus) return "bg-muted";

    switch (retryStatus.status) {
      case "sending":
        return "bg-blue-500/10 border-blue-500/20";

      case "waiting":
        return "bg-amber-500/10 border-amber-500/20";

      case "success":
        return "bg-green-500/10 border-green-500/20";

      case "failed":
        return "bg-destructive/10 border-destructive/20";
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Meter Decommissioning"
        description="Safely remove meters from households and track history"
        badge={
          <div className="flex gap-4">
            <Badge variant="outline">
              {totalAssigned} Active
            </Badge>

            <Badge variant="secondary">
              {totalLogs} Decommissioned
            </Badge>
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <ButtonGroup>
              <Button
                variant={
                  activeTab === "assigned"
                    ? "default"
                    : "outline"
                }
                onClick={() => {
                  setActiveTab("assigned");

                  setFilters({
                    ...filters,
                    page: 1,
                  });
                }}
              >
                Assigned Meters
              </Button>

              <Button
                variant={
                  activeTab === "logs"
                    ? "default"
                    : "outline"
                }
                onClick={() => {
                  setActiveTab("logs");

                  setFilters({
                    ...filters,
                    page: 1,
                  });
                }}
              >
                Decommission Logs
              </Button>
            </ButtonGroup>

            <ButtonGroup>
              {activeTab === "assigned" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  <Input
                    placeholder="Search meter ID or HHID..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        search: e.target.value,
                        page: 1,
                      })
                    }
                    className="pl-10 w-64"
                  />
                </div>
              )}

              <Select
                value={
                  refreshInterval
                    ? String(refreshInterval)
                    : "off"
                }
                onValueChange={(v) =>
                  setRefreshInterval(
                    v === "off"
                      ? null
                      : Number(v)
                  )
                }
              >
                <SelectTrigger className="w-fit">
                  <SelectValue />
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
          TABLE
      ======================================================= */}

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background shadow-sm z-10">
              {table
                .getHeaderGroups()
                .map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(
                      (header) => (
                        <TableHead key={header.id}>
                          {flexRender(
                            header.column.columnDef
                              .header,
                            header.getContext()
                          )}
                        </TableHead>
                      )
                    )}
                  </TableRow>
                ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      activeTab === "assigned"
                        ? 6
                        : 5
                    }
                    className="h-64"
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />

                      <p className="text-muted-foreground">
                        Loading...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (
                  activeTab === "assigned"
                    ? assignedMeters
                    : logs
                ).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        activeTab === "assigned"
                          ? 6
                          : 5
                      }
                      className="h-64"
                    >
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            {activeTab ===
                            "assigned" ? (
                              <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
                            ) : (
                              <AlertCircle className="h-12 w-12 text-muted-foreground" />
                            )}
                          </EmptyMedia>

                          <EmptyTitle>
                            {activeTab ===
                            "assigned"
                              ? "No assigned meters"
                              : "No decommission history"}
                          </EmptyTitle>

                          <EmptyDescription>
                            {activeTab ===
                            "assigned"
                              ? "All meters are currently decommissioned or not assigned."
                              : "No meters have been decommissioned yet."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  table
                    .getRowModel()
                    .rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="hover:bg-muted/50"
                      >
                        {row
                          .getVisibleCells()
                          .map((cell) => (
                            <TableCell
                              key={cell.id}
                            >
                              {flexRender(
                                cell.column
                                  .columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                )
              )}
            </TableBody>
          </Table>
        </div>

        {(activeTab === "assigned"
          ? totalAssigned
          : totalLogs) > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {(filters.page - 1) *
                filters.limit +
                1}
              –
              {Math.min(
                filters.page *
                  filters.limit,
                activeTab === "assigned"
                  ? totalAssigned
                  : totalLogs
              )}{" "}
              of{" "}
              {(
                activeTab === "assigned"
                  ? totalAssigned
                  : totalLogs
              ).toLocaleString()}
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(filters.limit)}
                onValueChange={(v) =>
                  setFilters({
                    ...filters,
                    limit: Number(v),
                    page: 1,
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[10, 25, 50, 100].map(
                    (n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                      >
                        {n} rows
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      page: p.page - 1,
                    }))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs font-medium px-3">
                  Page {filters.page} of{" "}
                  {Math.ceil(
                    (activeTab === "assigned"
                      ? totalAssigned
                      : totalLogs) /
                      filters.limit
                  )}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={
                    filters.page >=
                    Math.ceil(
                      (activeTab ===
                      "assigned"
                        ? totalAssigned
                        : totalLogs) /
                        filters.limit
                    )
                  }
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      page: p.page + 1,
                    }))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          DECOMMISSION DIALOG
      ======================================================= */}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Decommission Meter
            </DialogTitle>

            <DialogDescription>
              This will send a decommission command
              to the meter and remove it from its
              household.
            </DialogDescription>
          </DialogHeader>

          {selectedMeter && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Label>Meter ID</Label>

                  <code className="block font-mono bg-muted px-2 py-1 rounded mt-1">
                    {selectedMeter.meterId}
                  </code>
                </div>

                <div>
                  <Label>Current Household</Label>

                  <div className="flex items-center gap-2 mt-1">
                    <Home className="h-4 w-4 text-muted-foreground" />

                    <code className="font-mono">
                      {selectedMeter.household?.hhid ||
                        "—"}
                    </code>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="reason">
                  Reason (optional)
                </Label>

                <Textarea
                  id="reason"
                  placeholder="e.g. Meter replaced, damaged, or returned"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  className="mt-2"
                  rows={3}
                  disabled={decommissioning}
                />
              </div>

              {/* Retry Progress Indicator */}
              {retryStatus && (
                <div
                  className={`p-4 rounded-lg border ${getStatusColor()} space-y-3`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon()}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {retryStatus.status ===
                            "sending" &&
                            "Sending Command"}

                          {retryStatus.status ===
                            "waiting" &&
                            "Waiting for Device"}

                          {retryStatus.status ===
                            "success" &&
                            "Success!"}

                          {retryStatus.status ===
                            "failed" &&
                            "Failed"}
                        </p>

                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          Attempt{" "}
                          {retryStatus.attempt}/
                          {retryStatus.maxAttempts}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {retryStatus.message}
                      </p>
                    </div>
                  </div>

                  {retryStatus.status !==
                    "success" &&
                    retryStatus.status !==
                      "failed" && (
                      <div className="space-y-2">
                        <Progress
                          value={
                            retryStatus.status ===
                            "sending"
                              ? 30
                              : ((retryStatus.attempt -
                                  1) *
                                  33.33 +
                                  33.33)
                          }
                          className="h-1.5"
                        />

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {retryStatus.status ===
                              "waiting" &&
                              `Timeout: ${
                                retryStatus.currentTimeout /
                                1000
                              }s`}
                          </span>

                          <span>
                            {retryStatus.attempt <
                              retryStatus.maxAttempts &&
                              "Will retry if no response"}
                          </span>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setRetryStatus(null);
              }}
              disabled={decommissioning}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDecommission}
              disabled={decommissioning}
            >
              {decommissioning ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Decommissioning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Decommission Meter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================
          UNASSIGN DIALOG
      ======================================================= */}

      <Dialog
        open={unassignDialogOpen}
        onOpenChange={(open) => {
          if (!unassigning) {
            setUnassignDialogOpen(open);

            if (!open) {
              setSelectedUnassignMeter(null);
            }
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50">
                <Unlink className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>

              Unassign Meter
            </DialogTitle>

            <DialogDescription>
              This will remove the meter from its current
              household assignment.
            </DialogDescription>
          </DialogHeader>

          {selectedUnassignMeter && (
            <div className="space-y-4 py-4">
              {/* Meter / Household Information */}
              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Meter ID
                  </Label>

                  <code className="mt-1 block rounded border bg-background px-2.5 py-1.5 font-mono text-sm font-semibold">
                    {selectedUnassignMeter.meterId}
                  </code>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    Current Household
                  </Label>

                  <div className="mt-1 flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />

                    <code className="font-mono text-sm font-semibold">
                      {selectedUnassignMeter.household?.hhid ||
                        "—"}
                    </code>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3.5 dark:border-orange-900/50 dark:bg-orange-950/30">
                <AlertTriangle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />

                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Unassign this meter?
                  </p>

                  <p className="text-xs leading-relaxed text-orange-700 dark:text-orange-400">
                    The meter will be removed from this
                    household assignment. This action
                    should only be performed when the
                    decommission operation has failed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnassignDialogOpen(false);
                setSelectedUnassignMeter(null);
              }}
              disabled={unassigning}
            >
              Cancel
            </Button>

            <Button
              onClick={handleUnassign}
              disabled={unassigning}
              className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              {unassigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unassigning...
                </>
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" />
                  Unassign Meter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}