/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  X,
  Activity,
  Download,
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
  EmptyContent,
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
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";

import eventsService from "@/services/events.service";

interface LiveMonitoringItem {
  device_id: string;
  hhid: string;
  last_event_timestamp: number | null;
}

export default function LiveMonitoringPage() {
  const [filters, setFilters] = useState({
    device_id: "",
    hhid: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    page: 1,
    limit: 25,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [data, setData] = useState<LiveMonitoringItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasActiveFilters = Boolean(
    filters.device_id || filters.hhid || filters.date !== new Date().toISOString().split("T")[0]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getLiveMonitoring({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        date: filters.date,
        page: filters.page,
        limit: filters.limit,
      });

      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error("Failed to load live monitoring data");
      console.error(err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    toast.success("Refreshed");
    setRefreshing(true);
    fetchData();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch all data with current filters (no pagination limit)
      const res = await eventsService.getLiveMonitoring({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        date: filters.date,
        page: 1,
        limit: 999999, // Get all records
      });

      const exportData = res.data || [];

      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Create CSV content
      const headers = ["Device ID", "HHID", "Last Event Timestamp"];

      const csvRows = [
        headers.join(","),
        ...exportData.map((item) => {
          const ts = item.last_event_timestamp;
          let formattedTimestamp = "No events";

          if (ts) {
            const timestamp = ts < 1e12 ? ts * 1000 : ts;
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              formattedTimestamp = format(date, "dd MMM yyyy, HH:mm:ss");
            } else {
              formattedTimestamp = "Invalid date";
            }
          }

          return [item.device_id, item.hhid, formattedTimestamp].join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const filename = `live_monitoring_${filters.date}${
        filters.device_id ? `_${filters.device_id}` : ""
      }${filters.hhid ? `_${filters.hhid}` : ""}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${exportData.length} records to CSV`);
    } catch (err) {
      toast.error("Failed to export data");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

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
      device_id: "",
      hhid: "",
      date: new Date().toISOString().split("T")[0],
      page: 1,
      limit: 25,
    };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const openDialog = () => {
    setTempFilters(filters);
    setDialogOpen(true);
  };

  const columns: ColumnDef<LiveMonitoringItem>[] = [
    {
      accessorKey: "device_id",
      header: "Device ID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {row.original.device_id}
        </code>
      ),
    },
    {
      accessorKey: "hhid",
      header: "HHID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {row.original.hhid}
        </code>
      ),
    },
    {
      accessorKey: "last_event_timestamp",
      header: "Last Event Timestamp",
      cell: ({ row }) => {
        const ts = row.original.last_event_timestamp;
        if (!ts) {
          return <span className="text-muted-foreground text-xs">No events</span>;
        }

        // Convert to milliseconds if needed
        const timestamp = ts < 1e12 ? ts * 1000 : ts;
        const date = new Date(timestamp);

        if (isNaN(date.getTime())) {
          return <span className="text-red-500 text-xs">Invalid date</span>;
        }

        return (
          <div className="font-mono text-xs">
            {format(date, "dd MMM yyyy, HH:mm:ss")}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / filters.limit),
  });

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Live Monitoring"
        description="Monitor assigned meters and their last connectivity timestamp"
        badge={<Badge variant="outline">{total.toLocaleString()} meters</Badge>}
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openDialog}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {
                          [
                            filters.device_id && 1,
                            filters.hhid && 1,
                            filters.date !== new Date().toISOString().split("T")[0] && 1,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Filter Live Monitoring</DialogTitle>
                    <DialogDescription>
                      Filter meters by device ID, HHID, or date
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search device..."
                          value={tempFilters.device_id}
                          onChange={(e) =>
                            setTempFilters((p) => ({
                              ...p,
                              device_id: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>HHID</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search HHID..."
                          value={tempFilters.hhid}
                          onChange={(e) =>
                            setTempFilters((p) => ({
                              ...p,
                              hhid: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={tempFilters.date}
                        onChange={(e) =>
                          setTempFilters((p) => ({
                            ...p,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={handleResetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            <Button 
              onClick={handleExportCSV} 
              disabled={exporting || loading || data.length === 0} 
              variant="outline" 
              size="icon"
              title="Export to CSV"
            >
              <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
            </Button>

            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
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
                    <TableHead key={header.id} className="bg-background">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">Loading meters...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Activity className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No meters found</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters ? "Try adjusting your filters" : "No assigned meters found"}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={handleRefresh} variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {(filters.page - 1) * filters.limit + 1}–
              {Math.min(filters.page * filters.limit, total)} of {total.toLocaleString()} meters
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(filters.limit)}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))
                }
              >
                <SelectTrigger className="w-32">
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
                  onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y">
                  Page {filters.page} of {Math.ceil(total / filters.limit) || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={filters.page >= Math.ceil(total / filters.limit)}
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