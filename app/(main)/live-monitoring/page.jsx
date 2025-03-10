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
  WifiHigh,
  WifiSlash,
  ArrowCounterClockwise,
  Info,
  Funnel,
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
import { fetchEventTypes, getRealtimeEventsUrl } from "@/utils/events-apis";
import dynamic from "next/dynamic"; // Import dynamic for client-side only loading

// Dynamically import DeviceLocationMap with SSR disabled
const DeviceLocationMap = dynamic(() => import("./map"), {
  ssr: false, // Disable server-side rendering for this component
});

const formatTimestamp = (ts) => {
  const timestamp = ts.toString().length === 10 ? ts * 1000 : ts;
  return new Date(timestamp).toLocaleString();
};

export default function LiveMonitoring() {
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [filters, setFilters] = useState({
    deviceSearch: "",
    type: "all",
    page: 1,
    limit: "10",
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchEventTypes()
      .then((types) => setEventTypes(types))
      .catch((error) => console.error(error));
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
    const resetState = { deviceSearch: "", type: "all", page: 1, limit: "10" };
    setFilters(resetState);
    setAppliedFilters(null);
  };

  const isFilterSelected = () =>
    filters.deviceSearch !== "" || filters.type !== "all" || filters.limit !== "10";
  const areFiltersApplied = () => appliedFilters !== null;
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    if (appliedFilters) setAppliedFilters((prev) => ({ ...prev, page }));
  };

  useEffect(() => {
    if (!isMounted) return;

    let eventSource;
    const connectSSE = () => {
      const activeFilters = appliedFilters || filters;
      const url = getRealtimeEventsUrl(activeFilters);

      eventSource = new EventSource(url);
      eventSource.onopen = () => setIsConnected(true);
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "initial") {
          setEvents(data.events);
          setTotalEvents(data.totalEvents);
          setTotalPages(data.totalPages);
        } else if (data.type === "new") {
          if (activeFilters.page === 1) {
            setEvents((prevEvents) => {
              const updatedEvents = [...data.events, ...prevEvents].slice(0, parseInt(activeFilters.limit));
              return updatedEvents;
            });
            setTotalEvents((prev) => prev + data.events.length);
            setTotalPages(Math.ceil((totalEvents + data.events.length) / parseInt(activeFilters.limit)));
          }
        }
      };
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        setTimeout(connectSSE, 2000);
      };
    };

    connectSSE();
    return () => eventSource?.close();
  }, [isMounted, appliedFilters, filters.page]);

  const isNextDisabled = () => filters.page >= totalPages;

  if (!isMounted) {
    return (
      <div className="min-h-screen">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <WifiHigh className="text-primary" size={20} weight="duotone" />
              Live Monitoring
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
      <DeviceLocationMap />
      <Card className="w-full rounded-lg h-full">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <WifiHigh className="text-primary" size={20} weight="duotone" />
              Live Monitoring
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {events.length} events shown of {totalEvents} total
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
            <Badge
              variant={isConnected ? "success" : "destructive"}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-green-500/90 cursor-default"
            >
              {isConnected ? <WifiHigh size={14} /> : <WifiSlash size={14} />}
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
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
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No events available
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell className="font-medium">{event.DEVICE_ID}</TableCell>
                      <TableCell>{formatTimestamp(event.TS)}</TableCell>
                      <TableCell>{event.Type}</TableCell>
                      <TableCell>{event.Event_Name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {event.Details ? JSON.stringify(event.Details) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {events.length} of {totalEvents} events
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(filters.page - 1)}
                disabled={filters.page === 1}
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
                disabled={isNextDisabled()}
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
    </div>
  );
}