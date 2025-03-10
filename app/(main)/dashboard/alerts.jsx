"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Warning,
  BellSimple,
  ShieldWarning,
  Clock,
  ArrowRight,
  Bell,
  Pulse,
  Plus,
  Eye,
  DotsThreeOutline,
} from "@phosphor-icons/react";

// Mock data for 5 alerts
const mockAlerts = [
  {
    id: 1,
    device: "Meter-001",
    message: "Power Surge Detected",
    priority: "critical",
    status: "generated",
    timestamp: "2025-02-26 08:15:00",
  },
  {
    id: 2,
    device: "Meter-002",
    message: "Low Voltage Warning",
    priority: "warn",
    status: "pending",
    timestamp: "2025-02-26 09:30:00",
  },
  {
    id: 3,
    device: "Meter-003",
    message: "Routine Check Passed",
    priority: "notify",
    status: "resolved",
    timestamp: "2025-02-26 10:00:00",
  },
  {
    id: 4,
    device: "Meter-004",
    message: "Overheating Risk",
    priority: "critical",
    status: "pending",
    timestamp: "2025-02-26 11:45:00",
  },
  {
    id: 5,
    device: "Meter-005",
    message: "Signal Weak",
    priority: "warn",
    status: "generated",
    timestamp: "2025-02-26 12:10:00",
  },
];

// Priority-based styling with Phosphor Icons
const getPriorityStyles = (priority) => {
  switch (priority) {
    case "critical":
      return {
        bg: "bg-red-100 dark:bg-red-900/20",
        icon: <ShieldWarning size={16} />,
        iconColor: "text-red-600 dark:text-red-400",
        iconBg: "bg-red-200 dark:bg-red-800/50",
        text: "text-red-800 dark:text-red-200",
        border: "border-red-200 dark:border-red-800",
        timeline: "bg-red-500",
      };
    case "warn":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/20",
        icon: <Warning size={16} />,
        iconColor: "text-yellow-600 dark:text-yellow-400",
        iconBg: "bg-yellow-200 dark:bg-yellow-800/50",
        text: "text-yellow-800 dark:text-yellow-200",
        border: "border-yellow-200 dark:border-yellow-800",
        timeline: "bg-yellow-500",
      };
    case "notify":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/20",
        icon: <BellSimple size={16} />,
        iconColor: "text-blue-600 dark:text-blue-400",
        iconBg: "bg-blue-200 dark:bg-blue-800/50",
        text: "text-blue-800 dark:text-blue-200",
        border: "border-blue-200 dark:border-blue-800",
        timeline: "bg-blue-500",
      };
    default:
      return {
        bg: "bg-gray-100 dark:bg-gray-800/50",
        icon: <BellSimple size={16} />,
        iconColor: "text-gray-600 dark:text-gray-400",
        iconBg: "bg-gray-200 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        border: "border-gray-200 dark:border-gray-700",
        timeline: "bg-gray-500",
      };
  }
};

// Status-based styling
const getStatusStyles = (status) => {
  switch (status) {
    case "generated":
      return {
        bg: "bg-purple-500",
        text: "text-white",
        icon: <Pulse size={12} />,
      };
    case "pending":
      return {
        bg: "bg-orange-500",
        text: "text-white",
        icon: <Clock size={12} />,
      };
    case "resolved":
      return {
        bg: "bg-green-500",
        text: "text-white",
        icon: <Eye size={12} />,
      };
    default:
      return {
        bg: "bg-gray-500",
        text: "text-white",
        icon: null,
      };
  }
};

export default function TimelineDeviceAlerts({ className, ...props }) {
  const router = useRouter();

  const handleViewAll = () => {
    router.push("/meter-management/alerts");
  };

  // Get just the time from timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={cn("w-full overflow-hidden", className)} {...props}>
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-1">
            <Bell weight="duotone" className="text-primary" size={20} />
            Device Alerts
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Latest alerts from all active meters
          </CardDescription>
        </div>
        <Button
          onClick={handleViewAll}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8 px-3 text-xs"
        >
          View All
          <ArrowRight size={12} />
        </Button>
      </CardHeader>

      <CardContent className="px-4 py-2">
        <div className="relative">
          
          {/* Alerts */}
          <div className=" space-y-3">
            {mockAlerts.map((alert) => {
              const priorityStyles = getPriorityStyles(alert.priority);
              const statusStyles = getStatusStyles(alert.status);
              
              return (
                <div key={alert.id} className="relative">
                  {/* Timeline dot */}
                 
                  
                
                  
                  {/* Alert content */}
                  <div className={cn(
                    "pl-2 pr-3 py-2 rounded-md border",
                    priorityStyles.bg,
                    priorityStyles.border
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "p-1 rounded-full",
                          priorityStyles.iconBg
                        )}>
                          <span className={priorityStyles.iconColor}>
                            {priorityStyles.icon}
                          </span>
                        </div>
                        <span className={cn("font-medium text-sm", priorityStyles.text)}>
                          {alert.device}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={cn(
                          statusStyles.bg,
                          statusStyles.text,
                          "flex items-center gap-0.5 h-5 text-xs px-1.5"
                        )}>
                          {statusStyles.icon}
                          <span className="text-xs">{alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}</span>
                        </Badge>
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0 rounded-full">
                          <DotsThreeOutline size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className={cn("text-xs pl-7", priorityStyles.text)}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* "Show more" button */}
          <div className="ml-10 mt-4 flex justify-center">
            <Button
              onClick={handleViewAll}
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              <Plus size={14} className="mr-1" />
              Show more alerts
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}