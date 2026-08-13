"use client";

/**
 * DateRangeExportDialog
 * ---------------------
 * Picks any date range and exports a multi-column Excel (one block per day).
 * Respects ALL active page filters including status and metric.
 */

import { useState } from "react";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import { CalendarRange, FileSpreadsheet } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import eventsService from "@/services/events.service";

// ─── Types ───────────────────────────────────────────────────────────────────

type PageType = "connectivity" | "button_pressed" | "viewership";
type StatusFilter = "all" | "connected" | "partial" | "disconnected" | "no_data";
type MetricFilter = "image" | "audio" | "positive";

interface Props {
  /** Which page is using this dialog — determines how status filtering works */
  pageType: PageType;
  filters?: {
    device_id?: string;
    hhid?: string;
    region?: string;
    status?: StatusFilter;
    metric?: MetricFilter; // viewership only
  };
  disabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDisplay(d: Date) { return format(d, "dd MMM yyyy"); }
function fmtCell(d: Date)    { return format(d, "dd-MM-yyyy"); }

/**
 * Given a daily-report row and the page context, return whether that day
 * counts as "active" (connected / pressed / matched).
 */
function isDayActive(
  row: Record<string, string>,
  pageType: PageType,
  metric: MetricFilter
): "yes" | "no" | "nodata" {
  if (pageType === "connectivity") {
    if (row.connectivity === "Yes") return "yes";
    if (row.connectivity === "No")  return "no";
    return "nodata";
  }
  if (pageType === "button_pressed") {
    if (row.member_dec === "Yes") return "yes";
    if (row.member_dec === "No")  return "no";
    return "nodata";
  }
  // viewership
  const field = metric === "audio" ? "audio_fingerprint" : "image_rec";
  const val = row[field];
  if (val === "Yes")     return "yes";
  if (val === "No")      return "no";
  return "nodata";
}

/**
 * Given a meter's day results, decide if it passes the status filter.
 */
function meetsStatusFilter(
  dayCounts: { yes: number; no: number; nodata: number },
  totalDays: number,
  status: StatusFilter,
  pageType: PageType,
  metric: MetricFilter
): boolean {
  if (status === "all") return true;
  const { yes, nodata } = dayCounts;

  if (status === "connected") return yes === totalDays;
  if (status === "partial")   return yes > 0 && yes < totalDays;

  if (status === "disconnected") {
    // For audio viewership: had events but none matched (not all nodata)
    if (pageType === "viewership" && metric === "audio") {
      return yes === 0 && nodata < totalDays;
    }
    return yes === 0;
  }

  if (status === "no_data") {
    // Audio viewership only: all days had no Type 42 event
    return nodata === totalDays;
  }

  return true;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DateRangeExportDialog({
  pageType,
  filters = {},
  disabled = false,
}: Props) {
  const [open, setOpen]           = useState(false);
  const [range, setRange]         = useState<DateRange | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const status = filters.status ?? "all";
  const metric = filters.metric ?? "image";
  const canExport = Boolean(range?.from);

  const handleClose = () => { setOpen(false); setRange(undefined); };

  const handleExport = async () => {
    if (!range?.from) return;
    setExporting(true);

    const dateFrom = fmtYMD(range.from);
    const dateTo   = range.to ? fmtYMD(range.to) : dateFrom;

    try {
      const res = await eventsService.getDailyReport({
        device_id: filters.device_id || undefined,
        hhid:      filters.hhid      || undefined,
        region:    filters.region    || undefined,
        dateFrom,
        dateTo,
        page:  1,
        limit: 999999,
      });

      const rows = res.data ?? [];
      if (!rows.length) { toast.error("No data for this date range"); return; }

      // Unique dates sorted oldest → newest
      const dates = Array.from(new Set(rows.map(r => r.date))).sort();
      const totalDays = dates.length;

      // Pivot rows by device and compute day-activity counts
      type DeviceInfo = {
        hhid: string;
        region: string;
        byDate: Record<string, typeof rows[number]>;
        dayCounts: { yes: number; no: number; nodata: number };
      };

      const byDevice = new Map<string, DeviceInfo>();
      for (const r of rows) {
        const entry = byDevice.get(r.device_id) ?? {
          hhid: r.hhid, region: r.region,
          byDate: {},
          dayCounts: { yes: 0, no: 0, nodata: 0 },
        };
        entry.byDate[r.date] = r;
        const active = isDayActive(r as any, pageType, metric);
        entry.dayCounts[active]++;
        byDevice.set(r.device_id, entry);
      }

      // Apply status filter
      const sortedDevices = Array.from(byDevice.entries())
        .filter(([, info]) => meetsStatusFilter(info.dayCounts, totalDays, status, pageType, metric))
        .sort((a, b) => a[1].hhid.localeCompare(b[1].hhid));

      if (!sortedDevices.length) {
        toast.error("No meters match the current filters for this date range");
        return;
      }

      // Build Excel
      const FIXED_COLS    = ["HHID", "Device ID", "Replacement", "Region"];
      const METRIC_LABELS = ["Connectivity", "Viewership", "Member Dec", "Recognised Image", "Audio Fingerprint"];
      const BLOCK_FILLS   = ["FFD9E2F3", "FFF2F2F2"];

      const workbook = new ExcelJS.Workbook();
      const sheet    = workbook.addWorksheet("Daily Report");

      const dateHeaderRow  = sheet.getRow(1);
      const fieldHeaderRow = sheet.getRow(2);

      FIXED_COLS.forEach((label, i) => { fieldHeaderRow.getCell(i + 1).value = label; });

      dates.forEach((date, i) => {
        const startCol = FIXED_COLS.length + i * METRIC_LABELS.length + 1;
        const endCol   = startCol + METRIC_LABELS.length - 1;
        sheet.mergeCells(1, startCol, 1, endCol);
        const dateCell = dateHeaderRow.getCell(startCol);
        dateCell.value     = fmtCell(new Date(`${date}T00:00:00`));
        dateCell.alignment = { horizontal: "center", vertical: "middle" };
        const fill = BLOCK_FILLS[i % 2];
        for (let c = startCol; c <= endCol; c++) {
          dateHeaderRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
        }
        METRIC_LABELS.forEach((lbl, j) => { fieldHeaderRow.getCell(startCol + j).value = lbl; });
      });

      fieldHeaderRow.eachCell(cell => { cell.font = { bold: true }; });

      let rowIdx = 3;
      for (const [deviceId, info] of sortedDevices) {
        const row = sheet.getRow(rowIdx++);
        row.getCell(1).value = info.hhid;
        row.getCell(2).value = deviceId;
        row.getCell(3).value = "";
        row.getCell(4).value = info.region;
        dates.forEach((date, i) => {
          const startCol = FIXED_COLS.length + i * METRIC_LABELS.length + 1;
          const d = info.byDate[date];
          row.getCell(startCol).value     = d?.connectivity      ?? "No Data";
          row.getCell(startCol + 1).value = d?.viewership        ?? "No Data";
          row.getCell(startCol + 2).value = d?.member_dec        ?? "No Data";
          row.getCell(startCol + 3).value = d?.image_rec         ?? "No Data";
          row.getCell(startCol + 4).value = d?.audio_fingerprint ?? "No Data";
        });
      }

      [1, 2, 3, 4].forEach((c, i) => { sheet.getColumn(c).width = [12, 14, 14, 12][i]; });
      for (let c = 5; c <= FIXED_COLS.length + dates.length * METRIC_LABELS.length; c++) {
        sheet.getColumn(c).width = 16;
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob   = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const filename = dateFrom === dateTo
        ? `daily_report_${dateFrom}.xlsx`
        : `daily_report_${dateFrom}_to_${dateTo}.xlsx`;

      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);

      toast.success(
        `Exported ${sortedDevices.length} meter${sortedDevices.length !== 1 ? "s" : ""} × ${dates.length} day${dates.length !== 1 ? "s" : ""}`
      );
      handleClose();
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // Build a human-readable summary of active filters for the dialog description
  const activeFilterLabels: string[] = [];
  if (filters.region)    activeFilterLabels.push(`Region: ${filters.region}`);
  if (filters.device_id) activeFilterLabels.push(`Device: ${filters.device_id}`);
  if (filters.hhid)      activeFilterLabels.push(`HHID: ${filters.hhid}`);
  if (status !== "all")  activeFilterLabels.push(`Status: ${status.replace("_", " ")}`);
  if (pageType === "viewership" && filters.metric) {
    activeFilterLabels.push(`Metric: ${filters.metric === "image" ? "Image Recognition" : "Audio Fingerprint"}`);
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <button
          disabled={disabled}
          className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <CalendarRange className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span>Date range (Excel)</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Download Date Range
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1.5">
              <p>Pick any start and end date. Downloads an Excel file with one column block per day.</p>
              {activeFilterLabels.length > 0 && (
                <div className="rounded-md bg-muted px-3 py-2 text-xs">
                  <span className="font-medium text-foreground">Active filters applied: </span>
                  {activeFilterLabels.join(" · ")}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={{ after: today }}
            defaultMonth={today}
            numberOfMonths={1}
            className="rounded-lg border shadow-sm"
          />
          {range?.from ? (
            <div className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              {range.to && range.from.toDateString() !== range.to.toDateString()
                ? `${fmtDisplay(range.from)} → ${fmtDisplay(range.to)}`
                : fmtDisplay(range.from)}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Click a start date, then click an end date</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={!canExport || exporting} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            {exporting ? "Exporting…" : "Download Excel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}