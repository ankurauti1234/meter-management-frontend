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

// Chart data for past 6 weeks (total 20 devices)
const chartData = [
  { 
    week: "Week 1", 
    fieldTouch: 2, 
    fieldAPM: 1, 
    labTouch: 1, 
    labAPM: 0 
  },
  { 
    week: "Week 2", 
    fieldTouch: 2, 
    fieldAPM: 2, 
    labTouch: 1, 
    labAPM: 1 
  },
  { 
    week: "Week 3", 
    fieldTouch: 1, 
    fieldAPM: 1, 
    labTouch: 2, 
    labAPM: 1 
  },
  { 
    week: "Week 4", 
    fieldTouch: 2, 
    fieldAPM: 1, 
    labTouch: 1, 
    labAPM: 1 
  },
  { 
    week: "Week 5", 
    fieldTouch: 1, 
    fieldAPM: 2, 
    labTouch: 1, 
    labAPM: 0 
  },
  { 
    week: "Week 6", 
    fieldTouch: 2, 
    fieldAPM: 1, 
    labTouch: 1, 
    labAPM: 1 
  },
];

// Chart configuration
const chartConfig = {
  fieldTouch: {
    label: "Field (Touch)",
    color: "hsl(var(--chart-1))",
  },
  fieldAPM: {
    label: "Field (APM)",
    color: "hsl(var(--chart-2))",
  },
  labTouch: {
    label: "Lab (Touch)",
    color: "hsl(var(--chart-3))",
  },
  labAPM: {
    label: "Lab (APM)",
    color: "hsl(var(--chart-4))",
  },
} 

export default function DeviceInstallationChart() {
  // Calculate metrics
  const totalDevices = 20;
  
  const totalFieldTouch = chartData.reduce((sum, week) => sum + week.fieldTouch, 0);
  const totalFieldAPM = chartData.reduce((sum, week) => sum + week.fieldAPM, 0);
  const totalLabTouch = chartData.reduce((sum, week) => sum + week.labTouch, 0);
  const totalLabAPM = chartData.reduce((sum, week) => sum + week.labAPM, 0);

  const totalField = totalFieldTouch + totalFieldAPM;
  const totalLab = totalLabTouch + totalLabAPM;

  // Calculate percentages and trends
  const fieldRate = Math.round((totalField / totalDevices) * 100);
  const labRate = Math.round((totalLab / totalDevices) * 100);

  // Compare last two weeks for trend
  const lastWeek = chartData[chartData.length - 1];
  const prevWeek = chartData[chartData.length - 2];
  
  const fieldTrend = Math.round(
    (((lastWeek.fieldTouch + lastWeek.fieldAPM) - 
      (prevWeek.fieldTouch + prevWeek.fieldAPM)) / 
      (prevWeek.fieldTouch + prevWeek.fieldAPM)) * 100
  ) || 0;
  
  const labTrend = Math.round(
    (((lastWeek.labTouch + lastWeek.labAPM) - 
      (prevWeek.labTouch + prevWeek.labAPM)) / 
      (prevWeek.labTouch + prevWeek.labAPM)) * 100
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
              {totalField}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  fieldTrend >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {fieldTrend >= 0 ? "+" : ""}
                {fieldTrend}%
                {fieldTrend >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
              </span>
            </p>
            <p className="text-xs">Field Installations</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full w-12 h-12 text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {totalLab}
              <span
                className={`text-sm flex gap-1 items-baseline ${
                  labTrend >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {labTrend >= 0 ? "+" : ""}
                {labTrend}%
                {labTrend >= 0 ? <TrendUp size={16} /> : <TrendDown size={16} />}
              </span>
            </p>
            <p className="text-xs">Lab Installations</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full w-12 h-12 text-purple-600 dark:text-purple-400">
            <Lightning size={24} />
          </div>
          <div>
            <p className="font-semibold text-2xl flex items-baseline gap-2">
              {fieldRate + labRate}%
              <span className="text-green-500 text-sm">Total</span>
            </p>
            <p className="text-xs">Installation Rate</p>
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
                Field vs Lab Installations (Last 6 Weeks) - Touch & APM Meters
              </CardDescription>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-1))]"></div>
                <span className="text-xs font-medium">Field (Touch)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-2))]"></div>
                <span className="text-xs font-medium">Field (APM)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-3))]"></div>
                <span className="text-xs font-medium">Lab (Touch)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-[hsl(var(--chart-4))]"></div>
                <span className="text-xs font-medium">Lab (APM)</span>
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
                dataKey="fieldTouch"
                fill="var(--color-fieldTouch)"
                radius={4}
              />
              <Bar
                dataKey="fieldAPM"
                fill="var(--color-fieldAPM)"
                radius={4}
              />
              <Bar
                dataKey="labTouch"
                fill="var(--color-labTouch)"
                radius={4}
              />
              <Bar
                dataKey="labAPM"
                fill="var(--color-labAPM)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}