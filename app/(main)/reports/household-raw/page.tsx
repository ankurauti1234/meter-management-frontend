/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Download,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { ButtonGroup } from "@/components/ui/button-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import ReportService from "@/services/report.service";

// Form schema - only dates needed
const formSchema = z.object({
  start_time: z.date().optional(),
  end_time: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UnbridgeReport {
  id: number;
  generation_time: string;
  report_date: string;
  report_url: string;
  session_count: number;
}

interface PaginationInfo {
  page: number | string;
  limit: number;
  total: number;
  pages: number;
}

export default function HHUnbridgedReportPage() {
  const [reports, setReports] = useState<UnbridgeReport[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const watchStart = form.watch("start_time");
  const watchEnd = form.watch("end_time");

  const fetchReports = useCallback(async () => {
    setLoading(true);

    const filters = {
      start_time: watchStart
        ? Math.floor(watchStart.getTime() / 1000)
        : undefined,
      end_time: watchEnd
        ? Math.floor(watchEnd.getTime() / 1000)
        : undefined,
      page,
      limit,
      format: "json" as const,
    };

    try {
      const res: any = await ReportService.getUnbridgeReports(filters);

      // Backend response: { success, msg, data: { reports, pagination } }
      const reportData = res?.data?.reports || [];
      const pagination: PaginationInfo = res?.data?.pagination || { total: 0 };

      setReports(reportData);
      setTotal(Number(pagination.total) || 0);
    } catch (err) {
      toast.error("Failed to load HH Unbridge reports");
      console.error(err);
      setReports([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [watchStart, watchEnd, page, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = (url: string, date: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `hh-unbridge-report-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const columns: ColumnDef<UnbridgeReport>[] = [
    {
      accessorKey: "report_date",
      header: "Report Date",
      cell: ({ row }) => (
        <span className="font-medium">
          {format(new Date(row.original.report_date), "PPP")}
        </span>
      ),
    },
    {
      accessorKey: "generation_time",
      header: "Generated At",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono">
          {format(new Date(row.original.generation_time), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      accessorKey: "session_count",
      header: "Session Count",
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono">
          {row.original.session_count.toLocaleString()}
        </Badge>
      ),
    },
    {
      accessorKey: "report_url",
      header: "Download",
      cell: ({ row }) => (
        <Button
          size="sm"
          onClick={() =>
            handleDownload(row.original.report_url, row.original.report_date)
          }
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download CSV
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="HH Unbridge Reports"
        description="Daily generated Half-Hourly Unbridge reports available for download"
        badge={<FileText className="h-5 w-5" />}
        size="lg"
        actions={
          <Form {...form}>
            <div className="flex flex-wrap items-end gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="min-w-48">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="min-w-48">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        }
      />

      <div className="rounded-lg border overflow-hidden bg-card">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
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
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Spinner className="h-8 w-8" />
                      <p className="text-muted-foreground">Loading reports...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No reports found</EmptyTitle>
                        <EmptyDescription>
                          No HH Unbridge reports available for the selected date range
                        </EmptyDescription>
                      </EmptyHeader>
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
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
              {total.toLocaleString()} reports
            </p>

            <div className="flex items-center gap-3">
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-2 text-xs font-medium border-y">
                  Page {page} of {Math.ceil(total / limit) || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}