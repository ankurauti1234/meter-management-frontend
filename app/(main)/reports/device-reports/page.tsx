"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  Download, RefreshCw, Search, FileSpreadsheet,
  HeartPulse, WifiOff, ChevronLeft, ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";

import deviceReportsService, { DeviceReportRecord } from "@/services/device-reports.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * date_label is "DD-MM-YYYY" representing the START of the Lambda's 24-h window.
 * The report covers data from date_label 02:00 AM → next day 02:00 AM (Yerevan time).
 * We display it as the reporting date in a readable format.
 */
function parseDateLabel(label: string): Date | null {
  // label format: "DD-MM-YYYY"
  const parts = label.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
}

function getDayName(dt: Date | null): string {
  if (!dt) return "—";
  return format(dt, "EEEE"); // e.g. "Tuesday"
}

function formatReportDate(label: string): string {
  const dt = parseDateLabel(label);
  if (!dt) return label;
  return format(dt, "dd MMM yyyy"); // e.g. "13 May 2026"
}

function formatGeneratedAt(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm:ss") + " UTC";
  } catch {
    return iso;
  }
}

// ── Report Table ──────────────────────────────────────────────────────────────

interface ReportTableProps {
  type: "health" | "silent";
}

function ReportTable({ type }: ReportTableProps) {
  const [data, setData]       = useState<DeviceReportRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(25);

  const [debouncedSearch] = useDebounce(search, 500);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const fn = type === "health"
        ? deviceReportsService.getHealthReports
        : deviceReportsService.getSilentReports;
      const res = await fn.call(deviceReportsService, {
        page, limit, search: debouncedSearch || undefined,
      });
      setData(res.data);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch {
      toast.error(`Failed to load ${type === "health" ? "Device Health" : "Silent Device"} reports`);
      setData([]); setTotal(0);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [type, page, limit, debouncedSearch]);

  useEffect(() => { fetch(); }, [fetch]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch, type]);

  const handleRefresh = () => { setRefreshing(true); fetch(); };

  const handleDownload = (record: DeviceReportRecord) => {
    const a = Object.assign(document.createElement("a"), {
      href: record.s3_url,
      target: "_blank",
      rel: "noopener noreferrer",
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloading report for ${formatReportDate(record.date_label)}`);
  };

  const srStart = (page - 1) * limit + 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by date (e.g. 13-05-2026)..."
            className="pl-10 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {total > 0 && (
          <Badge variant="outline" className="gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {total} report{total !== 1 ? "s" : ""}
          </Badge>
        )}

        <div className="flex-1" />

        <Button
          variant="outline" size="icon" className="h-9 w-9"
          onClick={handleRefresh} disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden shadow-sm">
        {/* Sticky header — outside scroll container */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="px-9 py-3 text-left font-medium text-muted-foreground w-16">Sr. No.</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Day</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Generated At</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Download</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[65vh] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs">
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Spinner className="h-8 w-8" />
                      <p className="text-sm text-muted-foreground">Loading reports...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40" />
                        </EmptyMedia>
                        <EmptyTitle>No reports found</EmptyTitle>
                        <EmptyDescription>
                          {search
                            ? "No reports match the search term"
                            : "No reports have been generated yet"}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </td>
                </tr>
              ) : (
                data.map((record, idx) => {
                  const dt = parseDateLabel(record.date_label);
                  return (
                    <tr
                      key={record.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      {/* Sr. No. */}
                      <td className="px-4 py-3 w-16 text-center tabular-nums text-muted-foreground">
                        {srStart + idx}
                      </td>

                      {/* Date — "13 May 2026" with subtitle showing the 24-h window */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {formatReportDate(record.date_label)}
                        </p>
                      </td>

                      {/* Day */}
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {getDayName(dt)}
                        </Badge>
                      </td>

                      {/* Generated At */}
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {formatGeneratedAt(record.createdAt)}
                      </td>

                      {/* Download */}
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => handleDownload(record)}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {srStart}–{Math.min(page * limit, total).toLocaleString()} of {total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(limit)}
                onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
              >
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ButtonGroup>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8 tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline" size="icon" className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeviceReportsPage() {
  const [active, setActive] = useState<"health" | "silent">("health");

  const isHealth = active === "health";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Reports"
        description="Download generated device health and silent device reports"
      />

      {/* Toggle switch */}
      <div className="flex items-center gap-1 p-1 rounded-lg border bg-muted/30 w-fit">
        <button
          onClick={() => setActive("health")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            isHealth
              ? "bg-background shadow-sm text-foreground border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HeartPulse className="h-4 w-4" />
          Device Health Report
        </button>
        <button
          onClick={() => setActive("silent")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !isHealth
              ? "bg-background shadow-sm text-foreground border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <WifiOff className="h-4 w-4" />
          Silent Device Report
        </button>
      </div>

      {/* Description pill */}
      <p className="text-xs text-muted-foreground -mt-2">
        {isHealth
          ? "Reports generated by the Device Health Lambda — covers device status, firmware, heartbeat, and action required."
          : "Reports generated by the Silent Device Lambda — covers meters with no data activity in the reporting window."}
      </p>

      {/* Table — key forces remount on switch so state resets cleanly */}
      <ReportTable key={active} type={active} />
    </div>
  );
}