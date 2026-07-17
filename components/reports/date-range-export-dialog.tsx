"use client";

/**
 * DateRangeExportDialog
 * ---------------------
 * Picks any date range and exports a multi-column Excel (one block per day),
 * scoped to whatever meters are currently visible on the page.
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

interface Props {
  /** Carry the active page filters into the fetch so only filtered meters export */
  filters?: {
    device_id?: string;
    hhid?: string;
    region?: string;
  };
  disabled?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtDisplay(d: Date) { return format(d, "dd MMM yyyy"); }
function fmtCell(d: Date)    { return format(d, "dd-MM-yyyy"); }

// ─── Component ───────────────────────────────────────────────────────────────

export function DateRangeExportDialog({ filters = {}, disabled = false }: Props) {
  const [open, setOpen]           = useState(false);
  const [range, setRange]         = useState<DateRange | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

      // Unique dates sorted oldest → newest; pivot by device
      const dates = Array.from(new Set(rows.map(r => r.date))).sort();

      type DeviceInfo = {
        hhid: string;
        region: string;
        byDate: Record<string, typeof rows[number]>;
      };

      const byDevice = new Map<string, DeviceInfo>();
      for (const r of rows) {
        const entry = byDevice.get(r.device_id) ?? { hhid: r.hhid, region: r.region, byDate: {} };
        entry.byDate[r.date] = r;
        byDevice.set(r.device_id, entry);
      }
      const sortedDevices = Array.from(byDevice.entries()).sort((a, b) =>
        a[1].hhid.localeCompare(b[1].hhid)
      );

      // Build Excel — same layout as the daily-report page
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
          <DialogDescription>
            Pick any start and end date — not limited to the current week.
            Downloads an Excel file with one column block per day.
            {(filters.device_id || filters.hhid || filters.region) && (
              <span className="mt-1 block font-medium text-foreground">
                Active filters will be applied to the export.
              </span>
            )}
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
            <p className="text-xs text-muted-foreground">
              Click a start date, then click an end date
            </p>
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