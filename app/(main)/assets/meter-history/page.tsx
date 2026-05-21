/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { format, formatDistanceStrict } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  Download, Filter, X, RefreshCw, Search,
  ChevronLeft, ChevronRight, ClipboardClock,
  Wifi, WifiOff, ArrowRight, History, Cpu,
  Home, CalendarDays, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  meterId: "", hhid: "",
  assigned_from: "", assigned_to: "",
  decommissioned_from: "", decommissioned_to: "",
  page: 1, limit: 25,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApiParams(f: Filters) {
  return {
    page: f.page, limit: f.limit,
    meterId: f.meterId || undefined,
    hhid: f.hhid || undefined,
    assigned_from: f.assigned_from ? new Date(f.assigned_from).toISOString() : undefined,
    assigned_to: f.assigned_to ? new Date(f.assigned_to + "T23:59:59").toISOString() : undefined,
    decommissioned_from: f.decommissioned_from ? new Date(f.decommissioned_from).toISOString() : undefined,
    decommissioned_to: f.decommissioned_to ? new Date(f.decommissioned_to + "T23:59:59").toISOString() : undefined,
  };
}

function duration(start: string, end: string | null) {
  return formatDistanceStrict(new Date(start), end ? new Date(end) : new Date(), { addSuffix: false });
}

function fmt(iso: string) {
  return {
    date: format(new Date(iso), "dd MMM yyyy"),
    time: format(new Date(iso), "HH:mm:ss"),
  };
}

