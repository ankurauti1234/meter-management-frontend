"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  CheckCircle,
  XCircle,
  Info,
  Funnel,
  Queue,
  Siren,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  fetchAlerts,
  updateAlertStatus,
  fetchEventTypes,
} from "@/utils/events-apis";

const formatTimestamp = (ts) => {
  const timestamp = ts.toString().length === 10 ? ts * 1000 : ts;
  return new Date(timestamp).toLocaleString();
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [filters, setFilters] = useState({
    deviceSearch: "",
    type: "all",
    status: "all",
    priority: "all",
    page: 1,
    limit: "10",
    fromDate: "",
    toDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    setIsMounted(true);
    fetchEventTypes()
      .then((types) => setEventTypes(types.filter(type => type.isAlert)))
      .catch((error) => console.error("Failed to fetch event types:", error));
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const applyFilters = () => setAppliedFilters({ ...filters });
  const resetFilters = () => {
    const resetState = {
      deviceSearch: "",
      type: "all",
      status: "all",
      priority: "all",
      page: 1,
      limit: "10",
      fromDate: "",
      toDate: "",
    };
    setFilters(resetState);
    setAppliedFilters(null);
  };

  const isFilterSelected = () =>
    filters.deviceSearch !== "" ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.limit !== "10" ||
    filters.fromDate !== "" ||
    filters.toDate !== "";

  const areFiltersApplied = () => appliedFilters !== null;
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    if (appliedFilters) setAppliedFilters((prev) => ({ ...prev, page }));
  };

  const fetchAlertsData = async () => {
    setIsLoading(true);
    try {
      const activeFilters = appliedFilters || filters;
      const response = await fetchAlerts({
        ...activeFilters,
        type: activeFilters.type !== "all" ? Number(activeFilters.type) : undefined,
        status: activeFilters.status !== "all" ? activeFilters.status : undefined,
        priority: activeFilters.priority !== "all" ? activeFilters.priority : undefined,
      });
      setAlerts(response.alerts || []);
      setTotalAlerts(response.totalAlerts || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
      setTotalAlerts(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchAlertsData();
    }
  }, [isMounted, appliedFilters, filters.page]);

  const handleStatusChange = (alert) => {
    setSelectedAlert(alert);
    setNewStatus(alert.AlertStatus);
  };

  const confirmStatusChange = async () => {
    try {
      await updateAlertStatus(selectedAlert._id, newStatus);
      fetchAlertsData();
      setSelectedAlert(null);
    } catch (error) {
      console.error("Error updating alert status:", error);
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case "critical":
        return "destructive";
      case "high":
        return "warning";
      case "low":
        return "default";
      default:
        return "outline";
    }
  };

  const isNextDisabled = () => filters.page >= totalPages;

  if (!isMounted) {
    return (
      <div className="min-h-screen">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Siren className="text-primary" size={20} weight="duotone" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Siren className="text-primary" size={20} weight="duotone" />
              Alerts
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {alerts.length} alerts shown of {totalAlerts} total
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-9 flex items-center gap-2 border-muted hover:bg-muted/10">
                  <Funnel size={16} weight="duotone" className="text-primary" />
                  Filters
                  {areFiltersApplied() && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      Device Search
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-muted-foreground hover:text-primary" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Enter a single Device ID (e.g., "12345") or a range (e.g., "10000-20000").
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <Input
                      name="deviceSearch"
                      value={filters.deviceSearch}
                      onChange={(e) => handleFilterChange("deviceSearch", e.target.value)}
                      placeholder="e.g., 12345 or 10000-20000"
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => handleFilterChange("type", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {eventTypes.map((eventType) => (
                          <SelectItem key={eventType._id} value={eventType.typeId.toString()}>
                            {eventType.name} (ID: {eventType.typeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange("status", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="generated">Generated</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) => handleFilterChange("priority", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">From Date</label>
                    <Input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">To Date</label>
                    <Input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange("toDate", e.target.value)}
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Items per Page</label>
                    <Select
                      value={filters.limit}
                      onValueChange={(value) => handleFilterChange("limit", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 20, 50, 100].map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={applyFilters}
                      disabled={!isFilterSelected()}
                      className="h-9 bg-primary hover:bg-primary/90"
                    >
                      Apply
                    </Button>
                    {areFiltersApplied() && (
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="h-9 flex items-center gap-2 border-muted hover:bg-muted/10"
                      >
                        <ArrowCounterClockwise size={16} />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Device ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading alerts...</div>
                    </TableCell>
                  </TableRow>
                ) : alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No alerts available
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert._id}>
                      <TableCell className="font-medium">{alert.DEVICE_ID}</TableCell>
                      <TableCell>{formatTimestamp(alert.TS)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {eventTypes.find(t => t.typeId === alert.Type)?.name || alert.Type}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.Event_Name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.AlertStatus === "resolved"
                              ? "default"
                              : alert.AlertStatus === "pending"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {alert.AlertStatus.charAt(0).toUpperCase() + alert.AlertStatus.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(eventTypes.find(t => t.typeId === alert.Type)?.priority)}>
                          {(eventTypes.find(t => t.typeId === alert.Type)?.priority || "unknown").charAt(0).toUpperCase() +
                            (eventTypes.find(t => t.typeId === alert.Type)?.priority || "unknown").slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-muted hover:bg-muted"
                          onClick={() => handleStatusChange(alert)}
                        >
                          Change Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {alerts.length} of {totalAlerts} alerts
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(filters.page - 1)}
                disabled={filters.page === 1 || isLoading}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                onClick={() => goToPage(filters.page + 1)}
                disabled={isNextDisabled() || isLoading}
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

      {/* Status Change Popover */}
      {selectedAlert && (
        <Popover open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <PopoverContent className="w-80 p-4">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-primary">Change Alert Status</h4>
              <p className="text-sm text-muted-foreground">
                Update the status for alert on device {selectedAlert.DEVICE_ID}.
              </p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-10 bg-background/50">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                  className="h-9 border-muted hover:bg-muted/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStatusChange}
                  className="h-9 bg-primary hover:bg-primary/90"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}