"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  Filter, RefreshCw, X, Download,
  ChevronLeft, ChevronRight, LayoutGrid,
  Table2, MapPin,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader }  from "@/components/ui/page-header";
import { Spinner }     from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast }       from "sonner";

import eventsService from "@/services/events.service";
import api           from "@/services/api";

interface DailyRow {
  device_id:         string;
  hhid:              string;
  date:              string;
  region:            string;
  connectivity:      "Yes" | "No";
  viewership:        "Yes" | "No";
  member_dec:        "Yes" | "No";
  image_rec:         "Yes" | "No" | "No Data";
  audio_fingerprint: "Yes" | "No" | "No Data";
}

interface Filters {
  device_id:    string;
  hhid:         string;
  dateFrom:     string;
  dateTo:       string;
  region:       string;
  connectivity: "Yes" | "No" | "all";
  viewership:   "Yes" | "No" | "all";
  member_dec:   "Yes" | "No" | "all";
  image_rec:    "Yes" | "No" | "all";
  page:         number;
  limit:        number;
}

const TODAY = new Date().toISOString().split("T")[0];

const DEFAULT_FILTERS: Filters = {
  device_id:    "",
  hhid:         "",
  dateFrom:     TODAY,
  dateTo:       TODAY,
  region:       "",
  connectivity: "all",
  viewership:   "all",
  member_dec:   "all",
  image_rec:    "all",
  page:         1,
  limit:        25,
};

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

function parseYMD(s: string): Date {
  return new Date(s + "T12:00:00");
}

function formatRangeLabel(from: string, to: string) {
  if (from === to) return format(parseYMD(from), "dd MMM yyyy");
  return `${format(parseYMD(from), "dd MMM yyyy")} – ${format(parseYMD(to), "dd MMM yyyy")}`;
}

