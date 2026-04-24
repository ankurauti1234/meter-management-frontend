/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Filter,
  RefreshCw,
  Search,
  X,
  Home,
  Users,
  Radio,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ButtonGroup } from "@/components/ui/button-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import eventsService from "@/services/events.service";

interface HouseholdItem {
  device_id: string;
  hhid: string;
  household_id: string;
  total_members: number;
  active_users: number;
  last_type3_timestamp: number | null;
  last_type3_details: any;
}

export default function AllHouseholdVisualizationPage() {
  const [filters, setFilters] = useState({
    device_id: "",
    hhid: "",
    status: "all" as "all" | "active" | "inactive",
    page: 1,
    limit: 12,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [data, setData] = useState<HouseholdItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasActiveFilters = Boolean(filters.device_id || filters.hhid || filters.status !== "all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventsService.getHouseholdVisualization({
        device_id: filters.device_id || undefined,
        hhid: filters.hhid || undefined,
        status: filters.status,
        page: filters.page,
        limit: filters.limit,
      });

      setData(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      toast.error("Failed to load household visualization data");
      console.error(err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    toast.success("Refreshed");
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset = {
      device_id: "",
      hhid: "",
      status: "all" as const,
      page: 1,
      limit: 12,
    };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const renderMembers = (item: HouseholdItem) => {
    const members = item.last_type3_details?.members;
    const totalCount = item.total_members;
    const activeCount = item.active_users;

    if (Array.isArray(members) && members.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-3">
          {members.map((member: any, idx: number) => (
            <TooltipProvider key={member.member_id || idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`p-1.5 rounded-full border transition-colors ${
                      member.active
                        ? "bg-green-100 border-green-200 text-green-600"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <UserIcon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-semibold">{member.member_id || `Member ${idx + 1}`}</p>
                    <p>Age: {member.age}</p>
                    <p>Gender: {member.gender}</p>
                    <p>Status: {member.active ? "Active" : "Inactive"}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {totalCount > members.length && (
             <div className="p-1.5 rounded-full border bg-slate-50 border-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold w-7 h-7">
               +{totalCount - members.length}
             </div>
          )}
        </div>
      );
    }

    // Fallback if members array is not present
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {Array.from({ length: totalCount }).map((_, idx) => (
          <div
            key={idx}
            className={`p-1.5 rounded-full border ${
              idx < activeCount
                ? "bg-green-100 border-green-200 text-green-600"
                : "bg-slate-50 border-slate-200 text-slate-400"
            }`}
          >
            <UserIcon className="h-4 w-4" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-background">
      <PageHeader
        title="All Household Visualization"
        description="Real-time occupancy and member status for households (IM000101 - IM000600)"
        badge={
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border">
              Total Households: {total.toLocaleString()}
            </Badge>
          </div>
        }
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-background/80 backdrop-blur-sm border-border shadow-sm transition-all hover:bg-accent">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {[filters.device_id && 1, filters.hhid && 1].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter Households</DialogTitle>
                    <DialogDescription>Search by Device ID, HHID, or occupancy status</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Device ID</Label>
                      <Input
                        placeholder="IM000..."
                        value={tempFilters.device_id}
                        onChange={(e) => setTempFilters((p) => ({ ...p, device_id: e.target.value }))}
                        className="focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HHID</Label>
                      <Input
                        placeholder="Search HHID..."
                        value={tempFilters.hhid}
                        onChange={(e) => setTempFilters((p) => ({ ...p, hhid: e.target.value }))}
                        className="focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleApplyFilters} className="flex-1">
                      Apply Filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={handleResetFilters} className="bg-background border-border shadow-sm">
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </ButtonGroup>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="icon"
              className="bg-background border-border shadow-sm transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Spinner className="h-12 w-12 text-primary" />
          <p className="text-muted-foreground font-medium">Fetching household data...</p>
        </div>
      ) : data.length === 0 ? (
        <Empty className="border-dashed border-2 border-border rounded-3xl p-12 bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="p-6 rounded-full mb-4 bg-muted text-muted-foreground">
              <Home className="h-16 w-16" />
            </EmptyMedia>
            <EmptyTitle className="text-2xl font-bold">No Households Found</EmptyTitle>
            <EmptyContent className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any households matching your current filters. Try adjusting your search criteria.
            </EmptyContent>
          </EmptyHeader>
          <Button onClick={handleResetFilters} className="mt-6">
            Clear All Filters
          </Button>
        </Empty>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((item) => (
              <Card
                key={item.device_id}
                className="overflow-hidden group border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200 rounded-2xl p-0"
              >
                <CardHeader className="p-4 pb-0 border-b bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        <Home className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold tracking-tight">{item.hhid}</CardTitle>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{item.device_id}</p>
                      </div>
                    </div>
                    {item.active_users > 0 ? (
                      <Badge className="bg-primary text-primary-foreground">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className=" p-4 pt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <Users className="h-4 w-4" />
                        <span>Occupancy</span>
                      </div>
                      <span className="font-bold text-foreground">
                        {item.active_users} / {item.total_members}
                      </span>
                    </div>

                    {renderMembers(item)}
                  </div>
                </CardContent>
                <CardFooter className=" p-4 pt-0 border-t">
                  <div className="flex items-center justify-between text-xs w-full">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                      <Radio className={`h-3.5 w-3.5 ${item.last_type3_timestamp ? "text-primary" : "text-muted"}`} />
                      <span>Latest Signal</span>
                    </div>
                    <span className="text-foreground font-semibold">
                      {item.last_type3_timestamp
                        ? new Date(item.last_type3_timestamp * 1000).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between px-2 py-8 gap-4 border-t border-border">
            <p className="text-sm text-muted-foreground font-medium">
              Showing <span className="text-foreground font-bold">{(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)}</span> of <span className="text-foreground font-bold">{total.toLocaleString()}</span> households
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Rows</Label>
                <Select
                  value={String(filters.limit)}
                  onValueChange={(v) => setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))}
                >
                  <SelectTrigger className="w-[80px] h-9 rounded-xl bg-card border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[8, 12, 24, 48].map((n) => (
                      <SelectItem key={n} value={String(n)} className="rounded-lg">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ButtonGroup className="shadow-sm rounded-xl overflow-hidden border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted"
                  onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="h-9 px-4 flex items-center border-x border-border text-sm font-bold text-foreground">
                  {filters.page} / {Math.ceil(total / filters.limit)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted"
                  onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={filters.page >= Math.ceil(total / filters.limit)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
