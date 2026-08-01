/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { useDebounce } from "use-debounce";
import { Search, RefreshCw, ChevronLeft, ChevronRight, Unlink, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonGroup } from "@/components/ui/button-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { toast } from "sonner";

import unassignService, { UnassignLog } from "@/services/unassign.service";

export default function UnassignLogsPage() {
  const [logs, setLogs]           = useState<UnassignLog[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [deviceSearch, setDeviceSearch] = useState("");
  const [hhidSearch, setHhidSearch]     = useState("");
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(20);

  const [debouncedDevice] = useDebounce(deviceSearch, 400);
  const [debouncedHhid]   = useDebounce(hhidSearch,   400);

  const totalPages = Math.ceil(total / limit);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await unassignService.getLogs({
        page,
        limit,
        meterId: debouncedDevice || undefined,
        hhid:    debouncedHhid   || undefined,
      });
      setLogs(res.data);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load unassign logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, debouncedDevice, debouncedHhid]);

  useEffect(() => { setPage(1); }, [debouncedDevice, debouncedHhid, limit]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleRefresh = () => { setRefreshing(true); fetchLogs(); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unassign Logs"
        description="History of all meter-household unassignments"
        badge={<Badge variant="outline">{total.toLocaleString()} records</Badge>}
        size="sm"
        actions={
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 w-52 text-sm"
            placeholder="Search Device ID…"
            value={deviceSearch}
            onChange={e => setDeviceSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 w-52 text-sm"
            placeholder="Search HHID…"
            value={hhidSearch}
            onChange={e => setHhidSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Device ID</TableHead>
              <TableHead className="w-32">HHID</TableHead>
              <TableHead>Unassigned By</TableHead>
              <TableHead className="w-44">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Empty>
                    <EmptyMedia variant="icon"><Unlink className="h-10 w-10 text-muted-foreground/40" /></EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No unassign logs found</EmptyTitle>
                      <EmptyDescription>No records match your current filters.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{log.deviceId}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono text-muted-foreground">{log.hhid}</code>
                  </TableCell>
                  <TableCell>
                    {log.unassignedBy ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{log.unassignedBy.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{log.unassignedBy.email}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(log.unassignedAt), "dd MMM yyyy, HH:mm:ss")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * limit + 1).toLocaleString()}–{Math.min(page * limit, total).toLocaleString()} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-xs">{n} rows</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ButtonGroup>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y flex items-center h-8">{page} / {totalPages || 1}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
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