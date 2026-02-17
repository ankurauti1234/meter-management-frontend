/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
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
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";

import eventsService from "@/services/events.service";

interface ConnectivityItem {
  device_id: string;
  hhid: string;
  date: string;
  connectivity: "Yes" | "No";
}

export default function ConnectivityReportPage() {
  const [filters, setFilters] = useState({
    device_id: "",
    hhid: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    status: "all",
    page: 1,
    limit: 25,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [data, setData] = useState<ConnectivityItem[]>([]);
  const [stats, setStats] = useState({ active: 0, total: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasActiveFilters = Boolean(
    filters.device_id || filters.hhid || filters.date !== new Date().toISOString().split("T")[0] || filters.status !== "all"
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getConnectivityReport({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        date: filters.date,
        status: filters.status === "all" ? undefined : (filters.status as "Yes" | "No"),
        page: filters.page,
        limit: filters.limit,
      });

      setData(res.data || []);
      setStats(res.stats || { active: 0, total: 0 });
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error("Failed to load connectivity data");
      console.error(err);
      setData([]);
      setTotal(0);
      setStats({ active: 0, total: 0 });
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
      const res = await eventsService.getConnectivityReport({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        date: filters.date,
        page: 1,
        limit: 999999,
      });

      const exportData = res.data || [];

      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      const headers = ["Device ID", "HHID", "Date", "Connectivity"];

      const csvRows = [
        headers.join(","),
        ...exportData.map((item) =>
          [item.device_id, item.hhid, item.date, item.connectivity].join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename = `connectivity_${filters.date}.csv`;

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
    setFilters({ ...tempFilters, page: 1 });
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset = {
      device_id: "",
      hhid: "",
      date: new Date().toISOString().split("T")[0],
      status: "all",
      page: 1,
      limit: 25,
    };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const columns: ColumnDef<ConnectivityItem>[] = [
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
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "connectivity",
      header: "Connectivity",
      cell: ({ row }) => (
        <Badge
          variant={row.original.connectivity === "Yes" ? "default" : "secondary"}
          className={
            row.original.connectivity === "Yes"
              ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
              : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
          }
        >
          {row.original.connectivity}
        </Badge>
      ),
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
        title="Connectivity Report"
        description="Daily connectivity status for all meters within range (IM000101-IM000600)"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline">Total: {stats.total.toLocaleString()}</Badge>
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              Active: {stats.active.toLocaleString()}
            </Badge>
          </div>
        }
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setDialogOpen(true)}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {[
                          filters.device_id && 1,
                          filters.hhid && 1,
                          filters.date !== new Date().toISOString().split("T")[0] && 1,
                          filters.status !== "all" && 1,
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Filter Connectivity</DialogTitle>
                    <DialogDescription>Filter by device, HHID, or date</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <Input
                        placeholder="IM000..."
                        value={tempFilters.device_id}
                        onChange={(e) => setTempFilters(p => ({ ...p, device_id: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HHID</Label>
                      <Input
                        placeholder="Search HHID..."
                        value={tempFilters.hhid}
                        onChange={(e) => setTempFilters(p => ({ ...p, hhid: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={tempFilters.date}
                        onChange={(e) => setTempFilters(p => ({ ...p, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                       <Label>Status</Label>
                       <Select
                         value={tempFilters.status}
                         onValueChange={(v) =>
                           setTempFilters((p) => ({ ...p, status: v }))
                         }
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="All Status" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="all">All</SelectItem>
                           <SelectItem value="Yes">Yes (Connected)</SelectItem>
                           <SelectItem value="No">No (Disconnected)</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
            <Button onClick={handleExportCSV} disabled={exporting || loading || data.length === 0} variant="outline" size="icon">
              <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <Spinner className="mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading connectivity data...</p>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Activity className="h-12 w-12 text-muted-foreground" /></EmptyMedia>
                        <EmptyTitle>No data found</EmptyTitle>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
            <p className="text-xs text-muted-foreground">Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total.toLocaleString()} meters</p>
            <div className="flex items-center gap-3">
              <Select value={String(filters.limit)} onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>)}
                </SelectContent>
              </Select>
              <ButtonGroup>
                <Button variant="outline" size="icon" onClick={() => setFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={filters.page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-medium px-3 border-y flex items-center">Page {filters.page} of {Math.ceil(total / filters.limit)}</span>
                <Button variant="outline" size="icon" onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={filters.page >= Math.ceil(total / filters.limit)}><ChevronRight className="h-4 w-4" /></Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
