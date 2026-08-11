/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import ExcelJS from "exceljs";
import {
  ChevronLeft, ChevronRight, Filter, RefreshCw, Download,
  X, MousePointerClick, CircleOff, CalendarDays, TrendingUp, Activity,
  CheckCircle2, XCircle, MinusCircle, Search, FileSpreadsheet,
  FileText, ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

import api from "@/services/api";
import eventsService from "@/services/events.service";
import { DateRangeExportDialog } from "@/components/reports/date-range-export-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayButtonPressed { date: string; day: string; connected: boolean; }

interface WeeklyMeterItem {
  device_id: string; hhid: string; region: string;
  days: DayButtonPressed[];
  connected_days: number; total_days: number; connectivity_rate: number;
}

interface WeeklyStats {
  total_meters: number; fully_connected: number;
  partially_connected: number; not_connected: number; avg_connectivity_rate: number;
}

interface WeeklyButtonPressedResponse {
  data: WeeklyMeterItem[]; week_start: string; week_end: string;
  stats: WeeklyStats;
  pagination: { page: number; limit: number; total: number; pages: number; };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMondayOfWeek(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const diff = d.getUTCDay() === 0 ? -6 : 1 - d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

function getWeekOptions(count = 12): Array<{ start: string; end: string; label: string; days: string[] }> {
  const todayD = new Date(); todayD.setUTCHours(0,0,0,0);
  const today  = todayD.toISOString().split("T")[0];
  const thisMonday = getMondayOfWeek(today);

  return Array.from({ length: count }, (_, i) => {
    if (i === 0) {
      // Current week: Mon → today
      const startD = new Date(`${thisMonday}T00:00:00Z`);
      const days = Array.from({ length: 7 }, (__, j) => {
        const d = new Date(startD); d.setUTCDate(startD.getUTCDate() + j);
        return d.toISOString().split("T")[0];
      }).filter(d => d <= today);
      const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      const endD = new Date(`${today}T00:00:00Z`);
      return {
        start: thisMonday, end: today, days,
        label: `${startD.toLocaleDateString("en-US", opts)} – ${endD.toLocaleDateString("en-US", { ...opts, year: "numeric" })} (this week)`,
      };
    }
    // Previous weeks: Mon → Sun
    const mondayD = new Date(`${thisMonday}T00:00:00Z`);
    mondayD.setUTCDate(mondayD.getUTCDate() - i * 7);
    const sundayD = new Date(mondayD); sundayD.setUTCDate(mondayD.getUTCDate() + 6);
    const start = mondayD.toISOString().split("T")[0];
    const end   = sundayD.toISOString().split("T")[0];
    const days  = Array.from({ length: 7 }, (__, j) => {
      const d = new Date(mondayD); d.setUTCDate(mondayD.getUTCDate() + j);
      return d.toISOString().split("T")[0];
    });
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return {
      start, end, days,
      label: `${mondayD.toLocaleDateString("en-US", opts)} – ${sundayD.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`,
    };
  });
}

function formatDateRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${new Date(`${start}T00:00:00Z`).toLocaleDateString("en-US", opts)} – ${new Date(`${end}T00:00:00Z`).toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}
function formatDateShort(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDDMMYYYY(d: string) {
  const [y, m, dd] = d.split("-"); return `${dd}-${m}-${y}`;
}
function getRateColor(r: number) { return r === 100 ? "text-emerald-600" : r >= 71 ? "text-blue-600" : r >= 43 ? "text-amber-600" : "text-red-600"; }
function getRateBg(r: number) { return r === 100 ? "bg-emerald-500" : r >= 71 ? "bg-blue-500" : r >= 43 ? "bg-amber-500" : "bg-red-500"; }

// ─── Service ─────────────────────────────────────────────────────────────────

async function fetchWeeklyButtonPressed(f: {
  device_id?: string; hhid?: string; region?: string;
  week_start?: string; status?: string; page: number; limit: number;
}): Promise<WeeklyButtonPressedResponse> {
  const p = new URLSearchParams();
  if (f.device_id) p.append("device_id", f.device_id);
  if (f.hhid) p.append("hhid", f.hhid);
  if (f.region) p.append("region", f.region);
  if (f.week_start) p.append("week_start", f.week_start);
  if (f.status && f.status !== "all") p.append("status", f.status);
  p.append("page", String(f.page)); p.append("limit", String(f.limit));
  const res = await api.get(`/events/weekly-button-pressed?${p.toString()}`);
  return res.data.data;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; }) {
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

function PressRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${getRateBg(rate)}`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${getRateColor(rate)}`}>{rate}%</span>
    </div>
  );
}

function DayDot({ day, connected, date }: { day: string; connected: boolean; date: string; }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-0.5 cursor-default">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${connected ? "bg-emerald-500 shadow-[0_0_6px_0_rgba(16,185,129,0.5)]" : "bg-red-200 border-2 border-red-400"}`}>
              {connected ? <MousePointerClick className="h-3 w-3 text-white" /> : <CircleOff className="h-3 w-3 text-red-500" />}
            </div>
            <span className="text-[9px] font-medium text-muted-foreground">{day}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold">{formatDateShort(date)}</p>
          <p className={connected ? "text-emerald-600" : "text-red-500"}>{connected ? "Pressed" : "Not pressed"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WeekNavigator({ current, onChange }: { current: string; onChange: (start: string) => void }) {
  const opts = getWeekOptions(12);
  const idx = opts.findIndex(o => o.start === current);
  const goBack = () => { if (idx < opts.length - 1) onChange(opts[idx + 1].start); };
  const goFwd  = () => { if (idx > 0)               onChange(opts[idx - 1].start); };
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={goBack} disabled={idx >= opts.length - 1} className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-52 text-xs">
          <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" /><SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o, i) => <SelectItem key={o.start} value={o.start} className="text-xs">{o.label}{i === 0 ? "  (last 7 days)" : ""}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={goFwd} disabled={idx <= 0} className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
    </div>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
          <div className="h-4 bg-muted rounded w-24" /><div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-16" />
          <div className="flex gap-1 flex-1">{Array.from({ length: 7 }).map((__, j) => <div key={j} className="w-6 h-6 bg-muted rounded-full" />)}</div>
          <div className="h-3 bg-muted rounded w-20" /><div className="h-4 bg-muted rounded w-12" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WeeklyButtonPressedPage() {
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date().toISOString().split("T")[0]));
  const [filters, setFilters] = useState({ device_id: "", hhid: "", region: "", status: "all", page: 1, limit: 25 });
  const [tempFilters, setTempFilters] = useState(filters);
  const [regionOptions, setRegionOptions] = useState<string[]>([]);
  const [responseData, setResponseData] = useState<WeeklyButtonPressedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pressedToday, setPressedToday] = useState<number | null>(null);

  const hasActiveFilters = Boolean(filters.device_id || filters.hhid || filters.region || filters.status !== "all");

  useEffect(() => {
    api.get<{ data: { regions: string[] } }>("/events/daily-report/regions")
      .then(({ data: r }) => setRegionOptions(r.data.regions ?? []))
      .catch(() => setRegionOptions([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWeeklyButtonPressed({
        device_id: filters.device_id || undefined, hhid: filters.hhid || undefined,
        region: filters.region || undefined, week_start: weekStart,
        status: filters.status !== "all" ? filters.status : undefined,
        page: filters.page, limit: filters.limit,
      });
      setResponseData(res);
    } catch { toast.error("Failed to load weekly button pressed data"); setResponseData(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filters, weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    eventsService.getButtonPressedReport({ date: today, limit: 1 })
      .then(res => setPressedToday(res.stats?.active ?? 0))
      .catch(() => setPressedToday(null));
  }, []);

  const handleWeekChange = (start: string) => { setWeekStart(start); setFilters(p => ({ ...p, page: 1 })); };
  const handleRefresh = () => { setRefreshing(true); fetchData(); };
  const handleApplyFilters = () => { setFilters({ ...tempFilters, page: 1 }); setDialogOpen(false); toast.success("Filters applied"); };
  const handleResetFilters = () => {
    const reset = { device_id: "", hhid: "", region: "", status: "all", page: 1, limit: 25 };
    setFilters(reset); setTempFilters(reset); toast("Filters cleared");
  };

  // ── Export: full week CSV ──
  const handleExportWeekCSV = async () => {
    setExporting(true);
    try {
      const res = await fetchWeeklyButtonPressed({
        device_id: filters.device_id || undefined, hhid: filters.hhid || undefined,
        region: filters.region || undefined, week_start: weekStart,
        status: filters.status !== "all" ? filters.status : undefined,
        page: 1, limit: 999999,
      });
      const rows = res.data;
      if (!rows.length) { toast.error("No data to export"); return; }
      const dayHeaders = rows[0].days.map(d => `${d.day} (${d.date})`).join(",");
      const headers = `Device ID,HHID,Region,${dayHeaders},Days Pressed,Button Press Rate`;
      const csvRows = rows.map(item =>
        `${item.device_id},${item.hhid},${item.region},${item.days.map(d => d.connected ? "Yes" : "No").join(",")},${item.connected_days}/7,${item.connectivity_rate}%`
      );
      const blob = new Blob([[headers, ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `weekly_button_pressed_${weekStart}.csv`, style: "visibility:hidden" });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success(`Exported ${rows.length} records`);
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
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
        row.getCell(1).value = r.hhid;
        row.getCell(2).value = r.device_id;
        row.getCell(3).value = "";
        row.getCell(4).value = r.region;
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
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `daily_button_pressed_${date}.xlsx` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success(`Exported ${rows.length} meters for ${fmtDDMMYYYY(date)}`);
    } catch { toast.error("Export failed"); }
    finally { setExporting(false); }
  };

  const weekDays = getWeekOptions(12).find(o => o.start === weekStart)?.days ?? [];
  const displayedData = responseData?.data.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.device_id.toLowerCase().includes(q) || item.hhid.toLowerCase().includes(q) || item.region?.toLowerCase().includes(q);
  }) ?? [];

  const stats = responseData?.stats;
  const pagination = responseData?.pagination;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Weekly Button Pressed Report"
        description={responseData ? `Week of ${formatDateRange(responseData.week_start, responseData.week_end)} · Meters IM000101–IM000600 · Type 3 & 4 events` : "Loading week..."}
        badge={stats ? (
          <div className="flex gap-2 flex-wrap">
            {/* <Badge variant="outline">Total: {stats.total_meters.toLocaleString()}</Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Full: {stats.fully_connected.toLocaleString()}</Badge>
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Partial: {stats.partially_connected.toLocaleString()}</Badge>
            <Badge variant="destructive">None: {stats.not_connected.toLocaleString()}</Badge> */}
            {pressedToday !== null && (
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                Pressed Today: {pressedToday.toLocaleString()}
              </Badge>
            )}
          </div>
        ) : null}
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <WeekNavigator current={weekStart} onChange={handleWeekChange} />

            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />Filters
                    {hasActiveFilters && <Badge variant="secondary" className="ml-2 text-xs">{[filters.device_id, filters.hhid, filters.region, filters.status !== "all"].filter(Boolean).length}</Badge>}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Filter Weekly Button Pressed</DialogTitle>
                    <DialogDescription>Narrow down meters by device ID, HHID, region, or button-pressed status</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <Input placeholder="IM000..." value={tempFilters.device_id} onChange={e => setTempFilters(p => ({ ...p, device_id: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>HHID</Label>
                      <Input placeholder="Search HHID..." value={tempFilters.hhid} onChange={e => setTempFilters(p => ({ ...p, hhid: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Region</Label>
                      <Select value={tempFilters.region || "all"} onValueChange={v => setTempFilters(p => ({ ...p, region: v === "all" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="All regions" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All regions</SelectItem>
                          {regionOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Week Status</Label>
                      <Select value={tempFilters.status} onValueChange={v => setTempFilters(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue placeholder="All meters" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All meters</SelectItem>
                          <SelectItem value="connected">Pressed every day (7/7)</SelectItem>
                          <SelectItem value="partial">Partially pressed (1–6/7)</SelectItem>
                          <SelectItem value="disconnected">Never pressed (0/7)</SelectItem>
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
              {hasActiveFilters && <Button variant="outline" size="icon" onClick={handleResetFilters} className="h-9 w-9"><X className="h-4 w-4" /></Button>}
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
                <DropdownMenuItem onClick={handleExportWeekCSV} className="gap-2 cursor-pointer">
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
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Custom range (Excel)</DropdownMenuLabel>
                <DateRangeExportDialog
                  pageType="button_pressed"
                  filters={{ device_id: filters.device_id, hhid: filters.hhid, region: filters.region, status: filters.status as any }}
                  disabled={!responseData?.data.length}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="icon" className="h-9 w-9">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Activity className="h-4 w-4 text-blue-600" />} label="Avg Press Rate" value={stats ? `${stats.avg_connectivity_rate}%` : "—"} sub="across all meters" color="bg-blue-50" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Pressed Every Day" value={stats ? stats.fully_connected.toLocaleString() : "—"} sub="7/7 days" color="bg-emerald-50" />
        <StatCard icon={<MinusCircle className="h-4 w-4 text-amber-600" />} label="Partially Pressed" value={stats ? stats.partially_connected.toLocaleString() : "—"} sub="1–6 days" color="bg-amber-50" />
        <StatCard icon={<XCircle className="h-4 w-4 text-red-600" />} label="Never Pressed" value={stats ? stats.not_connected.toLocaleString() : "—"} sub="0/7 days" color="bg-red-50" />
      </div>

      {/* ── Fleet bar ── */}
      {stats && stats.total_meters > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" />Fleet Button Press Overview</h3>
            <span className="text-xs text-muted-foreground">{stats.total_meters} meters total</span>
          </div>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
            {stats.fully_connected > 0 && <div className="bg-emerald-500 flex items-center justify-center transition-all" style={{ width: `${(stats.fully_connected / stats.total_meters) * 100}%` }} title={`Full: ${stats.fully_connected}`}>{stats.fully_connected / stats.total_meters > 0.08 && <span className="text-[10px] text-white font-bold">{Math.round((stats.fully_connected / stats.total_meters) * 100)}%</span>}</div>}
            {stats.partially_connected > 0 && <div className="bg-amber-400 flex items-center justify-center" style={{ width: `${(stats.partially_connected / stats.total_meters) * 100}%` }} title={`Partial: ${stats.partially_connected}`}>{stats.partially_connected / stats.total_meters > 0.08 && <span className="text-[10px] text-white font-bold">{Math.round((stats.partially_connected / stats.total_meters) * 100)}%</span>}</div>}
            {stats.not_connected > 0 && <div className="bg-red-400 flex items-center justify-center" style={{ width: `${(stats.not_connected / stats.total_meters) * 100}%` }} title={`None: ${stats.not_connected}`}>{stats.not_connected / stats.total_meters > 0.08 && <span className="text-[10px] text-white font-bold">{Math.round((stats.not_connected / stats.total_meters) * 100)}%</span>}</div>}
          </div>
          <div className="flex gap-4 mt-2">
            {[["bg-emerald-500", "Pressed every day"], ["bg-amber-400", "Partial"], ["bg-red-400", "Never pressed"]].map(([bg, lbl]) => (
              <div key={lbl} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${bg}`} /><span className="text-xs text-muted-foreground">{lbl}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-sm" placeholder="Quick search device, HHID or region..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          {responseData && (
            <div className="flex items-center gap-2 ml-auto">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{formatDateRange(responseData.week_start, responseData.week_end)}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[55vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-20 bg-background border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-32">Device ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-28">HHID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-24">Region</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Mon – Sun (7 days)</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-20">Days</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap w-36">Button Press Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6}><TableSkeleton rows={filters.limit > 25 ? 15 : 10} /></td></tr>
                ) : displayedData.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <CircleOff className="h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No meters found</p>
                      {hasActiveFilters && <Button variant="ghost" size="sm" onClick={handleResetFilters}>Clear filters</Button>}
                    </div>
                  </td></tr>
                ) : (
                  displayedData.map(item => (
                    <tr key={item.device_id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-2.5"><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{item.device_id}</code></td>
                      <td className="px-4 py-2.5"><code className="text-xs font-mono text-muted-foreground">{item.hhid}</code></td>
                      <td className="px-4 py-2.5"><span className="text-xs text-muted-foreground">{item.region}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.days.map(day => <DayDot key={day.date} day={day.day} connected={day.connected} date={day.date} />)}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center"><span className={`text-xs font-bold tabular-nums ${getRateColor(item.connectivity_rate)}`}>{item.connected_days}/7</span></td>
                      <td className="px-4 py-2.5"><PressRateBar rate={item.connectivity_rate} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}–{Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()} of {pagination.total.toLocaleString()} meters
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(filters.limit)} onValueChange={v => setFilters(p => ({ ...p, limit: Number(v), page: 1 }))}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{[10, 25, 50, 100].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>)}</SelectContent>
              </Select>
              <ButtonGroup>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={filters.page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8">{pagination.page} / {pagination.pages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={filters.page >= pagination.pages}><ChevronRight className="h-4 w-4" /></Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-2">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><MousePointerClick className="h-2.5 w-2.5 text-white" /></div>Pressed (Type 3/4 event received)</div>
        <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-red-200 border-2 border-red-400 flex items-center justify-center"><CircleOff className="h-2.5 w-2.5 text-red-500" /></div>Not pressed</div>
        <div className="flex items-center gap-1.5"><div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-400" />Button press rate bar</div>
      </div>
    </div>
  );
}