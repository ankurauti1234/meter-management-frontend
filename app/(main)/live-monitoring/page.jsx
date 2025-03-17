"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchAllMeters } from "@/utils/events-apis";

export default function LiveMonitor() {
  const [meters, setMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeters, setTotalMeters] = useState(0);
  const limit = 10; // Fixed limit for simplicity
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchAllMeters({ page, limit });
        setMeters(response.meters || []);
        setTotalMeters(response.totalMeters || 0);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error fetching meters:", error);
        setMeters([]);
        setTotalMeters(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const handleRowClick = (meterId) => {
    router.push(`/live-monitoring/${meterId}`);
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="mx-auto container py-8">
      <Card className="w-full rounded-lg">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            Live Monitor
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {meters.length} meters shown of {totalMeters} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Meter ID</TableHead>
                  <TableHead>Household ID</TableHead>
                  <TableHead>Household Status</TableHead>
                  <TableHead>Installation</TableHead>
                  <TableHead>SIM 1</TableHead>
                  <TableHead>SIM 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading meters...</div>
                    </TableCell>
                  </TableRow>
                ) : meters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No meters available
                    </TableCell>
                  </TableRow>
                ) : (
                  meters.map((meter) => (
                    <TableRow
                      key={meter.deviceId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(meter.deviceId)}
                    >
                      <TableCell className="font-medium">{meter.deviceId}</TableCell>
                      <TableCell>{meter.hhid || "-"}</TableCell>
                      <TableCell>{meter.isAssigned ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{meter.createdAt ? new Date(meter.createdAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{meter.sim1Pass ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{meter.sim2Pass ? "Active" : "Inactive"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {meters.length} of {totalMeters} meters
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1 || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}