/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Filter,
  RefreshCw,
  Search,
  X,
  Bell,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";

import eventsService from "@/services/events.service";
import { DateTimePicker, DateTime } from "@/components/ui/date-time-picker";
import eventMappingService, { EventMapping } from "@/services/event-mapping.service";
import { DetailsHoverCard } from "./dialogDetail";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Event {
  id: number;
  device_id: string;
  timestamp: number;
  type: number;
  details: Record<string, any>;
  createdAt: string;
}

interface FiltersState {
  device_id: string;
  type: string[];
  page: number;
  limit: number;
}

// ─── EventTypeMultiSelect ─────────────────────────────────────────────────────

function EventTypeMultiSelect({
  mappings,
  value,
  onChange,
  loading,
}: {
  mappings: EventMapping[];
  value: string[];
  onChange: (v: string[]) => void;
  loading: boolean;
}) {
  const toggle = (t: string) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={loading}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {loading
              ? "Loading types..."
              : value.length === 0
              ? "All types"
              : `${value.length} type${value.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => onChange(mappings.map((m) => String(m.type)))}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-1">
          {mappings.map((m) => {
            const t = String(m.type);
            return (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={value.includes(t)}
                  onCheckedChange={() => toggle(t)}
                />
                <span>Type {m.type}</span>
                <span className="text-muted-foreground">– {m.name}</span>
                {m.is_alert && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    Alert
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── PageJumper ───────────────────────────────────────────────────────────────

function PageJumper({
  currentPage,
  totalPages,
  onJump,
}: {
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setInputVal(String(currentPage));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(1, Math.min(parsed, totalPages));
      onJump(clamped);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <ButtonGroup>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onJump(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="flex items-center gap-1 text-xs font-medium px-3 border-y bg-background">
        Page{" "}
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min={1}
            max={totalPages}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            className="w-14 text-center text-xs border rounded px-1 py-0.5 bg-background focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="min-w-[2rem] text-center px-1 py-0.5 rounded hover:bg-muted cursor-pointer font-semibold"
            title="Click to jump to a page"
          >
            {currentPage}
          </button>
        )}{" "}
        of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onJump(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DeviceEventsPage() {
  const defaultFilters: FiltersState = {
    device_id: "",
    type: [],
    page: 1,
    limit: 25,
  };

  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [tempFilters, setTempFilters] = useState<FiltersState>(defaultFilters);

  const [startDateTime, setStartDateTime] = useState<DateTime>({});
  const [endDateTime, setEndDateTime] = useState<DateTime>({});
  const [tempStart, setTempStart] = useState<DateTime>({});
  const [tempEnd, setTempEnd] = useState<DateTime>({});

  const [data, setData] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Inline filter panel — open by default on first visit
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  // Gate: prevents fetching until the user clicks Apply at least once
  const [filtersReady, setFiltersReady] = useState(false);

  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fetchEventsRef = useRef<() => void>(() => {});

  const [eventMappings, setEventMappings] = useState<EventMapping[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(true);

  // ── Derived ───────────────────────────────────────────────────────────────

  const hasActiveFilters = Boolean(
    filters.device_id ||
      filters.type.length ||
      startDateTime.date ||
      endDateTime.date
  );

  const activeFilterCount = [
    filters.device_id && 1,
    filters.type.length > 0 && 1,
    startDateTime.date && 1,
    endDateTime.date && 1,
  ].filter(Boolean).length;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getUnixSeconds = (dt: DateTime): number | undefined => {
    if (!dt.date) return undefined;
    const [h = 0, m = 0] = (dt.time || "00:00").split(":").map(Number);
    const date = new Date(dt.date);
    date.setHours(h, m, 0, 0);
    return Math.floor(date.getTime() / 1000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = getUnixSeconds(startDateTime);
      const end = getUnixSeconds(endDateTime);

      const res = await eventsService.getEvents({
        device_id: filters.device_id || undefined,
        type: filters.type.length ? filters.type.join(",") : undefined,
        start_time: start,
        end_time: end,
        page: filters.page,
        limit: filters.limit,
      });

      const eventsData = res.data?.events || [];
      const paginationData = res.data?.pagination;

      const events = eventsData.map((e: any) => {
        const ts = Number(e.timestamp);
        return { ...e, timestamp: ts < 1e12 ? ts * 1000 : ts };
      });

      setData(events);
      setTotal(paginationData?.total || 0);
    } catch (err) {
      toast.error("Failed to load events");
      console.error(err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    filters.device_id,
    filters.type,
    filters.page,
    filters.limit,
    startDateTime,
    endDateTime,
  ]);

  useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  // Load event mappings once
  useEffect(() => {
    const loadMappings = async () => {
      try {
        setMappingsLoading(true);
        const res = await eventMappingService.getAll({ limit: 1000 });
        const mappings = Array.isArray(res.data) ? res.data : [];
        setEventMappings(mappings.sort((a, b) => a.type - b.type));
      } catch (err) {
        console.error("Failed to load event mappings", err);
        toast.error("Failed to load event type definitions");
        setEventMappings([]);
      } finally {
        setMappingsLoading(false);
      }
    };
    loadMappings();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval) {
      intervalRef.current = setInterval(() => {
        if (filtersReady) fetchEventsRef.current();
      }, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, filtersReady]);

  // Fetch on filter/page changes — only after Apply is clicked
  useEffect(() => {
    if (!filtersReady) return;
    fetchEvents();
  }, [fetchEvents, filtersReady]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRefresh = () => {
    toast.success("Refreshed");
    setRefreshing(true);
    fetchEvents();
  };

  const handleApplyFilters = () => {
    const start = getUnixSeconds(tempStart);
    const end = getUnixSeconds(tempEnd);
    if (start !== undefined && end !== undefined && start > end) {
      toast.error("End date/time must be after the start");
      return;
    }
    setFilters({ ...tempFilters, page: 1 });
    setStartDateTime(tempStart);
    setEndDateTime(tempEnd);
    setFiltersReady(true);
    setFilterPanelOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setStartDateTime({});
    setEndDateTime({});
    setTempStart({});
    setTempEnd({});
    setFiltersReady(false);
    setFilterPanelOpen(true);
    toast("Filters cleared");
  };

  const handleTogglePanel = () => {
    if (!filterPanelOpen) {
      // Sync temp state with current applied filters when reopening
      setTempFilters(filters);
      setTempStart(startDateTime);
      setTempEnd(endDateTime);
    }
    setFilterPanelOpen((prev) => !prev);
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const EventTypeBadge = ({ type }: { type: number }) => {
    const mapping = eventMappings.find((m) => m.type === type);
    const isAlert = mapping?.is_alert ?? type >= 14;
    const baseClasses = "gap-1.5 text-xs";

    const content = (
      <>
        {isAlert ? <Bell className="h-3 w-3" /> : <Info className="h-3 w-3" />}
        {mapping ? `${mapping.name} (${type})` : `Type ${type}`}
      </>
    );

    if (isAlert)
      return (
        <Badge variant="outline" className={`border-red-500 text-red-600 ${baseClasses}`}>
          {content}
        </Badge>
      );
    if ([1, 2, 3, 4].includes(type))
      return (
        <Badge variant="outline" className={`border-green-500 text-green-600 ${baseClasses}`}>
          {content}
        </Badge>
      );
    if ([6, 7, 9].includes(type))
      return (
        <Badge variant="outline" className={`border-amber-500 text-amber-600 ${baseClasses}`}>
          {content}
        </Badge>
      );
    return (
      <Badge variant="outline" className={`border-blue-500 text-blue-600 ${baseClasses}`}>
        {content}
      </Badge>
    );
  };

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => {
        const ts = row.original.timestamp;
        const date = new Date(ts);
        if (isNaN(date.getTime()))
          return <span className="text-red-500 text-xs">Invalid date</span>;
        return (
          <div className="font-mono text-xs">
            {format(date, "dd MMM yyyy, HH:mm:ss")}
          </div>
        );
      },
    },
    {
      accessorKey: "device_id",
      header: "Device ID",
      cell: ({ row }) => (
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {row.original.device_id}
        </code>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <EventTypeBadge type={row.original.type} />,
    },
    {
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <DetailsHoverCard
          details={row.original.details || {}}
          type={row.original.type}
        />
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / filters.limit),
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-4">
      {/* ── Page Header ── */}
      <PageHeader
        title="Device Events"
        description="Real-time monitoring and historical event log"
        badge={<Badge variant="outline">{total.toLocaleString()} total</Badge>}
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter toggle + clear */}
            <ButtonGroup>
              <Button
                variant={filterPanelOpen ? "default" : "outline"}
                onClick={handleTogglePanel}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={handleResetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            {/* Auto-refresh */}
            <ButtonGroup>
              <Select
                value={refreshInterval ? String(refreshInterval) : "off"}
                onValueChange={(v) =>
                  setRefreshInterval(v === "off" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-fit">
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

              <Button
                onClick={handleRefresh}
                disabled={refreshing || !filtersReady}
                variant="outline"
                size="icon"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </ButtonGroup>
          </div>
        }
      />

      {/* ── Inline Filter Panel ── */}
      {filterPanelOpen && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Device ID */}
            <div className="space-y-2">
              <Label>Device ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search device..."
                  value={tempFilters.device_id}
                  onChange={(e) =>
                    setTempFilters((p) => ({ ...p, device_id: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <EventTypeMultiSelect
                mappings={eventMappings}
                value={tempFilters.type}
                loading={mappingsLoading}
                onChange={(type) => setTempFilters((p) => ({ ...p, type }))}
              />
              {!mappingsLoading && (
                <p className="text-xs text-muted-foreground">
                  {tempFilters.type.length > 0
                    ? `${tempFilters.type.length} of ${eventMappings.length} selected`
                    : `${eventMappings.length} types available`}
                </p>
              )}
            </div>

            {/* Start Date */}
            <DateTimePicker
              label="Start Date & Time"
              value={tempStart}
              onChange={setTempStart}
            />

            {/* End Date */}
            <DateTimePicker
              label="End Date & Time"
              value={tempEnd}
              onChange={setTempEnd}
            />
          </div>

          {/* Panel actions */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t">
            {filtersReady && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterPanelOpen(false)}
              >
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-background">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {!filtersReady ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Filter className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">
                        Set your filters and click{" "}
                        <strong>Apply Filters</strong> to load events
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No events found</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "No events recorded yet"}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={handleRefresh} variant="outline">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {(filters.page - 1) * filters.limit + 1}–
              {Math.min(filters.page * filters.limit, total)} of{" "}
              {total.toLocaleString()} events
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(filters.limit)}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <PageJumper
                currentPage={filters.page}
                totalPages={Math.ceil(total / filters.limit) || 1}
                onJump={(p) => setFilters((prev) => ({ ...prev, page: p }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}