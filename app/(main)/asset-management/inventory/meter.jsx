"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
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
  Info,
  Funnel,
  Queue,
  ArrowCounterClockwise,
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
import { fetchAllMeters } from "@/utils/events-apis";

const formatTimestamp = (ts) => {
  return new Date(ts).toLocaleString();
};

export default function MeterStream() {
  const [meters, setMeters] = useState([]);
  const [filters, setFilters] = useState({
    deviceSearch: "",
    page: 1,
    limit: "10",
    hhid: "",
    associated: "all", // Changed from "" to "all"
    isAssigned: "all", // Changed from "" to "all"
    fromDate: "",
    toDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeters, setTotalMeters] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
      page: 1,
      limit: "10",
      hhid: "",
      associated: "all", // Changed from "" to "all"
      isAssigned: "all", // Changed from "" to "all"
      fromDate: "",
      toDate: "",
    };
    setFilters(resetState);
    setAppliedFilters(null);
  };

  const isFilterSelected = () =>
    filters.deviceSearch !== "" ||
    filters.hhid !== "" ||
    filters.associated !== "all" || // Changed from "" to "all"
    filters.isAssigned !== "all" || // Changed from "" to "all"
    filters.limit !== "10" ||
    filters.fromDate !== "" ||
    filters.toDate !== "";

  const areFiltersApplied = () => appliedFilters !== null;
  const goToPage = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    if (appliedFilters) setAppliedFilters((prev) => ({ ...prev, page }));
  };

  useEffect(() => {
    if (!isMounted) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const activeFilters = appliedFilters || filters;
        // Remove "all" values from the filters sent to the API
        const apiFilters = {
          ...activeFilters,
          associated: activeFilters.associated === "all" ? undefined : activeFilters.associated,
          isAssigned: activeFilters.isAssigned === "all" ? undefined : activeFilters.isAssigned,
        };
        const response = await fetchAllMeters(apiFilters);

        setMeters(response.meters || []);
        setTotalMeters(response.totalMeters || 0);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error fetching meters:", error);
        setMeters([]);
        setTotalMeters(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isMounted, appliedFilters, filters.page]);

  const isNextDisabled = () => filters.page >= totalPages;

  if (!isMounted) {
    return (
      <div className="min-h-screen">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Queue className="text-primary" size={20} weight="duotone" />
              Meters
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
              Meters
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {meters.length} meters shown of {totalMeters} total
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 flex items-center gap-2 border-muted hover:bg-muted/10"
                >
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
                    <label className="text-sm font-medium text-muted-foreground">HHID</label>
                    <Input
                      name="hhid"
                      value={filters.hhid}
                      onChange={(e) => handleFilterChange("hhid", e.target.value)}
                      placeholder="Household ID"
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Associated</label>
                    <Select
                      value={filters.associated}
                      onValueChange={(value) => handleFilterChange("associated", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem> {/* Changed from "" to "all" */}
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Assigned</label>
                    <Select
                      value={filters.isAssigned}
                      onValueChange={(value) => handleFilterChange("isAssigned", value)}
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem> {/* Changed from "" to "all" */}
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
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
                  <TableHead>Created At</TableHead>
                  <TableHead>HHID</TableHead>
                  <TableHead>Associated</TableHead>
                  <TableHead>Assigned</TableHead>
                  {/* <TableHead className="text-right">SIM2 IMSI</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading meters...</div>
                    </TableCell>
                  </TableRow>
                ) : meters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No meters available
                    </TableCell>
                  </TableRow>
                ) : (
                  meters.map((meter) => (
                    <TableRow key={meter.deviceId}>
                      <TableCell className="font-medium">{meter.deviceId}</TableCell>
                      <TableCell>{formatTimestamp(meter.createdAt)}</TableCell>
                      <TableCell>{meter.hhid || "-"}</TableCell>
                      <TableCell>{meter.isAssociated ? "Yes" : "No"}</TableCell>
                      <TableCell>{meter.isAssigned ? "Yes" : "No"}</TableCell>
                      {/* <TableCell className="text-right">{meter.sim2Imsi || "-"}</TableCell> */}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {meters.length} of {totalMeters} meters
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