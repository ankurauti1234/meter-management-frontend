/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
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

import eventsService, { MeterChannel } from "@/services/events.service";
import { DateTimePicker, DateTime } from "@/components/ui/date-time-picker";

const CLOUDFRONT_URL = "http://d1y6od6p0ywz7r.cloudfront.net";
const S3_BASE =
  "https://iot-indi-people-meters-bucket.s3.ap-south-1.amazonaws.com";

const toCloudFront = (url: string): string =>
  url.replace(S3_BASE, CLOUDFRONT_URL);

interface Filters {
  device_id?: string;
  status?: "recognized" | "unrecognized";
  page: number;
  limit: number;
}

export default function MediaEventsPage() {
  const [filters, setFilters] = useState<Filters>({
    device_id: "",
    status: undefined,
    page: 1,
    limit: 25,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [startDateTime, setStartDateTime] = useState<DateTime>({});
  const [endDateTime, setEndDateTime] = useState<DateTime>({});
  const [tempStart, setTempStart] = useState<DateTime>({});
  const [tempEnd, setTempEnd] = useState<DateTime>({});

  const [data, setData] = useState<MeterChannel[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [debouncedDeviceId] = useDebounce(filters.device_id, 600);

  const hasActiveFilters = Boolean(
    filters.device_id ||
      filters.status ||
      startDateTime.date ||
      endDateTime.date
  );

  const getUnix = (dt: DateTime): number | undefined => {
    if (!dt.date) return undefined;
    const [h = 0, m = 0] = (dt.time || "00:00").split(":").map(Number);
    const date = new Date(dt.date);
    date.setHours(h, m, 0, 0);
    return Math.floor(date.getTime() / 1000);
  };

  const fetchChannels = useCallback(async () => {
    setLoading(true);
    try {
      const start = getUnix(startDateTime);
      const end = getUnix(endDateTime);

      const payload: any = {
        status: filters.status,
        start_time: start,
        end_time: end,
        page: filters.page,
        limit: filters.limit,
      };

      if (debouncedDeviceId) payload.device_id = debouncedDeviceId;

      const res = await eventsService.getMeterChannels(payload);

      const channelsWithCloudFront: MeterChannel[] = res.channels.map(
        (ch: MeterChannel) => ({
          ...ch,
          processed_s3_key: ch.processed_s3_key
            ? toCloudFront(ch.processed_s3_key)
            : "",
        })
      );

      setData(channelsWithCloudFront);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load meter channels");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    debouncedDeviceId,
    filters.status,
    filters.page,
    filters.limit,
    startDateTime,
    endDateTime,
  ]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval) {
      intervalRef.current = setInterval(fetchChannels, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchChannels]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleRefresh = () => {
    toast.success("Refreshed");
    fetchChannels();
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setStartDateTime(tempStart);
    setEndDateTime(tempEnd);
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset = {
      device_id: "",
      status: undefined,
      page: 1,
      limit: filters.limit,
    };
    setFilters(reset);
    setTempFilters(reset);
    setStartDateTime({});
    setEndDateTime({});
    setTempStart({});
    setTempEnd({});
    toast("Filters cleared");
  };

  const openDialog = () => {
    setTempFilters(filters);
    setTempStart(startDateTime);
    setTempEnd(endDateTime);
    setDialogOpen(true);
  };

  const columns: ColumnDef<MeterChannel>[] = [
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {format(
            new Date(row.original.timestamp * 1000),
            "dd MMM yyyy, HH:mm:ss"
          )}
        </div>
      ),
    },
    {
      accessorKey: "device_id",
      header: "Device ID",
      cell: ({ row }) => (
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {row.original.device_id}
        </code>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "recognized" ? "default" : "secondary"
          }
          className="gap-1.5"
        >
          {row.original.status === "recognized" ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              Recognized
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Unrecognized
            </>
          )}
        </Badge>
      ),
    },
    {
      accessorKey: "label",
      header: "Channel",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.label || "—"}</span>
      ),
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.original.confidence
            ? `${(row.original.confidence * 100).toFixed(1)}%`
            : "—"}
        </div>
      ),
    },
    // {
    //   accessorKey: "processed_s3_key",
    //   header: "Image",
    //   cell: ({ row }) => {
    //     const url = row.original.processed_s3_key;
    //     if (!url) return <span className="text-muted-foreground">—</span>;

    //     return (
    //       <Dialog>
    //         <DialogTrigger asChild>
    //           <button className="group relative inline-block h-7 w-14 overflow-hidden rounded-md border bg-muted transition-all hover:scale-105 hover:shadow-md">
    //             <img
    //               src={url}
    //               alt="Meter reading"
    //               className="h-full w-full object-cover"
    //               loading="lazy"
    //             />
    //             <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
    //               <Expand className="h-5 w-5 text-white" />
    //             </div>
    //           </button>
    //         </DialogTrigger>
    //         <DialogContent className="max-w-6xl p-0 gap-0">
    //           <DialogHeader className="p-4">
    //             <DialogTitle className="font-normal"><code className="text-lg font-mono bg-muted px-2 py-1 rounded">
    //       {row.original.device_id}
    //     </code> {row.original.status}</DialogTitle>
    //             <DialogDescription>
    //               {format(new Date(row.original.timestamp * 1000), "PPp")}
    //             </DialogDescription>
    //           </DialogHeader>
    //           <Separator/>
    //           <div className="flex items-center justify-center p-2 bg-muted/20">
    //             <img
    //               src={url}
    //               alt="Full size meter reading"
    //               className="max-h-[70vh] rounded-lg shadow-lg"
    //             />
    //           </div>
    //         </DialogContent>
    //       </Dialog>
    //     );
    //   },
    // },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / filters.limit),
  });

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Meter Channels"
        description="View meter readings with image previews"
        badge={<Badge variant="outline">{total.toLocaleString()} total</Badge>}
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openDialog}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {
                          [
                            filters.device_id && 1,
                            filters.status && 1,
                            startDateTime.date && 1,
                            endDateTime.date && 1,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Filter Meter Channels</DialogTitle>
                    <DialogDescription>
                      Search by device, status, and time range.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Device ID */}
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="e.g. AM-10001"
                          value={tempFilters.device_id}
                          onChange={(e) =>
                            setTempFilters((p) => ({
                              ...p,
                              device_id: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={tempFilters.status ?? ""}
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            status: v as any,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={undefined as any}>
                            All statuses
                          </SelectItem>
                          <SelectItem value="recognized">Recognized</SelectItem>
                          <SelectItem value="unrecognized">
                            Unrecognized
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Start */}
                    <DateTimePicker
                      label="Start Date & Time"
                      value={tempStart}
                      onChange={setTempStart}
                    />

                    {/* End */}
                    <DateTimePicker
                      label="End Date & Time"
                      value={tempEnd}
                      onChange={setTempEnd}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

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
                disabled={refreshing}
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

      {/* Table (unchanged) */}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">
                        Loading channels...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No images found</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "Apply filters to view meter readings"}
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

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {(filters.page - 1) * filters.limit + 1}–
              {Math.min(filters.page * filters.limit, total)} of{" "}
              {total.toLocaleString()} events
            </p>

            <div className=" flex items-center gap-3">
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

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium p-2 pb-0 border-y">
                  Page {filters.page} of {Math.ceil(total / filters.limit)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={filters.page >= Math.ceil(total / filters.limit)}
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
