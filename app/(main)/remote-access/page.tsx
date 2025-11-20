/* eslint-disable @typescript-eslint/no-explicit-any */
// app/remote-access/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import remoteAccessService, { ActiveMeter } from "@/services/remote-access.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Terminal, AlertCircle, Activity, Zap } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner"; // ← Beautiful shadcn toast

export default function RemoteAccessPage() {
  const router = useRouter();
  const [meters, setMeters] = useState<ActiveMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingMeterId, setConnectingMeterId] = useState<string | null>(null);

  const fetchMeters = async () => {
    try {
      setError(null);
      const response = await remoteAccessService.listMeters();
      setMeters(response.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || err.message || "Failed to fetch meters");
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

  const handleConnect = async (meterId: string) => {
    setConnectingMeterId(meterId);

    // Show beautiful sonner toast — just like AI "thinking"
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 3200)), // ~3.2s delay
      {
        loading: "Establishing secure SSH tunnel...",
        success: `Connected to ${meterId}`,
        error: "Failed to connect",
      }
    );

    // Simulate tunnel setup delay
    await new Promise((resolve) => setTimeout(resolve, 3200));

    setConnectingMeterId(null);
    router.push(`/remote-access/${meterId}`);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <PageHeader title="Remote Access" description="Connect to active meters via SSH tunnel" size="sm" />
        <div className="rounded-md border overflow-hidden">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <PageHeader
        title="Remote Access"
        description="Connect to active meters via SSH tunnel"
        badge={<Badge variant="outline">{meters.length} active</Badge>}
        size="sm"
        actions={
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border overflow-hidden">
        {meters.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Terminal className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No Active Meters</EmptyTitle>
              <EmptyDescription>
                There are no meters currently connected to the jump host.
                New connections will appear here automatically.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh List
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Meter ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>PID</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((meter) => {
                const isConnecting = connectingMeterId === meter.meterId;

                return (
                  <TableRow key={meter.meterId} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Terminal className="h-5 w-5 text-primary" />
                        </div>
                        {meter.meterId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Activity className="h-3 w-3" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-mono text-sm">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        {meter.port}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{meter.pid}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(meter.meterId)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Terminal className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}