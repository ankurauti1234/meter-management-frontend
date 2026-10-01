/* eslint-disable @typescript-eslint/no-explicit-any */
// app/remote-access/page.tsx
"use client";

import { useEffect, useState } from "react";

import remoteAccessService, {
  ActiveMeter,
} from "@/services/remote-access.service";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  RefreshCw,
  Terminal,
  AlertCircle,
  Activity,
  Search,
  Download,
  ArrowUpAZ,
  ArrowDownAZ,
} from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function RemoteAccessPage() {
  const [meters, setMeters] = useState<ActiveMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [sortOrder, setSortOrder] = useState<
    "asc" | "desc"
  >("asc");

  const fetchMeters = async () => {
    try {
      setError(null);

      const response = await remoteAccessService.listMeters();

      setMeters(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.msg ||
          err.message ||
          "Failed to fetch meters"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMeters();
  };

  /*
   * Filter and sort meters
   */
  const filteredMeters = meters
    .filter((meter) =>
      meter.meterId
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.meterId.localeCompare(
        b.meterId,
        undefined,
        {
          numeric: true,
        }
      );

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

  /*
   * Toggle ascending / descending sort
   */
  const handleSort = () => {
    setSortOrder((currentOrder) =>
      currentOrder === "asc" ? "desc" : "asc"
    );
  };

  /*
   * Download currently displayed meters as CSV
   * Only Meter ID is included.
   */
  const handleDownloadCSV = () => {
    if (filteredMeters.length === 0) {
      return;
    }

    const csvContent = [
      "Meter ID",
      ...filteredMeters.map(
        (meter) => `"${meter.meterId}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "meter-list.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader
          title="Remote Access"
          description="Connect to active meters via SSH tunnel"
          size="sm"
        />

        <div className="rounded-md border overflow-hidden">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Remote Access"
        description="Connect to active meters via SSH tunnel"
        badge={
          <Badge variant="outline">
            {meters.length} active
          </Badge>
        }
        size="sm"
        actions={
          <div className="flex items-center gap-2">
            {/* Sort */}
            <Button
              onClick={handleSort}
              variant="outline"
              title={
                sortOrder === "asc"
                  ? "Currently sorted ascending"
                  : "Currently sorted descending"
              }
            >
              {sortOrder === "asc" ? (
                <ArrowUpAZ className="mr-2 h-4 w-4" />
              ) : (
                <ArrowDownAZ className="mr-2 h-4 w-4" />
              )}

              {sortOrder === "asc"
                ? "Ascending"
                : "Descending"}
            </Button>

            {/* Download CSV */}
            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              disabled={filteredMeters.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>

            {/* Refresh */}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          type="text"
          placeholder="Search meter ID..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
          className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />

          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        {meters.length === 0 ? (
          /* No meters */
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Terminal className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>

              <EmptyTitle>
                No Active Meters
              </EmptyTitle>

              <EmptyDescription>
                There are no meters currently connected
                to the jump host. New connections will
                appear here automatically.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : filteredMeters.length === 0 ? (
          /* No search results */
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>

              <EmptyTitle>
                No Meters Found
              </EmptyTitle>

              <EmptyDescription>
                No meter ID matches &quot;
                {searchTerm}
                &quot;.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">
                  Meter ID
                </TableHead>

                <TableHead>
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredMeters.map((meter) => (
                <TableRow
                  key={meter.meterId}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {/* Meter ID */}
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Terminal className="h-5 w-5 text-primary" />
                      </div>

                      {meter.meterId}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="gap-1"
                    >
                      <Activity className="h-3 w-3" />

                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}