/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import {
  ColumnDef, flexRender, getCoreRowModel, useReactTable,
} from "@tanstack/react-table";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, X, Calendar, CalendarRange,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import api from "@/services/api";

/* ─── Types ────────────────────────────────────────────────────── */
interface InstalledMeter {
  meterId: string;
  assignedHouseholdId: string;
  meterType?: string | null;
  assetSerialNumber?: string | null;
  installedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/* ─── Quick date range presets ─────────────────────────────────── */
const today = () => new Date();

const PRESETS = [
  { label: "Today",           from: () => format(today(), "yyyy-MM-dd"),           to: () => format(today(), "yyyy-MM-dd") },
  { label: "Last 7 days",     from: () => format(subDays(today(), 6), "yyyy-MM-dd"), to: () => format(today(), "yyyy-MM-dd") },
  { label: "Last 30 days",    from: () => format(subDays(today(), 29), "yyyy-MM-dd"), to: () => format(today(), "yyyy-MM-dd") },
  { label: "Last 3 months",   from: () => format(subMonths(today(), 3), "yyyy-MM-dd"), to: () => format(today(), "yyyy-MM-dd") },
  { label: "Last 6 months",   from: () => format(subMonths(today(), 6), "yyyy-MM-dd"), to: () => format(today(), "yyyy-MM-dd") },
  { label: "This month",      from: () => format(startOfMonth(today()), "yyyy-MM-dd"), to: () => format(endOfMonth(today()), "yyyy-MM-dd") },
  { label: "This year",       from: () => format(startOfYear(today()), "yyyy-MM-dd"), to: () => format(today(), "yyyy-MM-dd") },
];

export default function InstalledMetersPage() {
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(25);
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen]   = useState(false);

  const [data, setData]             = useState<InstalledMeter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [debouncedSearch] = useDebounce(search, 500);

  const hasDateFilter = Boolean(dateFrom || dateTo);

