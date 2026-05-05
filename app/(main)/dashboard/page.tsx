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
import api from "@/services/api";

interface DashboardStats {
  totalInstalled: number;
  totalMeters: number;
  totalUninstalled: number;
  totalEventTypes: number;
  activeDevicesToday: number;
}

const CACHE_KEY = "dashboard_stats_cache";

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

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

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
      title: "Live Alerts",
      value: 14,
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
          <CardHeader className="flex flex-col p-3">
            <CardTitle>Bar Chart - Interactive</CardTitle>
            <CardDescription>
              Showing total visitors for the last 3 months
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-2 space-y-2 h-fit">
            <AlertCard />
            <AlertCard />
            <AlertCard />
            <AlertCard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}