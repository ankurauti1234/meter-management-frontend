/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  X,
  Wifi,
  WifiOff,
  CalendarDays,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Search,
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
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import api from "@/services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayConnectivity {
  date: string;
  day: string;
  connected: boolean;
}

interface WeeklyMeterItem {
  device_id: string;
  hhid: string;
  days: DayConnectivity[];
  connected_days: number;
  total_days: number;
  connectivity_rate: number;
}

interface WeeklyStats {
  total_meters: number;
  fully_connected: number;
  partially_connected: number;
  not_connected: number;
  avg_connectivity_rate: number;
}

interface WeeklyConnectivityResponse {
  data: WeeklyMeterItem[];
  week_start: string;
  week_end: string;
  stats: WeeklyStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

/** Monday of the current (ongoing) week */
function getCurrentWeekMonday(): string {
  return getMondayOfWeek(new Date().toISOString().split("T")[0]);
}

/** Monday of last week — the most recent completed Mon–Sun */
function getLastWeekMonday(): string {
  const currentMonday = new Date(`${getCurrentWeekMonday()}T00:00:00Z`);
  currentMonday.setUTCDate(currentMonday.getUTCDate() - 7);
  return currentMonday.toISOString().split("T")[0];
}

/** Generate last N weeks as dropdown options, most recent first */
function getWeekOptions(count: number = 12): Array<{ monday: string; label: string }> {
  const options = [];
  const lastMonday = new Date(`${getLastWeekMonday()}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    const monday = new Date(lastMonday);
    monday.setUTCDate(lastMonday.getUTCDate() - i * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const mondayStr = monday.toISOString().split("T")[0];
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const label = `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
    options.push({ monday: mondayStr, label });
  }
  return options;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

function formatDateShort(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getRateColor(rate: number): string {
  if (rate === 100) return "text-emerald-600";
  if (rate >= 71) return "text-blue-600";
  if (rate >= 43) return "text-amber-600";
  return "text-red-600";
}

function getRateBg(rate: number): string {
  if (rate === 100) return "bg-emerald-500";
  if (rate >= 71) return "bg-blue-500";
  if (rate >= 43) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Service ─────────────────────────────────────────────────────────────────

async function fetchWeeklyConnectivity(filters: {
  device_id?: string;
  hhid?: string;
  week_start?: string;
  status?: string;
  page: number;
  limit: number;
}): Promise<WeeklyConnectivityResponse> {
  const params = new URLSearchParams();
  if (filters.device_id) params.append("device_id", filters.device_id);
  if (filters.hhid) params.append("hhid", filters.hhid);
  if (filters.week_start) params.append("week_start", filters.week_start);
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  params.append("page", String(filters.page));
  params.append("limit", String(filters.limit));

  const res = await api.get(`/events/weekly-connectivity?${params.toString()}`);
  return res.data.data;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3 shadow-sm">
      <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ConnectivityBar({ rate, days }: { rate: number; days: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getRateBg(rate)}`}
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${getRateColor(rate)}`}>
        {rate}%
      </span>
    </div>
  );
}

function DayDot({
  day,
  connected,
  date,
}: {
  day: string;
  connected: boolean;
  date: string;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-0.5 cursor-default">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all
                ${connected
                  ? "bg-emerald-500 shadow-[0_0_6px_0_rgba(16,185,129,0.5)]"
                  : "bg-red-200 border-2 border-red-400"
                }`}
            >
              {connected ? (
                <Wifi className="h-3 w-3 text-white" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">{day}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{formatDateShort(date)}</p>
          <p className={connected ? "text-emerald-600" : "text-red-500"}>
            {connected ? "Connected" : "No data"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WeekNavigator({
  currentMonday,
  onChange,
}: {
  currentMonday: string;
  onChange: (monday: string) => void;
}) {
  const weekOptions = getWeekOptions(12);
  const lastWeekMonday = getLastWeekMonday();

  const goBack = () => {
    const d = new Date(`${currentMonday}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 7);
    const prev = d.toISOString().split("T")[0];
    // Only allow going back if it exists in our options
    if (weekOptions.some((o) => o.monday === prev)) onChange(prev);
  };

  const goForward = () => {
    const d = new Date(`${currentMonday}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7);
    const next = d.toISOString().split("T")[0];
    // Only allow going forward up to last week (no future/current week)
    if (weekOptions.some((o) => o.monday === next)) onChange(next);
  };

  const isLastWeek = currentMonday === lastWeekMonday;
  const isOldest = currentMonday === weekOptions[weekOptions.length - 1]?.monday;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={goBack}
        disabled={isOldest}
        className="h-8 w-8"
        title="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={currentMonday} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-52 text-xs">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {weekOptions.map((opt, idx) => (
            <SelectItem key={opt.monday} value={opt.monday} className="text-xs">
              {opt.label}{idx === 0 ? "  (last week)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={goForward}
        disabled={isLastWeek}
        className="h-8 w-8"
        title="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0"
        >
          <div className="h-4 bg-muted rounded w-24" />
          <div className="h-4 bg-muted rounded w-20" />
          <div className="flex gap-1 flex-1">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="w-6 h-6 bg-muted rounded-full" />
            ))}
          </div>
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WeeklyConnectivityPage() {
  const [weekMonday, setWeekMonday] = useState<string>(getLastWeekMonday());

  const [filters, setFilters] = useState({
    device_id: "",
    hhid: "",
    status: "all",
    page: 1,
    limit: 25,
  });
  const [tempFilters, setTempFilters] = useState(filters);

  const [responseData, setResponseData] = useState<WeeklyConnectivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hasActiveFilters = Boolean(
    filters.device_id || filters.hhid || filters.status !== "all"
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyConnectivity({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        week_start: weekMonday,
        status: filters.status !== "all" ? filters.status : undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setResponseData(res);
    } catch (err) {
      toast.error("Failed to load weekly connectivity data");
      console.error(err);
      setResponseData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, weekMonday]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when week changes
  const handleWeekChange = (monday: string) => {
    setWeekMonday(monday);
    setFilters((p) => ({ ...p, page: 1 }));
  };

  const handleRefresh = () => {
    toast.success("Refreshed");
    setRefreshing(true);
    fetchData();
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset = { device_id: "", hhid: "", status: "all", page: 1, limit: 25 };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const handleExportCSV = async () => {
    if (!responseData) return;
    setExporting(true);
    try {
      const res = await fetchWeeklyConnectivity({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        week_start: weekMonday,
        page: 1,
        limit: 999999,
      });

      const rows = res.data;
      if (rows.length === 0) { toast.error("No data to export"); return; }

      const dayHeaders = rows[0]?.days.map((d) => `${d.day} (${d.date})`).join(",") || "";
      const headers = `Device ID,HHID,${dayHeaders},Connected Days,Connectivity Rate`;

      const csvRows = rows.map((item) => {
        const dayValues = item.days.map((d) => (d.connected ? "Yes" : "No")).join(",");
        return `${item.device_id},${item.hhid},${dayValues},${item.connected_days}/7,${item.connectivity_rate}%`;
      });

      const csv = [headers, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `weekly_connectivity_${weekMonday}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${rows.length} records`);
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Local search filter (client-side for quick lookup)
  const displayedData = responseData?.data.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.device_id.toLowerCase().includes(q) || item.hhid.toLowerCase().includes(q);
  }) ?? [];

  const stats = responseData?.stats;
  const pagination = responseData?.pagination;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Weekly Connectivity Report"
        description={
          responseData
            ? `Week of ${formatDateRange(responseData.week_start, responseData.week_end)} · Meters IM000101–IM000600`
            : "Loading week..."
        }
        badge={
          stats ? (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Total: {stats.total_meters.toLocaleString()}</Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Full: {stats.fully_connected.toLocaleString()}
              </Badge>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                Partial: {stats.partially_connected.toLocaleString()}
              </Badge>
              <Badge variant="destructive">
                None: {stats.not_connected.toLocaleString()}
              </Badge>
            </div>
          ) : null
        }
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Week navigator */}
            <WeekNavigator currentMonday={weekMonday} onChange={handleWeekChange} />

            {/* Filters */}
            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {[filters.device_id, filters.hhid, filters.status !== "all"].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Filter Weekly Connectivity</DialogTitle>
                    <DialogDescription>
                      Narrow down meters by device ID, HHID, or connectivity status
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <Input
                        placeholder="IM000..."
                        value={tempFilters.device_id}
                        onChange={(e) =>
                          setTempFilters((p) => ({ ...p, device_id: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HHID</Label>
                      <Input
                        placeholder="Search HHID..."
                        value={tempFilters.hhid}
                        onChange={(e) =>
                          setTempFilters((p) => ({ ...p, hhid: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Week Status</Label>
                      <Select
                        value={tempFilters.status}
                        onValueChange={(v) =>
                          setTempFilters((p) => ({ ...p, status: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All meters" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All meters</SelectItem>
                          <SelectItem value="connected">Fully connected (7/7)</SelectItem>
                          <SelectItem value="partial">Partially connected (1–6/7)</SelectItem>
                          <SelectItem value="disconnected">Not connected (0/7)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApplyFilters}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={handleResetFilters} className="h-9 w-9">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            <Button
              onClick={handleExportCSV}
              disabled={exporting || loading || !responseData?.data.length}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Download className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="h-4 w-4 text-blue-600" />}
          label="Avg Connectivity"
          value={stats ? `${stats.avg_connectivity_rate}%` : "—"}
          sub="across all meters"
          color="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label="Fully Connected"
          value={stats ? stats.fully_connected.toLocaleString() : "—"}
          sub="7/7 days"
          color="bg-emerald-50"
        />
        <StatCard
          icon={<MinusCircle className="h-4 w-4 text-amber-600" />}
          label="Partially Connected"
          value={stats ? stats.partially_connected.toLocaleString() : "—"}
          sub="1–6 days"
          color="bg-amber-50"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          label="Not Connected"
          value={stats ? stats.not_connected.toLocaleString() : "—"}
          sub="0/7 days"
          color="bg-red-50"
        />
      </div>

      {/* ── Summary Bar Chart ── */}
      {stats && stats.total_meters > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Fleet Connectivity Overview
            </h3>
            <span className="text-xs text-muted-foreground">
              {stats.total_meters} meters total
            </span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {stats.fully_connected > 0 && (
              <div
                className="bg-emerald-500 flex items-center justify-center transition-all"
                style={{ width: `${(stats.fully_connected / stats.total_meters) * 100}%` }}
                title={`Full: ${stats.fully_connected}`}
              >
                {stats.fully_connected / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.fully_connected / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
            {stats.partially_connected > 0 && (
              <div
                className="bg-amber-400 flex items-center justify-center"
                style={{ width: `${(stats.partially_connected / stats.total_meters) * 100}%` }}
                title={`Partial: ${stats.partially_connected}`}
              >
                {stats.partially_connected / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.partially_connected / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
            {stats.not_connected > 0 && (
              <div
                className="bg-red-400 flex items-center justify-center"
                style={{ width: `${(stats.not_connected / stats.total_meters) * 100}%` }}
                title={`None: ${stats.not_connected}`}
              >
                {stats.not_connected / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.not_connected / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Fully connected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-muted-foreground">Not connected</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        {/* Table search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Quick search device or HHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {responseData && (
            <div className="flex items-center gap-2 ml-auto">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDateRange(responseData.week_start, responseData.week_end)}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              {/* Header */}
              <thead className="sticky top-0 z-20 bg-background border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-32">
                    Device ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-28">
                    HHID
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Mon – Sun (7 days)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-20">
                    Days
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-36">
                    Connectivity
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <TableSkeleton rows={filters.limit > 25 ? 15 : 10} />
                    </td>
                  </tr>
                ) : displayedData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <WifiOff className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No meters found</p>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedData.map((item) => (
                    <tr
                      key={item.device_id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="px-4 py-2.5">
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {item.device_id}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <code className="text-xs font-mono text-muted-foreground">
                          {item.hhid}
                        </code>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.days.map((day) => (
                            <DayDot
                              key={day.date}
                              day={day.day}
                              connected={day.connected}
                              date={day.date}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`text-xs font-bold tabular-nums ${getRateColor(item.connectivity_rate)}`}
                        >
                          {item.connected_days}/7
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <ConnectivityBar
                          rate={item.connectivity_rate}
                          days={item.connected_days}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination footer */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}–
              {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}{" "}
              of {pagination.total.toLocaleString()} meters
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(filters.limit)}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))
                }
              >
                <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)} className="text-xs">
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
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                  }
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8">
                  {pagination.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={filters.page >= pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-2">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Wifi className="h-2.5 w-2.5 text-white" />
          </div>
          Connected (events received)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-200 border-2 border-red-400 flex items-center justify-center">
            <WifiOff className="h-2.5 w-2.5 text-red-500" />
          </div>
          No data received
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-400" />
          Connectivity rate bar
        </div>
      </div>
    </div>
  );
}