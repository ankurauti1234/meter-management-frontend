"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  Filter, RefreshCw, X, Download,
  ChevronLeft, ChevronRight, LayoutGrid,
} from "lucide-react";

import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader }  from "@/components/ui/page-header";
import { Spinner }     from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast }       from "sonner";

import eventsService from "@/services/events.service";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyRow {
  device_id:         string;
  hhid:              string;
  date:              string;
  region:            string;
  connectivity:      "Yes" | "No";
  viewership:        "Yes" | "No" | "No Data";
  member_dec:        "Yes" | "No";
  image_rec:         "Yes" | "No";   // backend field name
  audio_fingerprint: "Yes" | "No" | "No Data";
}

interface Filters {
  device_id:    string;
  hhid:         string;
  date:         string;
  connectivity: "Yes" | "No" | "all";
  viewership:   "Yes" | "No" | "all";
  member_dec:   "Yes" | "No" | "all";
  image_rec:    "Yes" | "No" | "all"; // backend field name
  page:         number;
  limit:        number;
}

const TODAY = new Date().toISOString().split("T")[0];

const DEFAULT_FILTERS: Filters = {
  device_id:    "",
  hhid:         "",
  date:         TODAY,
  connectivity: "all",
  viewership:   "all",
  member_dec:   "all",
  image_rec:    "all",
  page:         1,
  limit:        25,
};

// ── Yes/No/— Badge ────────────────────────────────────────────────────────────

