"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  FileCsv, 
  FileJs, 
  FileXls, 
  Funnel, 
  Calendar 
} from "@phosphor-icons/react";
import { fetchEventsReport } from "@/utils/events-apis";

export default function ReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const form = useForm({
    defaultValues: {
      deviceSearch: "",
      type: "",
      fromDate: "",
      toDate: "",
      format: "json",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    setReportData(null);

    try {
      const filters = {
        deviceSearch: data.deviceSearch,
        type: data.type,
        fromDate: data.fromDate,
        toDate: data.toDate,
      };

      const response = await fetchEventsReport(filters, data.format);

      if (data.format === "json") {
        setReportData(response);
      } else {
        // Handle file download
        const link = document.createElement("a");
        link.href = response.url;
        link.download = response.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(response.url);
      }
    } catch (err) {
      setError("Failed to generate report: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-6 w-6" />
            Events Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deviceSearch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device ID / Range</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 or 100-200" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1 or 1,2,3" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="date" 
                            {...field} 
                            className="pl-10"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="date" 
                            {...field} 
                            className="pl-10"
                          />
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Output Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="json">
                            <div className="flex items-center gap-2">
                              <FileJs className="h-4 w-4" />
                              JSON
                            </div>
                          </SelectItem>
                          <SelectItem value="csv">
                            <div className="flex items-center gap-2">
                              <FileCsv className="h-4 w-4" />
                              CSV
                            </div>
                          </SelectItem>
                          <SelectItem value="xlsx">
                            <div className="flex items-center gap-2">
                              <FileXls className="h-4 w-4" />
                              Excel
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  "Generating..."
                ) : (
                  <span className="flex items-center gap-2">
                    <Funnel className="h-4 w-4" />
                    Generate Report
                  </span>
                )}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {reportData && form.getValues("format") === "json" && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Report Preview</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.eventType}</TableCell>
                      <TableCell>{item.ts}</TableCell>
                      <TableCell>{item.eventName}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}