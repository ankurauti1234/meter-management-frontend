/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Users,
  Zap,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import AssetsService from "@/services/assets.service";
import HouseholdService, {
  UploadMembersResult,
} from "@/services/household.service";

// Schemas
const meterUploadSchema = z.object({
  file: z
    .instanceof(File)
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

const memberUploadSchema = z.object({
  file: z
    .instanceof(File)
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
  householdId: z.string().uuid("Invalid Household ID"),
});

type MeterFormData = z.infer<typeof meterUploadSchema>;
type MemberFormData = z.infer<typeof memberUploadSchema>;

export default function UploadAssetsPage() {
  const [activeTab, setActiveTab] = useState("meters");

  // Meters state
  const [meterGroups, setMeterGroups] = useState<string[]>([]);
  const [loadingMeterGroups, setLoadingMeterGroups] = useState(true);

  // Members state
  const [householdSearch, setHouseholdSearch] = useState("");
  const [householdSuggestions, setHouseholdSuggestions] = useState<
    { id: string; hhid: string }[]
  >([]);
  const [searchingHouseholds, setSearchingHouseholds] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const meterForm = useForm<MeterFormData>({
    resolver: zodResolver(meterUploadSchema),
    defaultValues: { groupName: "" },
  });

  const memberForm = useForm<MemberFormData>({
    resolver: zodResolver(memberUploadSchema),
  });

  // Fetch AWS Thing Groups
  const fetchMeterGroups = useCallback(async () => {
    setLoadingMeterGroups(true);
    try {
      const res = await AssetsService.getThingGroups({ limit: 50 });
      const groupNames = res.groups.map((g: any) => g.groupName).sort();
      setMeterGroups(groupNames);
    } catch (err) {
      toast.error("Failed to load AWS groups");
    } finally {
      setLoadingMeterGroups(false);
    }
  }, []);

  // Search households for member upload
  const searchHouseholds = useCallback(async (query: string) => {
    if (!query.trim()) {
      setHouseholdSuggestions([]);
      return;
    }
    setSearchingHouseholds(true);
    try {
      const res = await HouseholdService.getHouseholds({
        search: query,
        limit: 10,
      });
      setHouseholdSuggestions(res.households.map((h) => ({ id: h.id, hhid: h.hhid })));
    } catch {
      toast.error("Failed to search households");
    } finally {
      setSearchingHouseholds(false);
    }
  }, []);

  useEffect(() => {
    fetchMeterGroups();
  }, [fetchMeterGroups]);

  // Debounced household search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchHouseholds(householdSearch);
    }, 400);
    return () => clearTimeout(timer);
  }, [householdSearch, searchHouseholds]);

  const onMeterSubmit = async (data: MeterFormData) => {
    setIsUploading(true);
    setUploadResult(null);
    setProgress(10);

    try {
      const interval = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 400);

      const result = await AssetsService.uploadMeters(data.file, data.groupName);

      clearInterval(interval);
      setProgress(100);

      setUploadResult({
        type: "meters",
        success: true,
        message: "Meters uploaded successfully!",
        data: result,
      });

      toast.success(`Saved ${result.saved} meters • Synced ${result.synced}`);
      meterForm.reset();
    } catch (error: any) {
      setUploadResult({
        type: "meters",
        success: false,
        message: error.response?.data?.msg || error.message || "Upload failed",
      });
      toast.error("Meter upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const onMemberSubmit = async (data: MemberFormData) => {
    setIsUploading(true);
    setUploadResult(null);
    setProgress(10);

    try {
      const interval = setInterval(() => setProgress((p) => Math.min(p + 15, 90)), 400);

      const result: UploadMembersResult = await HouseholdService.uploadMembers(
        data.file,
        data.householdId
      );

      clearInterval(interval);
      setProgress(100);

      setUploadResult({
        type: "members",
        success: true,
        message: "Members uploaded successfully!",
        data: result,
      });

      toast.success(`Saved ${result.saved} members (${result.skipped} skipped)`);
      memberForm.reset();
    } catch (error: any) {
      setUploadResult({
        type: "members",
        success: false,
        message: error.message || "Member upload failed",
      });
      toast.error("Member upload failed");
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  const downloadMeterSample = () => {
    const csv = `data:text/csv;charset=utf-8,
meterId,meterType,assetSerialNumber,powerHATStatus
MTR-001,SinglePhase,ASN001,Flashed
MTR-002,ThreePhase,ASN002,No HAT`;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `sample_meters_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Meter sample downloaded");
  };

  const downloadMemberSample = () => {
    const csv = `data:text/csv;charset=utf-8,
memberCode,dob,gender
M1,1990-05-15,MALE
M2,1995-08-22,FEMALE
M3,2010-12-01,OTHER`;
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `sample_members_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Member sample downloaded");
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <PageHeader
        title="Bulk Upload"
        description="Upload meters or household members in bulk"
        badge={<FileSpreadsheet className="h-6 w-6" />}
        size="lg"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="meters" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Meters
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Household Members
          </TabsTrigger>
        </TabsList>

        {/* METERS TAB */}
        <TabsContent value="meters" className="mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <Form {...meterForm}>
                    <form onSubmit={meterForm.handleSubmit(onMeterSubmit)} className="space-y-6">
                      <FormField
                        control={meterForm.control}
                        name="file"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel>CSV or XLSX File</FormLabel>
                            <FormControl>
                              <FileDropzone
                                file={meterForm.watch("file")}
                                onChange={onChange}
                                disabled={isUploading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={meterForm.control}
                        name="groupName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AWS IoT Thing Group</FormLabel>
                            <Select
                              disabled={isUploading || loadingMeterGroups}
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingMeterGroups ? "Loading..." : "Select group"} />
                              </SelectTrigger>
                              <SelectContent>
                                {meterGroups.map((g) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isUploading && <UploadProgress progress={progress} />}
                      <Button type="submit" size="lg" className="w-full" disabled={isUploading || !meterForm.watch("file")}>
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Meters...
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
                  <UploadResult result={uploadResult} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Button onClick={downloadMeterSample} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Meter Sample
                  </Button>
                </CardContent>
              </Card>
              <HelpCard title="Meter Columns" items={[
                { name: "meterId", required: true },
                { name: "meterType", required: false },
                { name: "assetSerialNumber", required: false },
                { name: "powerHATStatus", required: false },
              ]} />
            </div>
          </div>
        </TabsContent>

        {/* MEMBERS TAB */}
        <TabsContent value="members" className="mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <Form {...memberForm}>
                    <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-6">
                      <FormField
                        control={memberForm.control}
                        name="file"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel>CSV or XLSX File</FormLabel>
                            <FormControl>
                              <FileDropzone
                                file={memberForm.watch("file")}
                                onChange={onChange}
                                disabled={isUploading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={memberForm.control}
                        name="householdId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Household (HHID)</FormLabel>
                            <div className="relative">
                              <Input
                                placeholder="Search by HHID..."
                                value={householdSearch}
                                onChange={(e) => {
                                  setHouseholdSearch(e.target.value);
                                  if (e.target.value) field.onChange("");
                                }}
                                disabled={isUploading}
                              />
                              {searchingHouseholds && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                              )}
                              {householdSuggestions.length > 0 && householdSearch && (
                                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                  {householdSuggestions.map((h) => (
                                    <button
                                      key={h.id}
                                      type="button"
                                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                                      onClick={() => {
                                        field.onChange(h.id);
                                        setHouseholdSearch(h.hhid);
                                        setHouseholdSuggestions([]);
                                      }}
                                    >
                                      <Badge variant="secondary" className="mr-2">{h.hhid}</Badge>
                                      {h.hhid}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {field.value && <p className="text-xs text-muted-foreground mt-1">Selected: {householdSearch}</p>}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isUploading && <UploadProgress progress={progress} />}
                      <Button type="submit" size="lg" className="w-full" disabled={isUploading || !memberForm.watch("file")}>
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Members...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-5 w-5" />
                            Upload Members
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                  <UploadResult result={uploadResult} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Button onClick={downloadMemberSample} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Member Sample
                  </Button>
                </CardContent>
              </Card>
              <HelpCard title="Member Columns" items={[
                { name: "memberCode", required: true, desc: "e.g., M1, M2" },
                { name: "dob", required: true, desc: "YYYY-MM-DD" },
                { name: "gender", required: false, desc: "MALE / FEMALE / OTHER" },
              ]} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable Components
function FileDropzone({ file, onChange, disabled }: { file?: File; onChange: (f: File) => void; disabled: boolean }) {
  return (
    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${disabled ? "opacity-60" : "hover:border-primary/50"} ${file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25"}`}>
      <Input
        type="file"
        accept=".csv,.xlsx"
        disabled={disabled}
        className="hidden"
        id="file-upload"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        {file ? (
          <div className="space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onChange(undefined as any); }}>
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Drop file or click to browse</p>
              <p className="text-xs text-muted-foreground">CSV or XLSX • Max 10 MB</p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Uploading...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-3" />
    </div>
  );
}

function UploadResult({ result }: { result: any }) {
  if (!result) return null;
  return (
    <Alert className={`mt-6 border-l-4 ${result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
      <div className="flex items-start gap-3">
        {result.success ? <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
        <div>
          <p className="font-semibold">{result.success ? "Success!" : "Failed"}</p>
          <AlertDescription className="mt-1 text-xs">
            {result.success && result.data ? (
              result.type === "meters" ? (
                <div>
                  <p>{result.message}</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Processed: {result.data.uploaded}</li>
                    <li>• Saved: {result.data.saved}</li>
                    <li>• Synced: {result.data.synced}</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <p>{result.message}</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Processed: {result.data.uploaded}</li>
                    <li>• Saved: {result.data.saved}</li>
                    <li>• Skipped: {result.data.skipped}</li>
                    {result.data.errors.length > 0 && <li>• Errors: {result.data.errors.length}</li>}
                  </ul>
                </div>
              )
            ) : result.message}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

function HelpCard({ title, items }: { title: string; items: { name: string; required?: boolean; desc?: string }[] }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold">{title}</h3>
        <ul className="text-xs space-y-2 text-muted-foreground">
          {items.map((item) => (
            <li key={item.name}>
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{item.name}</code>{" "}
              {item.required && <span className="text-primary font-medium">(Required)</span>}
              {item.desc && <span className="text-xs ml-1">– {item.desc}</span>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}