function YNBadge({ value }: { value: "Yes" | "No" | "No Data" | string }) {
  if (value === "--" || value === "" || value === "No Data") {
    return <span className="text-muted-foreground font-medium text-xs">No Data</span>;
  }
  return (
    <Badge
      variant="outline"
      className={
        value === "Yes"
          ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-100"
          : "bg-red-100   text-red-700   border-red-300   hover:bg-red-100"
      }
    >
      {value}
    </Badge>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DailyReportPage() {
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [dialogOpen, setDialogOpen]   = useState(false);

  const [rawData, setRawData]   = useState<DailyRow[]>([]);
  const [stats, setStats]       = useState({ total: 0, connectivity: 0, viewership: 0, member_dec: 0, image_rec: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const [debouncedDevice] = useDebounce(filters.device_id, 500);
  const [debouncedHhid]   = useDebounce(filters.hhid,      500);

  const hasFilters = Boolean(
    filters.device_id ||
    filters.hhid ||
    filters.date !== TODAY ||
    filters.connectivity !== "all" ||
    filters.viewership    !== "all" ||
    filters.member_dec    !== "all" ||
    filters.image_rec     !== "all"
  );

  const activeFilterCount = [
    filters.device_id,
    filters.hhid,
    filters.date !== TODAY        ? filters.date         : "",
    filters.connectivity !== "all" ? filters.connectivity : "",
    filters.viewership   !== "all" ? filters.viewership   : "",
    filters.member_dec   !== "all" ? filters.member_dec   : "",
    filters.image_rec    !== "all" ? filters.image_rec    : "",
  ].filter(Boolean).length;

  // ── Fetch (all meters for date, client-side Yes/No filter) ──────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getDailyReport({
        device_id: debouncedDevice || undefined,
        hhid:      debouncedHhid   || undefined,
        date:      filters.date,
        page:      1,
        limit:     500, // fetch all meters for the date; client-side Yes/No filtering applied below
      });
      setRawData(res.data || []);
      setStats(res.stats || { total: 0, connectivity: 0, viewership: 0, member_dec: 0, image_rec: 0 });
    } catch {
      toast.error("Failed to load daily report");
      setRawData([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [debouncedDevice, debouncedHhid, filters.date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Client-side Yes/No filtering ─────────────────────────────────────────────

  const filteredData = useMemo(() => rawData.filter(row => {
    if (filters.connectivity !== "all" && row.connectivity !== filters.connectivity) return false;
    if (filters.viewership   !== "all" && row.viewership   !== filters.viewership)   return false;
    if (filters.member_dec   !== "all" && row.member_dec   !== filters.member_dec)   return false;
    if (filters.image_rec    !== "all" && row.image_rec    !== filters.image_rec)    return false;
    return true;
  }), [rawData, filters.connectivity, filters.viewership, filters.member_dec, filters.image_rec]);

  const total      = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const displayData = useMemo(() => {
    const start = (filters.page - 1) * filters.limit;
    return filteredData.slice(start, start + filters.limit);
  }, [filteredData, filters.page, filters.limit]);

  // Reset page if it goes out of range after filter change
  useEffect(() => {
    if (filters.page > totalPages) setFilters(p => ({ ...p, page: 1 }));
  }, [totalPages, filters.page]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleApply = () => {
    setFilters({ ...tempFilters, page: 1 });
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setTempFilters(DEFAULT_FILTERS);
    toast("Filters cleared");
  };

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await eventsService.getDailyReport({
        device_id: filters.device_id || undefined,
        hhid:      filters.hhid      || undefined,
        date:      filters.date,
        page:      1,
        limit:     999999,
      });

      const rows = (res.data || []).filter(row => {
        if (filters.connectivity !== "all" && row.connectivity !== filters.connectivity) return false;
        if (filters.viewership   !== "all" && row.viewership   !== filters.viewership)   return false;
        if (filters.member_dec   !== "all" && row.member_dec   !== filters.member_dec)   return false;
        if (filters.image_rec    !== "all" && row.image_rec    !== filters.image_rec)    return false;
        return true;
      });

      if (!rows.length) { toast.error("No data matching filters to export"); return; }

      const headers = ["HHID", "Device ID", "Date", "Region", "Connectivity", "Viewership", "Member Dec", "Recognized Image", "Audio Fingerprint"];
      const csv = [
        headers.join(","),
        ...rows.map(r => [
          `"${r.hhid}"`, `"${r.device_id}"`, `"${r.date}"`, `"${r.region}"`,
          r.connectivity, r.viewership, r.member_dec, r.image_rec, r.audio_fingerprint,
        ].join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), {
        href: url, download: `daily_report_${filters.date}.csv`,
      });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} records`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const srStart = (filters.page - 1) * filters.limit + 1;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-5">
      <PageHeader
        title="Daily Report"
        description={`Combined connectivity, viewership and status · ${format(new Date(filters.date + "T12:00:00"), "dd MMM yyyy")}`}
        size="sm"
        badge={
          rawData.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{rawData.length.toLocaleString()} meters</Badge>
              <Badge className="bg-green-600 hover:bg-green-700 text-white">Conn: {stats.connectivity}</Badge>
              <Badge className="bg-blue-600  hover:bg-blue-700  text-white">View: {stats.viewership}</Badge>
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white">Mem: {stats.member_dec}</Badge>
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white">Img: {stats.image_rec}</Badge>
            </div>
          ) : null
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Device ID..." className="h-9 w-36 text-xs"
              value={filters.device_id}
              onChange={(e) => setFilters(p => ({ ...p, device_id: e.target.value, page: 1 }))} />
            <Input placeholder="HHID..." className="h-9 w-32 text-xs"
              value={filters.hhid}
              onChange={(e) => setFilters(p => ({ ...p, hhid: e.target.value, page: 1 }))} />

            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"
                    onClick={() => { setTempFilters(filters); setDialogOpen(true); }}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter Daily Report</DialogTitle>
                    <DialogDescription>Apply field-level filters below.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div className="space-y-1.5">
                      <Label>Device ID</Label>
                      <Input placeholder="IM000..." value={tempFilters.device_id}
                        onChange={(e) => setTempFilters(p => ({ ...p, device_id: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>HHID</Label>
                      <Input placeholder="HH1001..." value={tempFilters.hhid}
                        onChange={(e) => setTempFilters(p => ({ ...p, hhid: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input type="date" value={tempFilters.date}
                        onChange={(e) => setTempFilters(p => ({ ...p, date: e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["Connectivity",     "connectivity"],
                          ["Viewership",       "viewership"],
                          ["Member Dec",       "member_dec"],
                          ["Recognized Image", "image_rec"],
                        ] as const
                      ).map(([label, key]) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Select
                            value={tempFilters[key]}
                            onValueChange={(v: "Yes" | "No" | "all") =>
                              setTempFilters(p => ({ ...p, [key]: v }))
                            }
                          >
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">All</SelectItem>
                              <SelectItem value="Yes"  className="text-xs">Yes</SelectItem>
                              <SelectItem value="No"   className="text-xs">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter className="mt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApply}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasFilters && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleClear}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            <Button variant="outline" size="sm" onClick={handleExport}
              disabled={exporting || rawData.length === 0}>
              <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting..." : "Download CSV"}
            </Button>

            <Button variant="outline" size="icon" className="h-9 w-9"
              onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Table ── */}
      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
              <tr>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground w-14">Sr.</th>
                <th className="px-3 py-3 text-left   font-medium text-muted-foreground">HHID</th>
                <th className="px-3 py-3 text-left   font-medium text-muted-foreground">Device ID</th>
                <th className="px-3 py-3 text-left   font-medium text-muted-foreground">Date</th>
                <th className="px-3 py-3 text-left   font-medium text-muted-foreground">Region</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Connectivity</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Viewership</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Member Dec</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Recognized Image</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Audio Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="h-64">
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Spinner className="h-8 w-8" />
                    <p className="text-sm text-muted-foreground">Loading daily report...</p>
                  </div>
                </td></tr>
              ) : displayData.length === 0 ? (
                <tr><td colSpan={10} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LayoutGrid className="h-12 w-12 text-muted-foreground/40" />
                      </EmptyMedia>
                      <EmptyTitle>No data found</EmptyTitle>
                      <EmptyDescription>
                        No meters match your filters for {format(new Date(filters.date + "T12:00:00"), "dd MMM yyyy")}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td></tr>
              ) : (
                displayData.map((row, idx) => (
                  <tr key={`${row.device_id}-${idx}`}
                    className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 !== 0 ? "bg-muted/20" : ""}`}>
                    <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{srStart + idx}</td>
                    <td className="px-3 py-2.5">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.hhid}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.device_id}</code>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {format(new Date(row.date + "T12:00:00"), "dd MMM yyyy")}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{row.region}</td>
                    <td className="px-3 py-2.5 text-center"><YNBadge value={row.connectivity} /></td>
                    <td className="px-3 py-2.5 text-center"><YNBadge value={row.viewership}   /></td>
                    <td className="px-3 py-2.5 text-center"><YNBadge value={row.member_dec}   /></td>
                    <td className="px-3 py-2.5 text-center"><YNBadge value={row.image_rec}    /></td>
                    <td className="px-3 py-2.5 text-center"><YNBadge value={row.audio_fingerprint} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {srStart}–{Math.min(filters.page * filters.limit, total).toLocaleString()} of {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-3">
              <Select value={String(filters.limit)}
                onValueChange={(v) => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => (
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
    </div>
  );
}