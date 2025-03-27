"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CheckCircle,
  Package,
  Lightning,
  ChartBar,
  TrendUp,
  TrendDown,
} from "@phosphor-icons/react";

// Chart data for past 4 weeks (total 15 devices: 7 Touch + 8 APM)
const chartData = [
  { week: "Week 1", touch: 3, apm: 3 },
  { week: "Week 2", touch: 2, apm: 2 },
  { week: "Week 3", touch: 1, apm: 2 },
  { week: "Week 4", touch: 1, apm: 1 },
];

// Chart configuration
const chartConfig = {
  touch: {
    label: "Touch Meter",
    color: "hsl(var(--chart-1))",
  },
  apm: {
    label: "APM Meter",
    color: "hsl(var(--chart-2))",
  },
}

export default function DeviceInstallationChart() {
  // Calculate metrics
  const totalDevices = chartData.reduce(
    (sum, week) => sum + week.touch + week.apm,
    0
  );
  
  const totalTouch = chartData.reduce((sum, week) => sum + week.touch, 0);
  const totalAPM = chartData.reduce((sum, week) => sum + week.apm, 0);

  // Calculate percentages and trends
  const touchRate = Math.round((totalTouch / totalDevices) * 100);
  const apmRate = Math.round((totalAPM / totalDevices) * 100);

  // Compare last two weeks for trend
  const lastWeek = chartData[chartData.length - 1];
  const prevWeek = chartData[chartData.length - 2];
  
  const touchTrend = Math.round(
    ((lastWeek.touch - prevWeek.touch) / prevWeek.touch) * 100
  ) || 0;
  
  const apmTrend = Math.round(
    ((lastWeek.apm - prevWeek.apm) / prevWeek.apm) * 100
  ) || 0;

  return (
    <div className="w-full h-full flex-1 bg-accent overflow-hidden rounded-lg">
      <div className="flex items-center justify-between gap-6 p-4">
        <div className="flex gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full w-12 h-12 text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalTouch}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  touchTrend >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {touchTrend >= 0 ? "+" : ""}
                {touchTrend}%
                {touchTrend >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
              </span>
            </p>
            <p className="text-xs">Touch Meter Installations</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full w-12 h-12 text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalAPM}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  apmTrend >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {apmTrend >= 0 ? "+" : ""}
                {apmTrend}%
                {apmTrend >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
              </span>
            </p>
            <p className="text-xs">APM Meter Installations</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full w-12 h-12 text-purple-600 dark:text-purple-400">
            <Lightning size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalDevices}
              <span className="text-green-500 text-sm">Total</span>
            </p>
            <p className="text-xs">Total Installations</p>
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
                Touch vs APM Meter Installations (Last 4 Weeks)
              </CardDescription>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-1))]"></div>
                <span className="text-xs font-medium">Touch Meter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-2))]"></div>
                <span className="text-xs font-medium">APM Meter</span>
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
              margin={{ top: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="6 6" />
              <XAxis
                dataKey="week"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, 3]} // Set max value based on highest data point
                tickCount={4} // Number of ticks (0 through 3)
                allowDecimals={false} // Force whole numbers only
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
                dataKey="touch"
                fill="var(--color-touch)"
                radius={4}
              />
              <Bar
                dataKey="apm"
                fill="var(--color-apm)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}