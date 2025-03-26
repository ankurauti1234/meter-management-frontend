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
import { fetchAllHouseholds } from "@/utils/household-apis";

export default function HouseholdStream() {
  const [households, setHouseholds] = useState([]);
  const [filters, setFilters] = useState({
    hhid: "",
    is_assigned: undefined, // undefined means no filter applied
    meter_id: "",
    page: 1,
    limit: "10",
  });
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHouseholds, setTotalHouseholds] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1, // Reset to page 1 when filters change
    }));
  };

  const applyFilters = () => setAppliedFilters({ ...filters });
  const resetFilters = () => {
    const resetState = {
      hhid: "",
      is_assigned: undefined,
      meter_id: "",
      page: 1,
      limit: "10",
    };
    setFilters(resetState);
    setAppliedFilters(null);
  };

  const isFilterSelected = () =>
    filters.hhid !== "" ||
    filters.is_assigned !== undefined ||
    filters.meter_id !== "" ||
    filters.limit !== "10";

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
        const response = await fetchAllHouseholds(activeFilters);

        setHouseholds(response.households || []);
        setTotalHouseholds(response.totalCount || 0); // Use totalCount from API
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error("Error fetching households:", error);
        setHouseholds([]);
        setTotalHouseholds(0);
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
              Household Stream
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
              Household Stream
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {households.length} households shown of {totalHouseholds} total
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
                      HHID
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-muted-foreground hover:text-primary" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Enter a specific Household ID (e.g., "1001").
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <Input
                      name="hhid"
                      value={filters.hhid}
                      onChange={(e) => handleFilterChange("hhid", e.target.value)}
                      placeholder="e.g., 1001"
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      Assignment Status
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-muted-foreground hover:text-primary" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Filter by whether the household is assigned.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <Select
                      value={filters.is_assigned === undefined ? "all" : filters.is_assigned.toString()}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "is_assigned",
                          value === "all" ? undefined : value === "true"
                        )
                      }
                    >
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Assigned</SelectItem>
                        <SelectItem value="false">Not Assigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      Meter ID
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={16} className="text-muted-foreground hover:text-primary" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            Enter a specific Meter ID (e.g., "5001").
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <Input
                      name="meter_id"
                      value={filters.meter_id}
                      onChange={(e) => handleFilterChange("meter_id", e.target.value)}
                      placeholder="e.g., 5001"
                      className="h-10 bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Items per Page
                    </label>
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
                  <TableHead>HHID</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Submeters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading households...</div>
                    </TableCell>
                  </TableRow>
                ) : households.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No households available
                    </TableCell>
                  </TableRow>
                ) : (
                  households.map((household) => (
                    <TableRow key={household.HHID}>
                      <TableCell className="font-medium">{household.HHID}</TableCell>
                      <TableCell>{household.members.join(", ")}</TableCell>
                      <TableCell>{household.is_assigned ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {household.submeters.length > 0 ? household.submeters.join(", ") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {households.length} of {totalHouseholds} households
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