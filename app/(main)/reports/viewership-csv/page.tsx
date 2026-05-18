/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parse, isValid } from "date-fns";
import {
  Download, FileSpreadsheet, Filter, X, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import viewershipCSVService, { ViewershipCSVReport } from "@/services/viewership-csv.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse "DD-MM-YYYY" → Date object */
function parseDateLabel(label: string): Date | null {
  const d = parse(label, "dd-MM-yyyy", new Date());
  return isValid(d) ? d : null;
}

/** Format "DD-MM-YYYY" → "13 May 2026" */
function formatDateLabel(label: string): string {
  const d = parseDateLabel(label);
  return d ? format(d, "dd MMM yyyy") : label;
}

/** Format "DD-MM-YYYY" → day name */
function getDayName(label: string): string {
  const d = parseDateLabel(label);
  return d ? format(d, "EEEE") : "";
}

/** Generate last N months as MM-YYYY options */
function getMonthOptions(count = 6): Array<{ value: string; label: string }> {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      value: format(d, "MM-yyyy"),
      label: format(d, "MMMM yyyy"),
    });
  }
  return opts;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Filters {
  month: string;   // "MM-YYYY" or ""
  page: number;
  limit: number;
}

export default function ViewershipCSVPage() {
  const monthOptions = getMonthOptions(12);

  const [filters, setFilters] = useState<Filters>({
    month: "",
    page: 1,
    limit: 31,
  });
  const [tempMonth, setTempMonth] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [data, setData] = useState<ViewershipCSVReport[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);

  const hasFilter = Boolean(filters.month);
  const activeMonthLabel = monthOptions.find(o => o.value === filters.month)?.label;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await viewershipCSVService.getReports({
        month: filters.month || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setData(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.totalPages);
    } catch {
      toast.error("Failed to load viewership CSV reports");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    toast.success("Refreshed");
  };

  const handleApplyFilter = () => {
    setFilters(p => ({ ...p, month: tempMonth, page: 1 }));
    setFilterDialogOpen(false);
    toast.success(tempMonth ? "Filter applied" : "Filter cleared");
  };

  const handleClearFilter = () => {
    setFilters(p => ({ ...p, month: "", page: 1 }));
    setTempMonth("");
    toast("Filter cleared");
  };

  const handleDownload = async (report: ViewershipCSVReport) => {
    setDownloading(report.id);
    try {
      // Open S3 URL directly — browser handles the CSV download
      const a = document.createElement("a");
      a.href = report.s3_url;
      a.download = `viewership-${report.date_label}.csv`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Downloading ${formatDateLabel(report.date_label)}`);
    } catch {
      toast.error("Download failed");
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Viewership CSV Reports"
        description="Daily HHID viewership event exports. Each file contains all viewership-type events for that date."
        size="sm"
        badge={
          total > 0 ? (
            <Badge variant="outline">
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              {total} report{total !== 1 ? "s" : ""}
            </Badge>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Filter */}
            <ButtonGroup>
              <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setTempMonth(filters.month); setFilterDialogOpen(true); }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter by Month
                    {hasFilter && (
                      <Badge variant="secondary" className="ml-2 text-xs">1</Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Filter by Month</DialogTitle>
                    <DialogDescription>
                      Select a month to show only reports from that period.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select value={tempMonth || "all"} onValueChange={(v) => setTempMonth(v === "all" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All months</SelectItem>
                          {monthOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleApplyFilter}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasFilter && (
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleClearFilter}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            {/* Refresh */}
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* ── Active filter pill ── */}
      {hasFilter && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
            <Calendar className="h-3 w-3" />
            {activeMonthLabel}
          </div>
          <span className="text-xs text-muted-foreground">{total} result{total !== 1 ? "s" : ""}</span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-hidden shadow-sm">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              <TableRow>
                <TableHead className="bg-background w-16 text-center">Sr. No.</TableHead>
                <TableHead className="bg-background">Date</TableHead>
                <TableHead className="bg-background hidden sm:table-cell">Day</TableHead>
                <TableHead className="bg-background hidden md:table-cell">Generated At</TableHead>
                <TableHead className="bg-background text-right pr-6">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground text-sm">Loading reports...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40" />
                        </EmptyMedia>
                        <EmptyTitle>No reports found</EmptyTitle>
                        <EmptyDescription>
                          {hasFilter
                            ? `No viewership CSV reports exist for ${activeMonthLabel}`
                            : "No viewership CSV reports have been generated yet"}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((report, index) => {
                  const srNo = (filters.page - 1) * filters.limit + index + 1;
                  const isDownloading = downloading === report.id;
                  return (
                    <TableRow key={report.id} className="hover:bg-muted/40 transition-colors group">
                      {/* Sr. No. */}
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-muted-foreground tabular-nums">
                          {srNo}
                        </span>
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {formatDateLabel(report.date_label)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {report.date_label}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Day name */}
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs font-medium">
                          {getDayName(report.date_label)}
                        </Badge>
                      </TableCell>

                      {/* Generated At */}
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground font-mono">
                          {format(new Date(report.createdAt), "dd MMM yyyy, HH:mm")}
                        </span>
                      </TableCell>

                      {/* Download */}
                      <TableCell className="text-right pr-4">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(report)}
                          disabled={isDownloading}
                          className="gap-2 opacity-80 group-hover:opacity-100 transition-opacity"
                        >
                          {isDownloading ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          {isDownloading ? "Opening..." : "Download CSV"}
                        </Button>
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
              {Math.min(filters.page * filters.limit, total)} of {total.toLocaleString()} reports
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
                  {[15, 31, 62].map((n) => (
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
                  disabled={filters.page === 1}
                  onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8 tabular-nums">
                  {filters.page} / {pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={filters.page >= pages}
                  onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>

      {/* ── Info note ── */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Each CSV contains all HHID viewership-type events for that date, stored in S3. Files open directly in your browser or download automatically.
      </p>
    </div>
  );
}