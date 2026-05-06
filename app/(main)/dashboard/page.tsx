"use client";

import React, { useState, useEffect, useCallback } from "react";
import { StatCard } from "@/components/cards/stat-card";
import { Cpu, Activity, GitBranch, Gauge } from "lucide-react";
import { AlertCard } from "@/components/cards/alert-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import api from "@/services/api";
import alertsService, { InactivityAlert } from "@/services/alerts.service";
import Link from "next/link";

interface DashboardStats {
  totalInstalled: number;
  totalMeters: number;
  totalUninstalled: number;
  totalEventTypes: number;
  activeDevicesToday: number;
}

const CACHE_KEY = "dashboard_stats_cache";
const ALERTS_CACHE_KEY = "dashboard_alerts_cache";
const ALERT_COUNT_CACHE_KEY = "dashboard_alert_count_cache";

function getCachedStats(): DashboardStats | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DashboardStats;
  } catch {
    return null;
  }
}

function setCachedStats(stats: DashboardStats): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
  } catch {
    // storage quota exceeded or unavailable — silently ignore
  }
}

function getCachedAlertCount(): number | null {
  try {
    const raw = localStorage.getItem(ALERT_COUNT_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as number;
  } catch {
    return null;
  }
}

function setCachedAlertCount(count: number): void {
  try {
    localStorage.setItem(ALERT_COUNT_CACHE_KEY, JSON.stringify(count));
  } catch {
    // silently ignore
  }
}

function getCachedAlerts(): InactivityAlert[] | null {
  try {
    const raw = localStorage.getItem(ALERTS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InactivityAlert[];
  } catch {
    return null;
  }
}

function setCachedAlerts(alerts: InactivityAlert[]): void {
  try {
    localStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify(alerts));
  } catch {
    // silently ignore
  }
}

const EMPTY_STATS: DashboardStats = {
  totalInstalled: 0,
  totalMeters: 0,
  totalUninstalled: 0,
  totalEventTypes: 0,
  activeDevicesToday: 0,
};

export default function Dashboard() {
  // Initialise from cache immediately — no flash of zeros
  const [stats, setStats] = useState<DashboardStats>(
    () => getCachedStats() ?? EMPTY_STATS
  );
  // Only show "..." on the very first load when there is no cache at all
  const [isLoading, setIsLoading] = useState(() => getCachedStats() === null);

  const [alertCount, setAlertCount] = useState<number>(
    () => getCachedAlertCount() ?? 0
  );
  const [alertsLoading, setAlertsLoading] = useState(
    () => getCachedAlertCount() === null
  );
  const [recentAlerts, setRecentAlerts] = useState<InactivityAlert[]>(
    () => getCachedAlerts() ?? []
  );
  const [recentAlertsLoading, setRecentAlertsLoading] = useState(
    () => getCachedAlerts() === null
  );

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      const fresh: DashboardStats = data.data;
      setStats(fresh);
      setCachedStats(fresh);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAlertCount = useCallback(async () => {
    try {
      const count = await alertsService.getInactiveCount();
      setAlertCount(count);
      setCachedAlertCount(count);
    } catch (error) {
      console.error("Failed to fetch alert count:", error);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchRecentAlerts = useCallback(async () => {
    try {
      const result = await alertsService.getInactiveMeters({
        page: 1,
        limit: 5,
      });
      setRecentAlerts(result.data);
      setCachedAlerts(result.data);
    } catch (error) {
      console.error("Failed to fetch recent alerts:", error);
    } finally {
      setRecentAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAlertCount();
    fetchRecentAlerts();
    const interval = setInterval(() => {
      fetchStats();
      fetchAlertCount();
      fetchRecentAlerts();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchAlertCount, fetchRecentAlerts]);

  const statCards = [
    {
      icon: Gauge,
      title: "Total Installed Meters",
      value: isLoading ? "..." : stats.totalInstalled,
      color: "text-chart-4",
      bgColor: "bg-chart-4/15",
    },
    {
      icon: Cpu,
      title: "Active Devices Today",
      value: isLoading ? "..." : stats.activeDevicesToday,
      color: "text-chart-1",
      bgColor: "bg-chart-1/15",
    },
    {
      icon: GitBranch,
      title: "Total Event Types",
      value: isLoading ? "..." : stats.totalEventTypes,
      color: "text-chart-3",
      bgColor: "bg-chart-3/15",
    },
    {
      icon: Activity,
      title: "Inactive Alerts",
      value: alertsLoading ? "..." : alertCount,
      color: "text-chart-2",
      bgColor: "bg-chart-2/15",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 w-full">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full">
        <Card className="w-full lg:col-span-2 gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between p-3">
            <div>
              <CardTitle>Inactivity Alerts</CardTitle>
              <CardDescription>
                Meters that haven&apos;t sent any events recently
              </CardDescription>
            </div>
            <Link href="/live-monitoring/alerts">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="p-2 space-y-2 h-fit">
            {recentAlertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                No inactive meters detected
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  device_id={alert.device_id}
                  hhid={alert.hhid}
                  lastEventAt={alert.lastEventAt}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}