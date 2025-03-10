"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowUDownLeft,
  Package,
  Target,
  TrendDown,
  TrendUp,
  CheckCircle,
  XCircle,
  Lightning,
  ChartBar,
} from "@phosphor-icons/react";

// Updated chart data with installed and not installed metrics
const chartData = [
  { month: "January", installed: 186, notInstalled: 80 },
  { month: "February", installed: 305, notInstalled: 200 },
  { month: "March", installed: 237, notInstalled: 120 },
  { month: "April", installed: 73, notInstalled: 190 },
  { month: "May", installed: 209, notInstalled: 130 },
  { month: "June", installed: 214, notInstalled: 140 },
  { month: "July", installed: 230, notInstalled: 96 },
  { month: "August", installed: 178, notInstalled: 162 },
  { month: "September", installed: 210, notInstalled: 141 },
  { month: "October", installed: 126, notInstalled: 138 },
  { month: "November", installed: 185, notInstalled: 140 },
  { month: "December", installed: 202, notInstalled: 190 },
];

// Updated chart configuration with installed and not installed
const chartConfig = {
  installed: {
    label: "Installed",
    color: "hsl(var(--chart-1))", // Using the same color theme
  },
  notInstalled: {
    label: "Not Installed",
    color: "hsl(var(--chart-2))",
  },
};

export default function DeviceInstallationChart() {
  // Calculate installation metrics
  const totalDevices = chartData.reduce(
    (sum, month) => sum + month.installed + month.notInstalled,
    0
  );
  const totalInstalled = chartData.reduce(
    (sum, month) => sum + month.installed,
    0
  );
  const totalNotInstalled = chartData.reduce(
    (sum, month) => sum + month.notInstalled,
    0
  );

  // Calculate percentages and trends
  const installationRate = Math.round((totalInstalled / totalDevices) * 100);

  // Compare last two months to calculate trend
  const lastMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const installationTrend = Math.round(
    ((lastMonth.installed - previousMonth.installed) /
      previousMonth.installed) *
      100
  );
  const pendingTrend = Math.round(
    ((lastMonth.notInstalled - previousMonth.notInstalled) /
      previousMonth.notInstalled) *
      100
  );

  return (
    <div className="w-full h-full flex-1 bg-accent overflow-hidden rounded-lg ">
      <div className="flex items-center justify-between gap-6 p-4 ">
        <div className="flex gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full w-12 h-12 text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalInstalled}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  installationTrend >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {installationTrend >= 0 ? "+" : ""}
                {installationTrend}%
                {installationTrend >= 0 ? (
                  <TrendUp size={16} />
                ) : (
                  <TrendDown size={16} />
                )}
              </span>
            </p>
            <p className="text-xs">Installed Devices</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-full w-12 h-12 text-yellow-600 dark:text-yellow-400">
            <Package size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalNotInstalled}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  pendingTrend < 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {pendingTrend >= 0 ? "+" : ""}
                {pendingTrend}%
                {pendingTrend < 0 ? (
                  <TrendDown size={16} />
                ) : (
                  <TrendUp size={16} />
                )}
              </span>
            </p>
            <p className="text-xs">Pending Installations</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full w-12 h-12 text-blue-600 dark:text-blue-400">
            <Lightning size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {installationRate}%
              <span className="text-green-500 text-sm flex gap-1 items-baseline">
                Success Rate
              </span>
            </p>
            <p className="text-xs">Installation Efficiency</p>
          </div>
        </div>
      </div>

      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-4 py-2 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ChartBar weight="duotone" className="text-primary" size={20} />
                Device Installation Statistics
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Installed vs Not Installed Devices (Jan - Dec 2024)
              </CardDescription>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-1))]"></div>
                <span className="text-xs font-medium">Installed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-2))]"></div>
                <span className="text-xs font-medium">Not Installed</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[25.75rem] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              barSize={16}
              margin={{
                top: 20,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="6 6" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Number of Devices",
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  style: {
                    textAnchor: "middle",
                    fontSize: 12,
                    fill: "var(--muted-foreground)",
                  },
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar
                dataKey="installed"
                fill="var(--color-installed)"
                radius={4}
              />
              <Bar
                dataKey="notInstalled"
                fill="var(--color-notInstalled)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
