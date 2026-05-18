/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  Download, Filter, X, RefreshCw, Search,
  ChevronLeft, ChevronRight, ClipboardClock, CalendarDays, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import decommissionService, { MeterHistoryRecord } from "@/services/decommission.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  meterId: string;
  hhid: string;
  assigned_from: string;
  assigned_to: string;
  decommissioned_from: string;
  decommissioned_to: string;
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: Filters = {
  meterId: "",
  hhid: "",
  assigned_from: "",
  assigned_to: "",
  decommissioned_from: "",
  decommissioned_to: "",
  page: 1,
  limit: 25,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApiParams(f: Filters) {
  return {
    page: f.page,
    limit: f.limit,
    meterId: f.meterId || undefined,
    hhid: f.hhid || undefined,
    assigned_from: f.assigned_from ? new Date(f.assigned_from).toISOString() : undefined,
    assigned_to: f.assigned_to ? new Date(f.assigned_to + "T23:59:59").toISOString() : undefined,
    decommissioned_from: f.decommissioned_from ? new Date(f.decommissioned_from).toISOString() : undefined,
    decommissioned_to: f.decommissioned_to ? new Date(f.decommissioned_to + "T23:59:59").toISOString() : undefined,
  };
}

function durationLabel(assignedAt: string, decommissionedAt: string | null): string {
  const start = new Date(assignedAt).getTime();
  const end = decommissionedAt ? new Date(decommissionedAt).getTime() : Date.now();
  const diffMs = end - start;
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "< 1 day";
  if (days === 1) return "1 day";
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""}`;
}

function exportToCSV(data: MeterHistoryRecord[]) {
  const headers = ["Sr No.", "Meter ID", "HHID", "Assigned At", "Decommissioned At", "Duration"];
  const rows = data.map((r, i) => [
    i + 1,
    r.meterId,
    r.hhid,
    format(new Date(r.assignedAt), "dd MMM yyyy HH:mm:ss"),
    r.decommissionedAt ? format(new Date(r.decommissionedAt), "dd MMM yyyy HH:mm:ss") : "Active",
    durationLabel(r.assignedAt, r.decommissionedAt),
  ]);

  const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meter-history-${format(new Date(), "dd-MM-yyyy")}.csv`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeterHistoryPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [data, setData] = useState<MeterHistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [debouncedMeterId] = useDebounce(filters.meterId, 500);
  const [debouncedHhid] = useDebounce(filters.hhid, 500);

  const hasFilters = Boolean(
    filters.meterId || filters.hhid ||
    filters.assigned_from || filters.assigned_to ||
    filters.decommissioned_from || filters.decommissioned_to
  );

  const activeFilterCount = [
    filters.meterId, filters.hhid,
    filters.assigned_from || filters.assigned_to,
    filters.decommissioned_from || filters.decommissioned_to,
  ].filter(Boolean).length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildApiParams({ ...filters, meterId: debouncedMeterId, hhid: debouncedHhid });
      const res = await decommissionService.getHouseholdMeterHistory(params);
      setData(res.data);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load meter history");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedMeterId, debouncedHhid, filters.assigned_from, filters.assigned_to, filters.decommissioned_from, filters.decommissioned_to, filters.page, filters.limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setFilterDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setTempFilters(DEFAULT_FILTERS);
    toast("Filters cleared");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const allData = await decommissionService.exportHouseholdMeterHistory({
        meterId: debouncedMeterId || undefined,
        hhid: debouncedHhid || undefined,
        assigned_from: filters.assigned_from ? new Date(filters.assigned_from).toISOString() : undefined,
        assigned_to: filters.assigned_to ? new Date(filters.assigned_to + "T23:59:59").toISOString() : undefined,
        decommissioned_from: filters.decommissioned_from ? new Date(filters.decommissioned_from).toISOString() : undefined,
        decommissioned_to: filters.decommissioned_to ? new Date(filters.decommissioned_to + "T23:59:59").toISOString() : undefined,
      });
      if (!allData.length) { toast.error("No data to export"); return; }
      exportToCSV(allData);
      toast.success(`Exported ${allData.length} records`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Meter Assignment History"
        description="Complete history of meter-to-household assignments and decommissions"
        size="sm"
        badge={
          total > 0 ? (
            <Badge variant="outline">
              <ClipboardClock className="h-3 w-3 mr-1" />
              {total.toLocaleString()} records
            </Badge>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inline quick search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Meter ID..."
                className="pl-9 h-9 w-40"
                value={filters.meterId}
                onChange={(e) => setFilters(p => ({ ...p, meterId: e.target.value, page: 1 }))}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="HHID..."
                className="pl-9 h-9 w-36"
                value={filters.hhid}
                onChange={(e) => setFilters(p => ({ ...p, hhid: e.target.value, page: 1 }))}
              />
            </div>

            {/* Advanced filter dialog */}
            <ButtonGroup>
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setTempFilters(filters); setFilterDialogOpen(true); }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Date Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter Meter History</DialogTitle>
                    <DialogDescription>
                      Filter by meter ID, HHID, or date ranges for assignment and decommission.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Meter ID</Label>
                        <Input
                          placeholder="IM000101..."
                          value={tempFilters.meterId}
                          onChange={(e) => setTempFilters(p => ({ ...p, meterId: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>HHID</Label>
                        <Input
                          placeholder="HH-..."
                          value={tempFilters.hhid}
                          onChange={(e) => setTempFilters(p => ({ ...p, hhid: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-blue-500" /> Assigned At
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">From</p>
                          <Input
                            type="date"
                            value={tempFilters.assigned_from}
                            onChange={(e) => setTempFilters(p => ({ ...p, assigned_from: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">To</p>
                          <Input
                            type="date"
                            value={tempFilters.assigned_to}
                            onChange={(e) => setTempFilters(p => ({ ...p, assigned_to: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-500" /> Decommissioned At
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">From</p>
                          <Input
                            type="date"
                            value={tempFilters.decommissioned_from}
                            onChange={(e) => setTempFilters(p => ({ ...p, decommissioned_from: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">To</p>
                          <Input
                            type="date"
                            value={tempFilters.decommissioned_to}
                            onChange={(e) => setTempFilters(p => ({ ...p, decommissioned_to: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApplyFilters}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {hasFilters && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleClearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || total === 0}
            >
              <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>

            {/* Refresh */}
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Table ── */}
      <div className="rounded-md border overflow-hidden shadow-sm">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              <TableRow>
                <TableHead className="bg-background w-14 text-center">Sr.</TableHead>
                <TableHead className="bg-background">Meter ID</TableHead>
                <TableHead className="bg-background">HHID</TableHead>
                <TableHead className="bg-background">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
                    Assigned At
                  </div>
                </TableHead>
                <TableHead className="bg-background">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-red-500" />
                    Decommissioned At
                  </div>
                </TableHead>
                <TableHead className="bg-background">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Spinner className="h-8 w-8" />
                      <p className="text-sm text-muted-foreground">Loading history...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ClipboardClock className="h-12 w-12 text-muted-foreground/40" />
                        </EmptyMedia>
                        <EmptyTitle>No history found</EmptyTitle>
                        <EmptyDescription>
                          {hasFilters
                            ? "No records match the current filters"
                            : "No meter assignment history has been recorded yet"}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((record, index) => {
                  const srNo = (filters.page - 1) * filters.limit + index + 1;
                  const duration = durationLabel(record.assignedAt, record.decommissionedAt);
                  return (
                    <TableRow key={record.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-center">
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">{srNo}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {record.meterId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono text-muted-foreground">
                          {record.hhid}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono">
                          {format(new Date(record.assignedAt), "dd MMM yyyy")}
                          <span className="text-muted-foreground ml-1.5">
                            {format(new Date(record.assignedAt), "HH:mm:ss")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.decommissionedAt ? (
                          <div className="text-xs font-mono">
                            {format(new Date(record.decommissionedAt), "dd MMM yyyy")}
                            <span className="text-muted-foreground ml-1.5">
                              {format(new Date(record.decommissionedAt), "HH:mm:ss")}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-medium tabular-nums">
                          {duration}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(filters.page - 1) * filters.limit + 1}–
              {Math.min(filters.page * filters.limit, total).toLocaleString()} of {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(filters.limit)}
                onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}
              >
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ButtonGroup>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8 tabular-nums">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
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