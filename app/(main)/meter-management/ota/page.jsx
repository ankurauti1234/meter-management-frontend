"use client";

import { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Upload, Plus, ArrowCounterClockwise } from "@phosphor-icons/react";
import { uploadFullOtaUpdate, uploadDeltaSwu, uploadDeltaZck, fetchOtaHistory } from "@/utils/ota-apis";

const formatDate = (date) => new Date(date).toLocaleString();

export default function OtaUploader() {
  const [updateType, setUpdateType] = useState("full");
  const [fullFile, setFullFile] = useState(null);
  const [deltaSwuFile, setDeltaSwuFile] = useState(null);
  const [deltaZckFile, setDeltaZckFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [fullProgress, setFullProgress] = useState(0);
  const [swuProgress, setSwuProgress] = useState(0);
  const [zckProgress, setZckProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customVersion, setCustomVersion] = useState("");
  const [suggestedVersion, setSuggestedVersion] = useState("0.0.1");

  // Refs for triggering file inputs
  const fullFileInputRef = useRef(null);
  const deltaSwuFileInputRef = useRef(null);
  const deltaZckFileInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    fetchHistory();
  }, []);

  const handleFullFileChange = (e) => setFullFile(e.target.files[0]);
  const handleDeltaSwuChange = (e) => setDeltaSwuFile(e.target.files[0]);
  const handleDeltaZckChange = (e) => setDeltaZckFile(e.target.files[0]);

  const handleUpload = async () => {
    setMessage("");
    setIsUploading(true);
    setFullProgress(0);
    setSwuProgress(0);
    setZckProgress(0);

    if (updateType === "full") {
      if (!fullFile) {
        setMessage("Please select an .swu file for full update");
        setIsUploading(false);
        return;
      }
      try {
        const result = await uploadFullOtaUpdate(fullFile, customVersion || undefined, (progress) => {
          setFullProgress(progress);
        });
        setMessage(`Full update uploaded successfully! Version: ${result.version}`);
        setFullFile(null);
        setCustomVersion("");
        fetchHistory();
      } catch (error) {
        setMessage(`Full update failed: ${error.message || error.error}`);
      } finally {
        setIsUploading(false);
        setFullProgress(0);
      }
    } else {
      if (!deltaSwuFile || !deltaZckFile) {
        setMessage("Please select both .swu and .zck files for delta update");
        setIsUploading(false);
        return;
      }
      try {
        const swuResult = await uploadDeltaSwu(deltaSwuFile, (progress) => {
          setSwuProgress(progress);
        });
        setMessage("SWU uploaded to S3. Uploading ZCK...");

        const zckResult = await uploadDeltaZck(deltaZckFile, swuResult.url, customVersion || undefined, (progress) => {
          setZckProgress(progress);
        });
        setMessage(`Delta update uploaded successfully! Version: ${zckResult.version}`);
        setDeltaSwuFile(null);
        setDeltaZckFile(null);
        setCustomVersion("");
        fetchHistory();
      } catch (error) {
        setMessage(`Delta update failed: ${error.message || error.error}`);
      } finally {
        setIsUploading(false);
        setSwuProgress(0);
        setZckProgress(0);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      const result = await fetchOtaHistory();
      setHistory(result.data);
      if (result.data.length > 0) {
        const lastVersion = result.data[0].version;
        const [major, minor, patch] = lastVersion.split('.').map(Number);
        setSuggestedVersion(`${major}.${minor}.${patch + 1}`);
      }
    } catch (error) {
      setMessage(`Failed to fetch history: ${error.message || error.error}`);
    }
  };

  const resetFiles = () => {
    setFullFile(null);
    setDeltaSwuFile(null);
    setDeltaZckFile(null);
    setCustomVersion("");
    setMessage("");
    setFullProgress(0);
    setSwuProgress(0);
    setZckProgress(0);
    setUpdateType("full");
  };

  if (!isMounted) {
    return (
      <div className="mx-auto container">
        <Card className="w-full rounded-lg h-full">
          <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Upload className="text-primary" size={20} weight="duotone" />
              OTA Updates
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
              <Upload className="text-primary" size={20} weight="duotone" />
              OTA Updates
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {history.length} updates shown
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary hover:bg-primary/90 flex items-center gap-2">
                  <Plus size={16} weight="duotone" />
                  Upload OTA Update
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] rounded-xl shadow-xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-xl font-semibold text-primary">
                    Upload OTA Update
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Update Type</label>
                    <Select value={updateType} onValueChange={setUpdateType}>
                      <SelectTrigger className="h-10 bg-background/50">
                        <SelectValue placeholder="Select Update Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Update</SelectItem>
                        <SelectItem value="delta">Delta Update</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Version (format: x.x.x)
                    </label>
                    <Input
                      value={customVersion}
                      onChange={(e) => setCustomVersion(e.target.value)}
                      placeholder={`Suggested: ${suggestedVersion}`}
                      className="h-10 bg-background/50"
                      disabled={isUploading}
                    />
                  </div>

                  {updateType === "full" ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Update File (.swu)
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="h-10 bg-background/50 border-primary/20 hover:bg-primary/10"
                            onClick={() => fullFileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload size={16} className="mr-2" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {fullFile ? fullFile.name : "No file selected"}
                          </span>
                          <input
                            type="file"
                            accept=".swu"
                            ref={fullFileInputRef}
                            onChange={handleFullFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {isUploading && updateType === "full" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            S3 Upload Progress
                          </label>
                          <Progress value={fullProgress} className="w-full" />
                          <p className="text-sm text-muted-foreground">{fullProgress}%</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          S3 Update File (.swu)
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="h-10 bg-background/50 border-primary/20 hover:bg-primary/10"
                            onClick={() => deltaSwuFileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload size={16} className="mr-2" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {deltaSwuFile ? deltaSwuFile.name : "No file selected"}
                          </span>
                          <input
                            type="file"
                            accept=".swu"
                            ref={deltaSwuFileInputRef}
                            onChange={handleDeltaSwuChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {isUploading && updateType === "delta" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            S3 Upload Progress
                          </label>
                          <Progress value={swuProgress} className="w-full" />
                          <p className="text-sm text-muted-foreground">{swuProgress}%</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          OTA Server File (.zck)
                        </label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="h-10 bg-background/50 border-primary/20 hover:bg-primary/10"
                            onClick={() => deltaZckFileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            <Upload size={16} className="mr-2" />
                            Choose File
                          </Button>
                          <span className="text-sm text-muted-foreground truncate max-w-xs">
                            {deltaZckFile ? deltaZckFile.name : "No file selected"}
                          </span>
                          <input
                            type="file"
                            accept=".zck"
                            ref={deltaZckFileInputRef}
                            onChange={handleDeltaZckChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {isUploading && updateType === "delta" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            OTA Server Upload Progress
                          </label>
                          <Progress value={zckProgress} className="w-full" />
                          <p className="text-sm text-muted-foreground">{zckProgress}%</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <DialogFooter className="mt-6 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetFiles();
                    }}
                    className="rounded-lg border-muted/30 hover:bg-muted/10"
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    className="rounded-lg bg-primary hover:bg-primary/90 transition-all"
                    disabled={
                      isUploading ||
                      (updateType === "full" ? !fullFile : !(deltaSwuFile && deltaZckFile))
                    }
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          {message && (
            <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/10">
              {message}
            </div>
          )}
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Delta URL</TableHead>
                  <TableHead className="text-right">Upload Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No updates available
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/10">
                      <TableCell className="font-medium">
                        <Badge variant="secondary">
                          {item.type === "full" ? "Full" : "Delta"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.version}</TableCell>
                      <TableCell>{item.filename}</TableCell>
                      <TableCell>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {item.url.split("/").pop()}
                        </a>
                      </TableCell>
                      <TableCell>
                        {item.deltaUrl ? (
                          <a
                            href={item.deltaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {item.deltaUrl.split("/").pop()}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatDate(item.uploadDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {history.length} updates
            </div>
            <Button
              onClick={fetchHistory}
              variant="outline"
              size="sm"
              className="h-8 border-muted hover:bg-muted"
              disabled={isUploading}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}