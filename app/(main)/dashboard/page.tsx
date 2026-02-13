import React from "react";
import { StatCard } from "@/components/cards/stat-card";
import { Cpu, Activity, Users, Server } from "lucide-react";
import { AlertCard } from "@/components/cards/alert-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const stats = [
    {
      icon: Cpu,
      title: "Active Devices",
      value: 128,
      color: "text-chart-1",
      bgColor: "bg-chart-1/15",
    },
    {
      icon: Activity,
      title: "Live Alerts",
      value: 14,
      color: "text-chart-2",
      bgColor: "bg-chart-2/15",
    },
    {
      icon: Users,
      title: "Total Users",
      value: 52,
      color: "text-chart-3",
      bgColor: "bg-chart-3/15",
    },
    {
      icon: Server,
      title: "Servers Online",
      value: 6,
      color: "text-chart-4",
      bgColor: "bg-chart-4/15",
    },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 w-full ">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full ">
        {/* <div className="bg-card rounded-lg border h-96 w-full"></div> */}
       

        <Card className="w-full lg:col-span-2 gap-0 py-0">
          <CardHeader className="flex flex-col  p-3">
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
