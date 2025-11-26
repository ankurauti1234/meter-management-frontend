/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(dashboard)/assets/upload/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AssetsService from "@/services/assets.service";

// Zod Schema
const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine((f) => f.size <= 10 * 1024 * 1024, "File must be ≤ 10 MB")
    .refine(
      (f) =>
        f.type === "text/csv" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        f.name.endsWith(".csv") ||
        f.name.endsWith(".xlsx"),
      "Only CSV or XLSX files allowed"
    ),
  groupName: z.string().min(1, "Please select or enter a group name"),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export default function UploadAssetsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    data?: { uploaded: number; saved: number; synced: number };
  } | null>(null);

  const [groups, setGroups] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      groupName: "",
    },
  });

  // Fetch AWS Thing Groups for suggestions
  const fetchGroups = useCallback(async () => {
    setLoadingGroups(true);
    try {
      const res = await AssetsService.getThingGroups({ limit: 25 });
      const groupNames = res.groups.map((g: any) => g.groupName).sort();
      setGroups(groupNames);
    } catch (err) {
      toast.error("Failed to load AWS groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const onSubmit = async (data: UploadFormData) => {
    setIsUploading(true);
    setUploadResult(null);
    setProgress(10);

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 400);

      const result = await AssetsService.uploadMeters(data.file, data.groupName);

      clearInterval(interval);
      setProgress(100);

      setUploadResult({
        success: true,
        message: "Upload successful!",
        data: result,
      });

      toast.success(`Saved ${result.saved} meters • Synced ${result.synced} with AWS`);
      form.reset();
    } catch (error: any) {
      const msg =
        error.response?.data?.msg ||
        error.message ||
        "Upload failed. Please check your file and try again.";

      setUploadResult({ success: false, message: msg });
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  // Download Sample CSV
  const downloadSampleCSV = () => {
    const csvContent = `data:text/csv;charset=utf-8,
meterId,meterType,assetSerialNumber,powerHATStatus
MTR-001,SinglePhaseMeter,ASN1001,Flashed
MTR-002,ThreePhaseMeter,ASN1002,No HAT
MTR-003,TouchMeterWithWiFi,ASN1003,Unknown`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sample_meters_upload_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Sample CSV downloaded");
  };

  const file = form.watch("file");

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Upload Meters"
        description="Bulk upload meter inventory via CSV or XLSX"
        badge={<FileSpreadsheet className="h-5 w-5" />}
        size="lg"
      />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* File Dropzone */}
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>CSV or XLSX File</FormLabel>
                        <FormControl>
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all
                              ${isUploading ? "opacity-60" : "hover:border-primary/50"}
                              ${file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25"}
                            `}
                          >
                            <Input
                              type="file"
                              accept=".csv,.xlsx"
                              disabled={isUploading}
                              className="hidden"
                              id="file-upload"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onChange(f);
                              }}
                              {...field}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              {file ? (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-center gap-3 text-green-600">
                                    <CheckCircle2 className="h-10 w-10" />
                                  </div>
                                  <p className="font-medium">{file.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      form.setValue("file", undefined as any);
                                    }}
                                    className="mt-2"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">
                                      Drop your file here, or click to browse
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      CSV or XLSX • Max 10 MB
                                    </p>
                                  </div>
                                </div>
                              )}
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Group Name */}
                  <FormField
                    control={form.control}
                    name="groupName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AWS IoT Thing Group</FormLabel>
                        <FormControl>
                          <Select
                            disabled={isUploading || loadingGroups}
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select or type group name"} />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ))}
                              {groups.length === 0 && !loadingGroups && (
                                <div className="p-3 text-center text-sm text-muted-foreground">
                                  No groups found
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Uploading & processing...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isUploading || !file}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Upload Meters
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Result */}
              {uploadResult && (
                <Alert
                  className={`mt-6 border-l-4 ${
                    uploadResult.success
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {uploadResult.success ? "Upload Successful!" : "Upload Failed"}
                      </p>
                      <AlertDescription className="mt-1 text-sm">
                        {uploadResult.success && uploadResult.data ? (
                          <div className="space-y-1">
                            <p>{uploadResult.message}</p>
                            <ul className="mt-2 text-xs opacity-90">
                              <li>• Rows processed: {uploadResult.data.uploaded}</li>
                              <li>• Meters saved: {uploadResult.data.saved}</li>
                              <li>• Synced with AWS: {uploadResult.data.synced}</li>
                            </ul>
                          </div>
                        ) : (
                          uploadResult.message
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Help & Sample */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <Button onClick={downloadSampleCSV} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Sample CSV
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold">Required Columns</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    meterId
                  </code>{" "}
                  <span className="text-primary font-medium">(Required)</span>
                </li>
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    meterType
                  </code>{" "}
                  <span className="text-xs">(Optional)</span>
                </li>
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    assetSerialNumber
                  </code>{" "}
                  <span className="text-xs">(Optional)</span>
                </li>
                <li>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                    powerHATStatus
                  </code>{" "}
                  <span className="text-xs">(Flashed / No HAT / Unknown)</span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• First row must be headers</li>
                  <li>• Max file size: 10 MB</li>
                  <li>• Duplicates will be skipped</li>
                  <li>• Sync happens automatically with AWS IoT</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}