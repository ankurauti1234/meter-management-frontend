"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Queue,
  ArrowClockwise,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { fetchEvents } from "@/utils/events-apis";
import { fetchEventTypes } from "@/utils/event-types-apis";

const formatTimestamp = (ts) => {
  const timestamp = ts.toString().length === 10 ? ts * 1000 : ts;
  return new Date(timestamp).toLocaleString();
};

// New function to format Details object
const formatDetails = (details, type) => {
  if (!details) return "-";
  
  // For Type 29, remove image_path from the display
  if (type === 29 || type === "29") {
    const { image_path, ...rest } = details;
    return JSON.stringify(rest);
  }
  
  return JSON.stringify(details);
};

export default function EventStream() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [filters, setFilters] = useState({
    deviceSearch: "",
    type: "all",
    page: 1,
    limit: "10",
    fromDate: "",
    toDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState("30");

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
    const resetState = { 
      deviceSearch: "", 
      type: "all", 
      page: 1, 
      limit: "10",
      fromDate: "",
      toDate: ""
    };
    setFilters(resetState);
    setAppliedFilters(null);
  };

  const isFilterSelected = () =>
    filters.deviceSearch !== "" || 
    filters.type !== "all" || 
    filters.limit !== "10" ||
    filters.fromDate !== "" ||
    filters.toDate !== "";

  const areFiltersApplied = () => appliedFilters !== null;
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    if (appliedFilters) setAppliedFilters((prev) => ({ ...prev, page }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const activeFilters = appliedFilters || filters;
      const response = await fetchEvents(activeFilters);
      
      setEvents(response.events || []);
      setTotalEvents(response.totalEvents || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setTotalEvents(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    fetchData();
    const interval = setInterval(fetchData, parseInt(refreshInterval) * 1000);

    return () => clearInterval(interval);
  }, [isMounted, appliedFilters, filters.page, refreshInterval]);

  const isNextDisabled = () => filters.page >= totalPages;

  const handleDeviceClick = (meterId) => {
    router.push(`/live-monitoring/${meterId}`);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Queue className="text-primary" size={20} weight="duotone" />
              Event Stream
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
              <Queue className="text-primary" size={20} weight="duotone" />
              Event Stream
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {events.length} events shown of {totalEvents} total
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowClockwise size={16} className="text-muted-foreground" />
              <Select
                value={refreshInterval}
                onValueChange={setRefreshInterval}
              >
                <SelectTrigger className="h-9 w-24 bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 sec</SelectItem>
                  <SelectItem value="10">10 sec</SelectItem>
                  <SelectItem value="30">30 sec</SelectItem>
                  <SelectItem value="60">60 sec</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <PopoverContent className="w-96 p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading events...</div>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No events available
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell className="font-medium">
                        <span 
                          onClick={() => handleDeviceClick(event.DEVICE_ID)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {event.DEVICE_ID}
                        </span>
                      </TableCell>
                      <TableCell>{formatTimestamp(event.TS)}</TableCell>
                      <TableCell>{event.Type}</TableCell>
                      <TableCell>{event.Event_Name || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatDetails(event.Details, event.Type)}
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
    </div>
  );
}