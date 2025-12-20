/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Search,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
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
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import EventMappingService, {
  EventMapping,
  EventMappingFilters,
} from "@/services/event-mapping.service";

// Zod Schema
const mappingSchema = z.object({
  type: z.coerce
    .number()
    .int()
    .positive("Event type must be a positive number"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  is_alert: z.boolean(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  enabled: z.boolean(),
});

type MappingForm = z.infer<typeof mappingSchema>;

export default function EventMappingPage() {
  const [filters, setFilters] = useState<EventMappingFilters>({
    search: "",
    is_alert: "",
    severity: "",
    enabled: "",
    page: 1,
    limit: 25,
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [data, setData] = useState<EventMapping[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<EventMapping | null>(
    null
  );

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  const [debouncedSearch] = useDebounce(filters.search, 600);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.is_alert !== "" ||
      filters.severity ||
      filters.enabled !== ""
  );

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EventMappingService.getAll({
        ...filters,
        search: debouncedSearch || undefined,
      });

      // FIXED: Extract the actual array and pagination correctly
      setData((res.data.data as unknown as EventMapping[]) || []); // ← This is the array of mappings
      setTotal(res.data.pagination?.total || 0); // ← Pagination is nested under data
    } catch (err: any) {
      toast.error("Failed to load event mappings");
      console.error(err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (refreshInterval) {
      intervalRef.current = setInterval(fetchMappings, refreshInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchMappings]);

  const handleRefresh = () => {
    setRefreshing(true);
    toast.success("Refreshed");
    fetchMappings();
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, page: 1 });
    setFilterDialogOpen(false);
    toast.success("Filters applied");
  };

  const handleResetFilters = () => {
    const reset: EventMappingFilters = {
      search: "",
      is_alert: "",
      severity: "",
      enabled: "",
      page: 1,
      limit: 25,
    };
    setFilters(reset);
    setTempFilters(reset);
    toast("Filters cleared");
  };

  const openFilterDialog = () => {
    setTempFilters(filters);
    setFilterDialogOpen(true);
  };

  const form = useForm({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      type: 0,
      name: "",
      description: "",
      is_alert: false,
      severity: "medium",
      enabled: true,
    },
  });

  const openEditDialog = (mapping?: EventMapping) => {
    if (mapping) {
      setSelectedMapping(mapping);
      form.reset({
        type: mapping.type,
        name: mapping.name,
        description: mapping.description || "",
        is_alert: mapping.is_alert,
        severity: mapping.severity,
        enabled: mapping.enabled,
      });
    } else {
      setSelectedMapping(null);
      form.reset({
        type: 0,
        name: "",
        description: "",
        is_alert: false,
        severity: "medium",
        enabled: true,
      });
    }
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (mapping: EventMapping) => {
    setSelectedMapping(mapping);
    setDeleteDialogOpen(true);
  };

  const onSubmit = async (values: MappingForm) => {
    try {
      const payload = {
        ...values,
        description: values.description?.trim() || undefined,
      };

      if (selectedMapping) {
        await EventMappingService.update(selectedMapping.id, payload);
        toast.success("Mapping updated successfully");
      } else {
        await EventMappingService.create(payload);
        toast.success("Mapping created successfully");
      }
      setEditDialogOpen(false);
      fetchMappings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!selectedMapping) return;
    try {
      await EventMappingService.delete(selectedMapping.id);
      toast.success("Mapping deleted");
      setDeleteDialogOpen(false);
      fetchMappings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const columns: ColumnDef<EventMapping>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {row.original.type}
        </code>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "is_alert",
      header: "Alert",
      cell: ({ row }) => (
        <Badge variant={row.original.is_alert ? "destructive" : "secondary"}>
          {row.original.is_alert ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const s = row.original.severity;
        return (
          <Badge
            variant={
              s === "critical"
                ? "destructive"
                : s === "high"
                ? "default"
                : s === "medium"
                ? "secondary"
                : "outline"
            }
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "enabled",
      header: "Enabled",
      cell: ({ row }) => (
        <Badge variant={row.original.enabled ? "default" : "secondary"}>
          {row.original.enabled ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => openEditDialog(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => openDeleteDialog(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / (filters.limit || 25)),
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Event Mappings"
        description="Define how device events are interpreted, alerted, and prioritized"
        size="sm"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ButtonGroup>
              <Dialog
                open={filterDialogOpen}
                onOpenChange={setFilterDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openFilterDialog}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {
                          [
                            filters.search && 1,
                            filters.is_alert !== "" && 1,
                            filters.severity && 1,
                            filters.enabled !== "" && 1,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Filter Event Mappings</DialogTitle>
                    <DialogDescription>
                      Narrow down by name, alert status, severity, or enabled
                      state.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Name or type..."
                          value={tempFilters.search || ""}
                          onChange={(e) =>
                            setTempFilters((p) => ({
                              ...p,
                              search: e.target.value,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Is Alert</Label>
                      <Select
                        value={
                          tempFilters.is_alert === ""
                            ? "all"
                            : String(tempFilters.is_alert)
                        }
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            is_alert: v === "all" ? "" : v === "true",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select
                        value={tempFilters.severity || "all"}
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            severity: v === "all" ? "" : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Enabled</Label>
                      <Select
                        value={
                          tempFilters.enabled === ""
                            ? "all"
                            : String(tempFilters.enabled)
                        }
                        onValueChange={(v) =>
                          setTempFilters((p) => ({
                            ...p,
                            enabled: v === "all" ? "" : v === "true",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setFilterDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleResetFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </ButtonGroup>

            <ButtonGroup>
              <Select
                value={refreshInterval ? String(refreshInterval) : "off"}
                onValueChange={(v) =>
                  setRefreshInterval(v === "off" ? null : Number(v))
                }
              >
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Refresh: Off" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Refresh: Off</SelectItem>
                  <SelectItem value="10000">Every 10s</SelectItem>
                  <SelectItem value="30000">Every 30s</SelectItem>
                  <SelectItem value="60000">Every 1 min</SelectItem>
                  <SelectItem value="300000">Every 5 min</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="icon"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </ButtonGroup>

            <Button onClick={() => openEditDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </div>
        }
      />

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table className="border-separate border-spacing-0 [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
            <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-background">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">
                        Loading event mappings...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No event mappings found</EmptyTitle>
                        <EmptyDescription>
                          {hasActiveFilters
                            ? "Try adjusting your filters"
                            : "Start by creating your first event mapping"}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={() => openEditDialog()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Mapping
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {((filters.page || 1) - 1) * (filters.limit || 25) + 1}–
              {Math.min((filters.page || 1) * (filters.limit || 25), total)} of{" "}
              {total.toLocaleString()} mappings
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(filters.limit || 25)}
                onValueChange={(v) =>
                  setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} rows
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      page: Math.max(1, (p.page || 1) - 1),
                    }))
                  }
                  disabled={(filters.page || 1) === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium px-3 border-y">
                  Page {filters.page || 1} /{" "}
                  {Math.ceil(total / (filters.limit || 25)) || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFilters((p) => ({ ...p, page: (p.page || 1) + 1 }))
                  }
                  disabled={
                    (filters.page || 1) >=
                    Math.ceil(total / (filters.limit || 25))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedMapping
                ? "Edit Event Mapping"
                : "Create New Event Mapping"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type (Number)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Over Voltage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief description..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  name="is_alert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Alert</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(v) => field.onChange(v === "true")}
                          value={String(field.value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(v) => field.onChange(v === "true")}
                        value={String(field.value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedMapping ? "Update Mapping" : "Create Mapping"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Event Mapping
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center">
            <p className="text-base">
              Are you sure you want to delete this mapping?
            </p>
            {selectedMapping && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-mono text-xs">
                  Type: <strong>{selectedMapping.type}</strong>
                </p>
                <p className="font-medium mt-1">{selectedMapping.name}</p>
                {selectedMapping.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedMapping.description}
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              This action <strong>cannot be undone</strong>.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
