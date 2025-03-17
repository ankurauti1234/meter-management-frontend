"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldWarning,
  Bell,
  BatteryWarning,
  SimCard,
  Gear,
  Siren,
  ArrowRight,
  DotsThreeOutline,
} from "@phosphor-icons/react";
import { fetchAlerts } from "@/utils/events-apis";

// Alert type mappings using ShadCN colors
const alertTypeStyles = {
  5: { icon: <ShieldWarning size={16} />, name: "Tamper", color: "text-red-500", bg: "bg-red-50 dark:bg-red-600/25" },
  6: { icon: <Siren size={16} />, name: "SoS", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-600/25" },
  7: { icon: <BatteryWarning size={16} />, name: "Battery", color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-600/25" },
  16: { icon: <SimCard size={16} />, name: "Sim Alert", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-600/25" },
  17: { icon: <Gear size={16} />, name: "System", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-600/25" },
};

// Status-based styling using ShadCN colors
const getStatusStyles = (status) => {
  switch (status) {
    case "generated":
      return { text: "text-purple-600", border: "border-purple-200", bgHover: "hover:bg-purple-100" };
    case "pending":
      return { text: "text-orange-600", border: "border-orange-200", bgHover: "hover:bg-orange-100" };
    case "resolved":
      return { text: "text-green-600", border: "border-green-200", bgHover: "hover:bg-green-100" };
    default:
      return { text: "text-gray-600", border: "border-gray-200", bgHover: "hover:bg-gray-100" };
  }
};

export default function TickerDeviceAlerts({ className, ...props }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const filters = { page: 1, limit: 5 };
        const data = await fetchAlerts(filters);
        setAlerts(data.alerts || []);
      } catch (err) {
        setError("Failed to load alerts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const handleViewAll = () => {
    router.push("/meter-management/alerts");
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts * 1000); // Assuming TS is in seconds
    return date.toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  };

  return (
    <Card className={cn("w-full  shadow-sm rounded-lg overflow-hidden", className)} {...props}>
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
   <div>
   <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bell weight="duotone" className="text-primary" size={20} />
                Device Alerts
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Latest alerts from meters
              </CardDescription>
   </div>
        <Button
          onClick={handleViewAll}
          variant="outline"
          size="sm"
          className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          View All <ArrowRight size={14} className="ml-1" />
        </Button>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500 dark:border-gray-400"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-500 dark:text-red-400">{error}</p>
        ) : alerts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No alerts to display</p>
        ) : (
          <div className="relative overflow-hidden">
            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 animate-[scroll_20s_linear_infinite] hover:pause-animation">
              {alerts.concat(alerts).map((alert, index) => { // Duplicate alerts for seamless scrolling
                const typeStyles = alertTypeStyles[alert.Type] || alertTypeStyles[5]; // Default to Tamper
                const statusStyles = getStatusStyles(alert.AlertStatus);

                return (
                  <div
                    key={`${alert._id}-${index}`} // Unique key for duplicated items
                    className={cn(
                      "flex-shrink-0 w-64 p-3 rounded-md border transition-colors",
                      typeStyles.bg,
                      statusStyles.border,
                      statusStyles.bgHover,
                      "group"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={typeStyles.color}>{typeStyles.icon}</span>
                        <div>
                          <p className={cn("text-sm font-medium", typeStyles.color)}>
                            {typeStyles.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Device <span className="font-semibold text-sm">{alert.DEVICE_ID}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <DotsThreeOutline size={14} />
                      </Button>
                    </div>
                    <p className={cn("text-xs mt-1", statusStyles.text)}>
                      {formatTimestamp(alert.TS)} • {alert.AlertStatus}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Fade Edges */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-card to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-card to-transparent pointer-events-none" />
          </div>
        )}
        {!loading && alerts.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleViewAll}
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              See Full Alert Log
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}