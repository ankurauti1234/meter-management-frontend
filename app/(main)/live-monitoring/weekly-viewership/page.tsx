/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import ExcelJS from "exceljs";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Download,
  X,
  Image as ImageIcon,
  Fingerprint,
  CircleCheck,
  CircleX,
  MinusCircle as NoDataIcon,
  CalendarDays,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Search,
  FileSpreadsheet,
  FileText,
  ChevronDown,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import eventsService from "@/services/events.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type Metric = "image" | "audio";
type DayStatus = "Yes" | "No" | "No Data";

interface DayViewership {
  date: string;
  day: string;
  status: DayStatus;
}

interface WeeklyMeterItem {
  device_id: string;
  hhid: string;
  region: string;
  days: DayViewership[];
  matched_days: number;
  no_data_days: number;
  total_days: number;
  match_rate: number;
}

interface WeeklyStats {
  total_meters: number;
  fully_matched: number;
  partially_matched: number;
  not_matched: number;
  avg_match_rate: number;
}

interface WeeklyViewershipResponse {
  data: WeeklyMeterItem[];
  week_start: string;
  week_end: string;
  metric: Metric;
  stats: WeeklyStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ─── Metric copy ─────────────────────────────────────────────────────────────

const METRIC_CONFIG: Record<
  Metric,
  {
    label: string;
    shortLabel: string;
    icon: typeof ImageIcon;
    yesLabel: string;
    noLabel: string;
    eventNote: string;
  }
> = {
  image: {
    label: "Image Recognition",
    shortLabel: "Image",
    icon: ImageIcon,
    yesLabel: "Recognized",
    noLabel: "Not recognized",
    eventNote: "Type 29 / 30 events",
  },
  audio: {
    label: "Audio Fingerprint",
    shortLabel: "Audio",
    icon: Fingerprint,
    yesLabel: "Matched",
    noLabel: "Not matched",
    eventNote: "Type 42 events",
  },
};

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

function fmtDDMMYYYY(d: string) {
  const [y, m, dd] = d.split("-"); return `${dd}-${m}-${y}`;
}

/** Generate last N weeks as dropdown options with individual day dates */
function getWeekOptions(count: number = 12): Array<{ monday: string; label: string; days: string[] }> {
  const lastMonday = new Date(`${getLastWeekMonday()}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const monday = new Date(lastMonday);
    monday.setUTCDate(lastMonday.getUTCDate() - i * 7);
    const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
    const mondayStr = monday.toISOString().split("T")[0];
    const days = Array.from({ length: 7 }, (__, j) => {
      const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + j);
      return d.toISOString().split("T")[0];
    });
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return {
      monday: mondayStr,
      label: `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`,
      days,
    };
  });
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

async function fetchWeeklyViewership(filters: {
  device_id?: string;
  hhid?: string;
  region?: string;
  week_start?: string;
  metric: Metric;
  status?: string;
  page: number;
  limit: number;
}): Promise<WeeklyViewershipResponse> {
  const params = new URLSearchParams();
  if (filters.device_id) params.append("device_id", filters.device_id);
  if (filters.hhid) params.append("hhid", filters.hhid);
  if (filters.region) params.append("region", filters.region);
  if (filters.week_start) params.append("week_start", filters.week_start);
  params.append("metric", filters.metric);
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  params.append("page", String(filters.page));
  params.append("limit", String(filters.limit));

  const res = await api.get(`/events/weekly-viewership?${params.toString()}`);
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

function MatchRateBar({ rate }: { rate: number }) {
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
  status,
  date,
  metric,
}: {
  day: string;
  status: DayStatus;
  date: string;
  metric: Metric;
}) {
  const config = METRIC_CONFIG[metric];

  const dotClass =
    status === "Yes"
      ? "bg-emerald-500 shadow-[0_0_6px_0_rgba(16,185,129,0.5)]"
      : status === "No"
        ? "bg-red-200 border-2 border-red-400"
        : "bg-muted border-2 border-muted-foreground/20";

  const icon =
    status === "Yes" ? (
      <CircleCheck className="h-3 w-3 text-white" />
    ) : status === "No" ? (
      <CircleX className="h-3 w-3 text-red-500" />
    ) : (
      <NoDataIcon className="h-3 w-3 text-muted-foreground/60" />
    );

  const tooltipLabel =
    status === "Yes" ? config.yesLabel : status === "No" ? config.noLabel : "No data";

  const tooltipClass =
    status === "Yes" ? "text-emerald-600" : status === "No" ? "text-red-500" : "text-muted-foreground";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-0.5 cursor-default">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${dotClass}`}>
              {icon}
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">{day}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{formatDateShort(date)}</p>
          <p className={tooltipClass}>{tooltipLabel}</p>
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
    if (weekOptions.some((o) => o.monday === prev)) onChange(prev);
  };