function exportToCSV(data: MeterHistoryRecord[]) {
  const headers = ["Sr No.", "Meter ID", "HHID", "Assigned At", "Decommissioned At", "Duration"];
  const rows = data.map((r, i) => [
    i + 1, r.meterId, r.hhid,
    format(new Date(r.assignedAt), "dd MMM yyyy HH:mm:ss"),
    r.decommissionedAt ? format(new Date(r.decommissionedAt), "dd MMM yyyy HH:mm:ss") : "Active",
    duration(r.assignedAt, r.decommissionedAt),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url, download: `meter-history-${format(new Date(), "dd-MM-yyyy")}.csv`,
  });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Group flat records into HHID-keyed buckets, sorted newest first per HHID
function groupByHhid(records: MeterHistoryRecord[]): Map<string, MeterHistoryRecord[]> {
  const map = new Map<string, MeterHistoryRecord[]>();
  for (const r of records) {
    const bucket = map.get(r.hhid) ?? [];
    bucket.push(r);
    map.set(r.hhid, bucket);
  }
  // Sort each bucket: active first, then by assignedAt desc
  for (const [key, bucket] of map) {
    map.set(key, bucket.sort((a, b) => {
      if (!a.decommissionedAt) return -1;
      if (!b.decommissionedAt) return 1;
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
    }));
  }
  return map;
}

// ─── Timeline entry ───────────────────────────────────────────────────────────

function TimelineEntry({ record, isFirst, isLast }: {
  record: MeterHistoryRecord; isFirst: boolean; isLast: boolean;
}) {
  const assigned = fmt(record.assignedAt);
  const decomm = record.decommissionedAt ? fmt(record.decommissionedAt) : null;

  return (
    <div className="flex gap-3">
      {/* Spine */}
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full mt-1 shrink-0 bg-muted-foreground/40" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      {/* Card */}
      <div className="mb-3 flex-1 rounded-lg border px-3 py-2.5 text-xs bg-muted/30">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <code className="font-mono font-medium text-foreground">{record.meterId}</code>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Retired</Badge>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {duration(record.assignedAt, record.decommissionedAt)}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <div className="flex items-start gap-1.5">
            <CalendarDays className="h-3 w-3 mt-0.5 text-blue-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Assigned</p>
              <p className="font-mono text-foreground">{assigned.date}</p>
              <p className="font-mono text-muted-foreground">{assigned.time}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Clock className="h-3 w-3 mt-0.5 text-rose-500 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">Decommissioned</p>
              {decomm ? (
                <>
                  <p className="font-mono text-foreground">{decomm.date}</p>
                  <p className="font-mono text-muted-foreground">{decomm.time}</p>
                </>
              ) : (
                <p className="text-emerald-600 font-medium">Still active</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HHID Group Card ──────────────────────────────────────────────────────────

function HhidGroupCard({ hhid, records, activeMeterId }: { hhid: string; records: MeterHistoryRecord[]; activeMeterId: string | null }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">

      {/* Single compact row — always visible */}
      <div className="flex items-center gap-3 px-3 py-2.5">

        {/* HHID */}
        <div className="flex items-center gap-1.5 w-28 shrink-0">
          <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <code className="text-xs font-mono font-semibold">{hhid}</code>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        {/* Active meter */}
        {activeMeterId ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <code className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">{activeMeterId}</code>
            <Badge className="text-[10px] px-1.5 h-4 bg-emerald-500 hover:bg-emerald-500 text-white ml-1">Active</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-1 text-xs text-muted-foreground">
            <WifiOff className="h-3 w-3 shrink-0" />
            <span>No active meter</span>
          </div>
        )}

        {/* History toggle */}
        {records.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-auto"
          >
            <History className="h-3 w-3" />
            <span>{records.length} retired</span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Expandable history timeline */}
      {expanded && records.length > 0 && (
        <div className="border-t px-3 pt-2.5 pb-1.5 bg-muted/20">
          {records.map((r, i) => (
            <TimelineEntry key={r.id} record={r} isFirst={i === 0} isLast={i === records.length - 1} />
          ))}
        </div>
      )}

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MeterHistoryPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");

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
      setData([]); setTotal(0);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [debouncedMeterId, debouncedHhid, filters.assigned_from, filters.assigned_to,
    filters.decommissioned_from, filters.decommissioned_to, filters.page, filters.limit]);

  useEffect(() => { fetchData(); }, [fetchData]);



  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setFilterDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS); setTempFilters(DEFAULT_FILTERS);
    toast("Filters cleared");
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
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const grouped = groupByHhid(data);

  return (
    <div className="p-4 space-y-5">
      <PageHeader
        title="Meter Assignment History"
        description="Active meters and full assignment timeline per household"
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
            {/* Quick search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Meter ID..." className="pl-9 h-9 w-36"
                value={filters.meterId}
                onChange={(e) => setFilters(p => ({ ...p, meterId: e.target.value, page: 1 }))} />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="HHID..." className="pl-9 h-9 w-32"
                value={filters.hhid}
                onChange={(e) => setFilters(p => ({ ...p, hhid: e.target.value, page: 1 }))} />
            </div>

            {/* View toggle */}
            <ButtonGroup>
              <Button size="sm" variant={viewMode === "grouped" ? "default" : "outline"}
                onClick={() => setViewMode("grouped")} className="gap-1.5">
                <Home className="h-3.5 w-3.5" /> By Household
              </Button>
              <Button size="sm" variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")} className="gap-1.5">
                <ClipboardClock className="h-3.5 w-3.5" /> Table
              </Button>
            </ButtonGroup>

            {/* Date filters */}
            <ButtonGroup>
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"
                    onClick={() => { setTempFilters(filters); setFilterDialogOpen(true); }}>
                    <Filter className="mr-2 h-4 w-4" />
                    Date Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter by Date</DialogTitle>
                    <DialogDescription>Filter records by assignment or decommission date ranges.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Meter ID</Label>
                        <Input placeholder="IM000101..."
                          value={tempFilters.meterId}
                          onChange={(e) => setTempFilters(p => ({ ...p, meterId: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>HHID</Label>
                        <Input placeholder="HH1001..."
                          value={tempFilters.hhid}
                          onChange={(e) => setTempFilters(p => ({ ...p, hhid: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-blue-500" /> Assigned At
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">From</p>
                          <Input type="date" value={tempFilters.assigned_from}
                            onChange={(e) => setTempFilters(p => ({ ...p, assigned_from: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">To</p>
                          <Input type="date" value={tempFilters.assigned_to}
                            onChange={(e) => setTempFilters(p => ({ ...p, assigned_to: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-rose-500" /> Decommissioned At
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">From</p>
                          <Input type="date" value={tempFilters.decommissioned_from}
                            onChange={(e) => setTempFilters(p => ({ ...p, decommissioned_from: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">To</p>
                          <Input type="date" value={tempFilters.decommissioned_to}
                            onChange={(e) => setTempFilters(p => ({ ...p, decommissioned_to: e.target.value }))} />
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

            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || total === 0}>
              <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9"
              onClick={() => { setRefreshing(true); fetchData(); }} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </div>
      ) : data.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardClock className="h-12 w-12 text-muted-foreground/40" />
            </EmptyMedia>
            <EmptyTitle>No history found</EmptyTitle>
            <EmptyDescription>
              {hasFilters ? "No records match the current filters" : "No meter assignment history recorded yet"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : viewMode === "grouped" ? (
        /* ── Grouped view ── */
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([hhid, records]) => (
            <HhidGroupCard key={hhid} hhid={hhid} records={records} activeMeterId={records[0]?.activeMeterId ?? null} />
          ))}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total).toLocaleString()} of {total.toLocaleString()} records
              </p>
              <div className="flex items-center gap-3">
                <Select value={String(filters.limit)}
                  onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100].map(n => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ButtonGroup>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-3 border-y flex items-center h-8 tabular-nums">
                    {filters.page} / {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="rounded-md border overflow-hidden shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-background border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">Sr.</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Meter ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">HHID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-blue-500" /> Assigned At</div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-rose-500" /> Decommissioned At</div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                </tr>
              </thead>
              <tbody>
                {data.map((record, index) => {
                  const isActive = !record.decommissionedAt;
                  const srNo = (filters.page - 1) * filters.limit + index + 1;
                  return (
                    <tr key={record.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">{srNo}</td>
                      <td className="px-4 py-3">
                        <code className="font-mono bg-muted px-2 py-1 rounded">{record.meterId}</code>
                      </td>
                      <td className="px-4 py-3">
                        <code className="font-mono text-muted-foreground">{record.hhid}</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono">{fmt(record.assignedAt).date}</div>
                        <div className="font-mono text-muted-foreground">{fmt(record.assignedAt).time}</div>
                      </td>
                      <td className="px-4 py-3">
                        {record.decommissionedAt ? (
                          <>
                            <div className="font-mono">{fmt(record.decommissionedAt).date}</div>
                            <div className="font-mono text-muted-foreground">{fmt(record.decommissionedAt).time}</div>
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px]">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Retired</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {duration(record.assignedAt, record.decommissionedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground">
                {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total).toLocaleString()} of {total.toLocaleString()} records
              </p>
              <div className="flex items-center gap-3">
                <Select value={String(filters.limit)}
                  onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}>
                  <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100].map(n => (
                      <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ButtonGroup>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={filters.page === 1}
                    onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-3 border-y flex items-center h-8 tabular-nums">
                    {filters.page} / {totalPages}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}