  /* ─── Fetch ─────────────────────────────────────────────────── */
  const fetchInstalledMeters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo)   params.append("dateTo",   dateTo);

      const { data: res } = await api.get<{ data: { meters: InstalledMeter[]; pagination: Pagination } }>(
        `/meters/installed?${params.toString()}`
      );
      setData(res.data.meters);
      setPagination(res.data.pagination);
    } catch {
      toast.error("Failed to load installed meters");
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedSearch, dateFrom, dateTo]);

  useEffect(() => { fetchInstalledMeters(); }, [fetchInstalledMeters]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval) intervalRef.current = setInterval(fetchInstalledMeters, refreshInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refreshInterval, fetchInstalledMeters]);

  /* ─── Handlers ──────────────────────────────────────────────── */
  const handlePreset = (preset: typeof PRESETS[number]) => {
    setDateFrom(preset.from());
    setDateTo(preset.to());
    setActivePreset(preset.label);
    setPage(1);
    setPopoverOpen(false);
  };

  const handleCustomDate = (field: "from" | "to", value: string) => {
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
    setActivePreset(null);
    setPage(1);
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setActivePreset(null);
    setPage(1);
  };

  const handleClearSearch = () => { setSearch(""); setPage(1); };

  /* ─── Date filter label for button ─────────────────────────── */
  const dateLabel = activePreset
    ? activePreset
    : hasDateFilter
      ? `${dateFrom || "…"} → ${dateTo || "…"}`
      : "Installation Date";

  /* ─── Columns ───────────────────────────────────────────────── */
  const columns: ColumnDef<InstalledMeter>[] = [
    {
      header: "Sr No.",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {(page - 1) * limit + row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "meterId",
      header: "Meter ID",
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded ml-[-15px] text-[15px]">
          {row.original.meterId}
        </code>
      ),
    },
    {
      accessorKey: "assignedHouseholdId",
      header: "HHID",
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 ml-[-14px] text-[15px]">
          {row.original.assignedHouseholdId}
        </code>
      ),
    },
    {
      accessorKey: "installedAt",
      header: "Installed On",
      cell: ({ row }) => {
        const d = new Date(row.original.installedAt);
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tabular-nums">
              {format(d, "dd MMM yyyy")}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {format(d, "hh:mm a")}
            </span>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.pages ?? 0,
  });

  const totalPages = pagination?.pages ?? 0;
  const total      = pagination?.total ?? 0;

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Installed Meters"
        description="All meters currently assigned to a household"
        size="sm"
        badge={
          <Badge variant="outline">
            {total.toLocaleString()} {hasDateFilter ? "found" : "installed"}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search meter or HHID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-8 h-9 w-52 text-sm"
              />
              {search && (
                <button onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Date filter popover */}
            <ButtonGroup>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={hasDateFilter ? "default" : "outline"}
                    size="sm"
                    className="h-9 gap-2 text-sm"
                  >
                    <CalendarRange className="h-3.5 w-3.5" />
                    {dateLabel}
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-80 p-4 space-y-4">
                  {/* Quick presets */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Quick Select
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => handlePreset(p)}
                          className={`text-xs px-3 py-1.5 rounded-md border text-left transition-colors ${
                            activePreset === p.label
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-muted border-border"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or custom range</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Custom date inputs */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> From
                      </label>
                      <Input
                        type="date"
                        value={dateFrom}
                        max={dateTo || format(today(), "yyyy-MM-dd")}
                        onChange={(e) => handleCustomDate("from", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> To
                      </label>
                      <Input
                        type="date"
                        value={dateTo}
                        min={dateFrom}
                        max={format(today(), "yyyy-MM-dd")}
                        onChange={(e) => handleCustomDate("to", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {hasDateFilter && (
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs"
                      onClick={() => { clearDateFilter(); setPopoverOpen(false); }}>
                      <X className="h-3 w-3 mr-1.5" /> Clear date filter
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Clear badge when filter active */}
              {hasDateFilter && (
                <Button variant="outline" size="icon" className="h-9 w-9"
                  onClick={clearDateFilter}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </ButtonGroup>

            {/* Auto-refresh */}
            <ButtonGroup>
              <Select
                value={refreshInterval ? String(refreshInterval) : "off"}
                onValueChange={(v) => setRefreshInterval(v === "off" ? null : Number(v))}
              >
                <SelectTrigger className="w-fit h-9">
                  <SelectValue placeholder="Refresh: Off" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Refresh: Off</SelectItem>
                  <SelectItem value="10000">Every 10s</SelectItem>
                  <SelectItem value="30000">Every 30s</SelectItem>
                  <SelectItem value="60000">Every 1 min</SelectItem>
                  <SelectItem value="300000">Every 5 min</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setRefreshing(true); fetchInstalledMeters(); }}
                disabled={refreshing} variant="outline" size="icon" className="h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </ButtonGroup>
          </div>
        }
      />

      {/* Active date filter pill */}
      {hasDateFilter && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-3">
            <CalendarRange className="h-3 w-3" />
            {dateFrom && dateTo
              ? `${format(new Date(dateFrom), "dd MMM yyyy")} → ${format(new Date(dateTo), "dd MMM yyyy")}`
              : dateFrom
                ? `From ${format(new Date(dateFrom), "dd MMM yyyy")}`
                : `Until ${format(new Date(dateTo), "dd MMM yyyy")}`
            }
            <button onClick={clearDateFilter} className="ml-1 hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Badge>
          <span className="text-xs text-muted-foreground">{total.toLocaleString()} meters installed in this period</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}
                      className="bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground text-sm">Loading installed meters...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No installed meters found</EmptyTitle>
                        <EmptyDescription>
                          {hasDateFilter
                            ? "No meters were installed in the selected date range."
                            : search
                              ? "No meters match your search. Try a different Meter ID or HHID."
                              : "No meters have been assigned to a household yet."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {(search || hasDateFilter) && (
                        <EmptyContent>
                          <div className="flex gap-2">
                            {search && (
                              <Button onClick={handleClearSearch} variant="outline" size="sm">
                                <X className="mr-2 h-4 w-4" /> Clear Search
                              </Button>
                            )}
                            {hasDateFilter && (
                              <Button onClick={clearDateFilter} variant="outline" size="sm">
                                <X className="mr-2 h-4 w-4" /> Clear Date Filter
                              </Button>
                            )}
                          </div>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination footer */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{total.toLocaleString()}</span>{" "}
              {hasDateFilter ? "meters in range" : "installed meters"}
            </p>

            <div className="flex items-center gap-3">
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ButtonGroup>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 py-1 border-y flex items-center tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
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