export default function DailyReportPage() {
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [dialogOpen, setDialogOpen]   = useState(false);

  const [rawData, setRawData]   = useState<DailyRow[]>([]);
  const [stats, setStats]       = useState({ total: 0, connectivity: 0, viewership: 0, member_dec: 0, image_rec: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting]   = useState(false);

  const [regionOptions, setRegionOptions] = useState<string[]>([]);

  const [view, setView] = useState<"table" | "region">("table");
  const [activeRegion, setActiveRegion] = useState("all");

  const [debouncedDevice] = useDebounce(filters.device_id, 500);
  const [debouncedHhid]   = useDebounce(filters.hhid,      500);

  const isDefaultDateRange = filters.dateFrom === TODAY && filters.dateTo === TODAY;

  const hasFilters = Boolean(
    filters.device_id ||
    filters.hhid ||
    !isDefaultDateRange ||
    filters.region        ||
    filters.connectivity !== "all" ||
    filters.viewership    !== "all" ||
    filters.member_dec    !== "all" ||
    filters.image_rec     !== "all"
  );

  const activeFilterCount = [
    filters.device_id,
    filters.hhid,
    !isDefaultDateRange ? `${filters.dateFrom}_${filters.dateTo}` : "",
    filters.region,
    filters.connectivity !== "all" ? filters.connectivity : "",
    filters.viewership   !== "all" ? filters.viewership   : "",
    filters.member_dec   !== "all" ? filters.member_dec   : "",
    filters.image_rec    !== "all" ? filters.image_rec    : "",
  ].filter(Boolean).length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getDailyReport({
        device_id: debouncedDevice || undefined,
        hhid:      debouncedHhid   || undefined,
        dateFrom:  filters.dateFrom,
        dateTo:    filters.dateTo,
        region:    filters.region  || undefined,
        page:      1,
        limit:     999999,
      });
      setRawData(res.data || []);
      setStats(res.stats || { total: 0, connectivity: 0, viewership: 0, member_dec: 0, image_rec: 0 });
    } catch {
      toast.error("Failed to load daily report");
      setRawData([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [debouncedDevice, debouncedHhid, filters.dateFrom, filters.dateTo, filters.region]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    api.get<{ data: { regions: string[] } }>("/events/daily-report/regions")
      .then(({ data: res }) => setRegionOptions(res.data.regions ?? []))
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (filters.page > totalPages) setFilters(p => ({ ...p, page: 1 }));
  }, [totalPages, filters.page]);

  const devicesByRegion = useMemo(() => {
    const map = new Map<string, DailyRow[]>();
    for (const row of filteredData) {
      const list = map.get(row.region) ?? [];
      list.push(row);
      map.set(row.region, list);
    }
    return map;
  }, [filteredData]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rawData.length };
    for (const row of rawData) {
      counts[row.region] = (counts[row.region] ?? 0) + 1;
    }
    return counts;
  }, [rawData]);

  const visibleRegions = useMemo(
    () => filters.region ? regionOptions.filter(r => r === filters.region) : regionOptions,
    [regionOptions, filters.region]
  );

  useEffect(() => {
    if (activeRegion !== "all" && !visibleRegions.includes(activeRegion)) {
      setActiveRegion("all");
    }
  }, [visibleRegions, activeRegion]);

  const regionViewGroups = useMemo(() => {
    if (activeRegion === "all") {
      return Array.from(devicesByRegion.entries())
        .map(([region, devices]) => ({ region, devices }))
        .sort((a, b) => a.region.localeCompare(b.region));
    }
    const devices = devicesByRegion.get(activeRegion) ?? [];
    return [{ region: activeRegion, devices }];
  }, [devicesByRegion, activeRegion]);

  const handleApply = () => {
    const dateFrom = tempFilters.dateFrom <= tempFilters.dateTo ? tempFilters.dateFrom : tempFilters.dateTo;
    const dateTo   = tempFilters.dateFrom <= tempFilters.dateTo ? tempFilters.dateTo   : tempFilters.dateFrom;
    setFilters({ ...tempFilters, dateFrom, dateTo, page: 1 });
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setTempFilters(DEFAULT_FILTERS);
    setActiveRegion("all");
    toast("Filters cleared");
  };

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await eventsService.getDailyReport({
        device_id: filters.device_id || undefined,
        hhid:      filters.hhid      || undefined,
        dateFrom:  filters.dateFrom,
        dateTo:    filters.dateTo,
        region:    filters.region    || undefined,
        page:      1,
        limit:     999999,
      });

      const rows = (res.data || []).filter(row => {
        if (view === "region" && activeRegion !== "all" && row.region !== activeRegion) return false;
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
      const filenameDate = filters.dateFrom === filters.dateTo
        ? filters.dateFrom
        : `${filters.dateFrom}_to_${filters.dateTo}`;
      const suffix = view === "region" && activeRegion !== "all" ? `_${activeRegion}` : "";
      const a    = Object.assign(document.createElement("a"), {
        href: url, download: `daily_report_${filenameDate}${suffix}.csv`,
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

  return (
    <div className="p-4 space-y-5">
      <PageHeader
        title="Daily Report"
        description={`Combined connectivity, viewership and status · ${formatRangeLabel(filters.dateFrom, filters.dateTo)}`}
        size="sm"
        badge={
          rawData.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{rawData.length.toLocaleString()} records</Badge>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>From</Label>
                        <Input type="date" value={tempFilters.dateFrom} max={TODAY}
                          onChange={(e) => setTempFilters(p => ({ ...p, dateFrom: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>To</Label>
                        <Input type="date" value={tempFilters.dateTo} max={TODAY}
                          onChange={(e) => setTempFilters(p => ({ ...p, dateTo: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Region</Label>
                      <Select
                        value={tempFilters.region || "all"}
                        onValueChange={(v) => setTempFilters(p => ({ ...p, region: v === "all" ? "" : v }))}
                      >
                        <SelectTrigger className="text-xs"><SelectValue placeholder="All regions" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs">All regions</SelectItem>
                          {regionOptions.map((r) => (
                            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      <Tabs value={view} onValueChange={(v) => setView(v as "table" | "region")}>
        <TabsList>
          <TabsTrigger value="table" className="text-xs gap-1.5">
            <Table2 className="h-3.5 w-3.5" />
            Report Table
          </TabsTrigger>
          <TabsTrigger value="region" className="text-xs gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Device &amp; Region View
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "table" && (
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
                        No meters match your filters for {formatRangeLabel(filters.dateFrom, filters.dateTo)}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td></tr>
              ) : (
                displayData.map((row, idx) => (
                  <tr key={`${row.device_id}-${row.date}-${idx}`}
                    className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 !== 0 ? "bg-muted/20" : ""}`}>
                    <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{srStart + idx}</td>
                    <td className="px-3 py-2.5">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.hhid}</code>
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.device_id}</code>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {format(parseYMD(row.date), "dd MMM yyyy")}
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
      )}

      {view === "region" && (
        <div className="space-y-4">
          {visibleRegions.length > 0 && (
            <Tabs value={activeRegion} onValueChange={setActiveRegion}>
              <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
                <TabsTrigger value="all" className="text-xs gap-1.5 rounded-lg">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  All Regions
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-[1.25rem] tabular-nums">
                    {regionCounts["all"] ?? 0}
                  </Badge>
                </TabsTrigger>
                {visibleRegions.map((region) => (
                  <TabsTrigger key={region} value={region} className="text-xs gap-1.5 rounded-lg">
                    <MapPin className="h-3.5 w-3.5" />
                    {region}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 min-w-[1.25rem] tabular-nums">
                      {regionCounts[region] ?? 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 border rounded-md">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">Loading daily report...</p>
            </div>
          ) : regionViewGroups.every(g => g.devices.length === 0) ? (
            <div className="border rounded-md">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin className="h-12 w-12 text-muted-foreground/40" />
                  </EmptyMedia>
                  <EmptyTitle>No data found</EmptyTitle>
                  <EmptyDescription>
                    No meters match your filters for {formatRangeLabel(filters.dateFrom, filters.dateTo)}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="space-y-5">
              {regionViewGroups.map(({ region, devices }) => (
                <div key={region} className="rounded-md border shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b">
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {region}
                    </span>
                    <Badge variant="outline" className="text-xs tabular-nums">
                      {devices.length} record{devices.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground w-14">Sr.</th>
                          <th className="px-3 py-2.5 text-left   font-medium text-muted-foreground">HHID</th>
                          <th className="px-3 py-2.5 text-left   font-medium text-muted-foreground">Device ID</th>
                          <th className="px-3 py-2.5 text-left   font-medium text-muted-foreground">Date</th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Connectivity</th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Viewership</th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Member Dec</th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Recognized Image</th>
                          <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Audio Fingerprint</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map((row, idx) => (
                          <tr key={`${row.device_id}-${row.date}-${idx}`}
                            className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${idx % 2 !== 0 ? "bg-muted/20" : ""}`}>
                            <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{idx + 1}</td>
                            <td className="px-3 py-2.5">
                              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.hhid}</code>
                            </td>
                            <td className="px-3 py-2.5">
                              <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{row.device_id}</code>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">
                              {format(parseYMD(row.date), "dd MMM yyyy")}
                            </td>
                            <td className="px-3 py-2.5 text-center"><YNBadge value={row.connectivity} /></td>
                            <td className="px-3 py-2.5 text-center"><YNBadge value={row.viewership}   /></td>
                            <td className="px-3 py-2.5 text-center"><YNBadge value={row.member_dec}   /></td>
                            <td className="px-3 py-2.5 text-center"><YNBadge value={row.image_rec}    /></td>
                            <td className="px-3 py-2.5 text-center"><YNBadge value={row.audio_fingerprint} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}