  const goForward = () => {
    const d = new Date(`${currentMonday}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 7);
    const next = d.toISOString().split("T")[0];
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

export default function WeeklyViewershipPage() {
  const [metric, setMetric] = useState<Metric>("image");
  const [weekMonday, setWeekMonday] = useState<string>(getLastWeekMonday());

  const [filters, setFilters] = useState({
    device_id: "",
    hhid: "",
    region: "",
    status: "all",
    page: 1,
    limit: 25,
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);

  const [responseData, setResponseData] = useState<WeeklyViewershipResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const config = METRIC_CONFIG[metric];

  const hasActiveFilters = Boolean(
    filters.device_id || filters.hhid || filters.region || (filters.status !== "all")
  );

  useEffect(() => {
    api
      .get<{ data: { regions: string[] } }>("/events/daily-report/regions")
      .then(({ data: res }) => setRegionOptions(res.data.regions ?? []))
      .catch(() => setRegionOptions([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyViewership({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        region: filters.region || undefined,
        week_start: weekMonday,
        metric,
        status: filters.status !== "all" ? filters.status : undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setResponseData(res);
    } catch (err) {
      toast.error("Failed to load weekly viewership data");
      console.error(err);
      setResponseData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, weekMonday, metric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMetricChange = (value: string) => {
    setMetric(value as Metric);
    // Reset status filter when switching tabs — no_data is audio-only
    setFilters((p) => ({ ...p, page: 1, status: "all" }));
    setTempFilters((p) => ({ ...p, status: "all" }));
  };

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
    const reset = { device_id: "", hhid: "", region: "", status: "all", page: 1, limit: 25 };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const handleExportCSV = async () => {
    if (!responseData) return;
    setExporting(true);
    try {
      const res = await fetchWeeklyViewership({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        region: filters.region || undefined,
        week_start: weekMonday,
        metric,
        status: filters.status !== "all" ? filters.status : undefined,
        page: 1,
        limit: 999999,
      });

      const rows = res.data;
      if (rows.length === 0) { toast.error("No data to export"); return; }

      const dayHeaders = rows[0]?.days.map((d) => `${d.day} (${d.date})`).join(",") || "";
      const headers = `Device ID,HHID,Region,${dayHeaders},Days Matched,${config.label} Rate`;

      const csvRows = rows.map((item) => {
        const dayValues = item.days.map((d) => d.status).join(",");
        return `${item.device_id},${item.hhid},${item.region},${dayValues},${item.matched_days}/7,${item.match_rate}%`;
      });

      const csv = [headers, ...csvRows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `weekly_viewership_${metric}_${weekMonday}.csv`);
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

  // ── Export: single day Excel ──
  const handleExportSingleDay = async (date: string) => {
    setExporting(true);
    try {
      const res = await eventsService.getDailyReport({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        region: filters.region || undefined,
        date, page: 1, limit: 999999,
      });
      const rows = res.data ?? [];
      if (!rows.length) { toast.error("No data for this day"); return; }

      const FIXED_COLS = ["HHID", "Device ID", "Replacement", "Region"];
      const METRIC_LABELS = ["Connectivity", "Viewership", "Member Dec", "Recognised Image", "Audio Fingerprint"];

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Daily Report");
      const dateHeaderRow = sheet.getRow(1);
      const fieldHeaderRow = sheet.getRow(2);
      FIXED_COLS.forEach((label, i) => { fieldHeaderRow.getCell(i + 1).value = label; });
      const startCol = FIXED_COLS.length + 1;
      const endCol = startCol + METRIC_LABELS.length - 1;
      sheet.mergeCells(1, startCol, 1, endCol);
      const dateCell = dateHeaderRow.getCell(startCol);
      dateCell.value = fmtDDMMYYYY(date);
      dateCell.alignment = { horizontal: "center", vertical: "middle" };
      for (let c = startCol; c <= endCol; c++) dateHeaderRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E2F3" } };
      METRIC_LABELS.forEach((label, j) => { fieldHeaderRow.getCell(startCol + j).value = label; });
      fieldHeaderRow.eachCell(cell => { cell.font = { bold: true }; });
      rows.forEach((r, i) => {
        const row = sheet.getRow(i + 3);
        row.getCell(1).value = r.hhid; row.getCell(2).value = r.device_id;
        row.getCell(3).value = ""; row.getCell(4).value = r.region;
        row.getCell(startCol).value     = r.connectivity;
        row.getCell(startCol + 1).value = r.viewership;
        row.getCell(startCol + 2).value = r.member_dec;
        row.getCell(startCol + 3).value = r.image_rec;
        row.getCell(startCol + 4).value = r.audio_fingerprint;
      });
      [1, 2, 3, 4].forEach((c, i) => { sheet.getColumn(c).width = [12, 14, 14, 12][i]; });
      for (let c = startCol; c <= endCol; c++) sheet.getColumn(c).width = 16;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `daily_viewership_${date}.xlsx` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success(`Exported ${rows.length} meters for ${fmtDDMMYYYY(date)}`);
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const weekDays = getWeekOptions(12).find(o => o.monday === weekMonday)?.days ?? [];

  // Local search filter (client-side for quick lookup)
  const displayedData = responseData?.data.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.device_id.toLowerCase().includes(q) || item.hhid.toLowerCase().includes(q);
  }) ?? [];

  const stats = responseData?.stats;
  const pagination = responseData?.pagination;
  const MetricIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Weekly Viewership Report"
        description={
          responseData
            ? `Week of ${formatDateRange(responseData.week_start, responseData.week_end)} · Meters IM000101–IM000600 · ${config.eventNote}`
            : "Loading week..."
        }
        badge={
          stats ? (
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Total: {stats.total_meters.toLocaleString()}</Badge>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Full: {stats.fully_matched.toLocaleString()}
              </Badge>
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                Partial: {stats.partially_matched.toLocaleString()}
              </Badge>
              <Badge variant="destructive">
                None: {stats.not_matched.toLocaleString()}
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
                        {[filters.device_id, filters.hhid, filters.region, filters.status !== "all"].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Filter Weekly {config.label}</DialogTitle>
                    <DialogDescription>
                      Narrow down meters by device ID, HHID, or weekly match status
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
                      <Label>Region</Label>
                      <Select
                        value={tempFilters.region || "all"}
                        onValueChange={(v) =>
                          setTempFilters((p) => ({ ...p, region: v === "all" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All regions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All regions</SelectItem>
                          {regionOptions.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="connected">Matched every day (7/7)</SelectItem>
                          <SelectItem value="partial">Partially matched (1–6/7)</SelectItem>
                          {metric === "audio" ? (
                            <>
                              <SelectItem value="disconnected">
                                Never matched (had events, 0/7)
                              </SelectItem>
                              <SelectItem value="no_data">
                                No data (no Type 42 events all week)
                              </SelectItem>
                            </>
                          ) : (
                            <SelectItem value="disconnected">Never matched (0/7)</SelectItem>
                          )}
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

            {/* Download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting || loading || !responseData?.data.length}>
                  <Download className={`mr-2 h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
                  Download
                  <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Export options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Full week (CSV)</p>
                    <p className="text-xs text-muted-foreground">7-day grid for all meters</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Single day (Excel)</DropdownMenuLabel>
                {weekDays.map(date => (
                  <DropdownMenuItem key={date} onClick={() => handleExportSingleDay(date)} className="gap-2 cursor-pointer pl-6">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-sm">{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* ── Metric Tabs ── */}
      <Tabs value={metric} onValueChange={handleMetricChange}>
        <TabsList className="gap-1 bg-muted/50 p-1.5 rounded-xl h-auto">
          <TabsTrigger value="image" className="text-xs gap-1.5 rounded-lg">
            <ImageIcon className="h-3.5 w-3.5" />
            Image Recognition
          </TabsTrigger>
          <TabsTrigger value="audio" className="text-xs gap-1.5 rounded-lg">
            <Fingerprint className="h-3.5 w-3.5" />
            Audio Fingerprint
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Activity className="h-4 w-4 text-blue-600" />}
          label={`Avg ${config.shortLabel} Rate`}
          value={stats ? `${stats.avg_match_rate}%` : "—"}
          sub="across all meters"
          color="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          label={`${config.yesLabel} Every Day`}
          value={stats ? stats.fully_matched.toLocaleString() : "—"}
          sub="7/7 days"
          color="bg-emerald-50"
        />
        <StatCard
          icon={<MinusCircle className="h-4 w-4 text-amber-600" />}
          label={`Partially ${config.yesLabel}`}
          value={stats ? stats.partially_matched.toLocaleString() : "—"}
          sub="1–6 days"
          color="bg-amber-50"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4 text-red-600" />}
          label={`Never ${config.yesLabel}`}
          value={stats ? stats.not_matched.toLocaleString() : "—"}
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
              Fleet {config.label} Overview
            </h3>
            <span className="text-xs text-muted-foreground">
              {stats.total_meters} meters total
            </span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {stats.fully_matched > 0 && (
              <div
                className="bg-emerald-500 flex items-center justify-center transition-all"
                style={{ width: `${(stats.fully_matched / stats.total_meters) * 100}%` }}
                title={`Full: ${stats.fully_matched}`}
              >
                {stats.fully_matched / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.fully_matched / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
            {stats.partially_matched > 0 && (
              <div
                className="bg-amber-400 flex items-center justify-center"
                style={{ width: `${(stats.partially_matched / stats.total_meters) * 100}%` }}
                title={`Partial: ${stats.partially_matched}`}
              >
                {stats.partially_matched / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.partially_matched / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
            {stats.not_matched > 0 && (
              <div
                className="bg-red-400 flex items-center justify-center"
                style={{ width: `${(stats.not_matched / stats.total_meters) * 100}%` }}
                title={`None: ${stats.not_matched}`}
              >
                {stats.not_matched / stats.total_meters > 0.08 && (
                  <span className="text-[10px] text-white font-bold">
                    {Math.round((stats.not_matched / stats.total_meters) * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Fully {config.yesLabel.toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-muted-foreground">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-muted-foreground">Never {config.yesLabel.toLowerCase()}</span>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-28">
                    Region
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Mon – Sun (7 days)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-20">
                    Days
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-36">
                    {config.label} Rate
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <TableSkeleton rows={filters.limit > 25 ? 15 : 10} />
                    </td>
                  </tr>
                ) : displayedData.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <MetricIcon className="h-10 w-10 text-muted-foreground/40" />
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
                        <span className="text-xs text-muted-foreground">
                          {item.region}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.days.map((day) => (
                            <DayDot
                              key={day.date}
                              day={day.day}
                              status={day.status}
                              date={day.date}
                              metric={metric}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className={`text-xs font-bold tabular-nums ${getRateColor(item.match_rate)}`}
                        >
                          {item.matched_days}/7
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <MatchRateBar rate={item.match_rate} />
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
            <CircleCheck className="h-2.5 w-2.5 text-white" />
          </div>
          {config.yesLabel} ({config.eventNote})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-200 border-2 border-red-400 flex items-center justify-center">
            <CircleX className="h-2.5 w-2.5 text-red-500" />
          </div>
          {config.noLabel}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-muted border-2 border-muted-foreground/20 flex items-center justify-center">
            <NoDataIcon className="h-2.5 w-2.5 text-muted-foreground/60" />
          </div>
          No data received
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-400" />
          {config.label} rate bar
        </div>
      </div>
    </div>
  );
}