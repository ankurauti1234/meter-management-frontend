"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { uploadCSV } from "@/utils/upload-assets-apis";

export default function UploadAssets() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setUploadStatus(null);
      setMessage("");
    } else {
      setFile(null);
      setUploadStatus("error");
      setMessage("Please select a valid CSV file.");
    }
  };

  const handleTypeChange = (value) => {
    setType(value);
    setUploadStatus(null);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file || !type) {
      setUploadStatus("error");
      setMessage("Please select a file and asset type.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadCSV(file, type);
      setUploadStatus("success");
      setMessage(`${response.message} - ${response.count} records uploaded.`);
      setFile(null); // Reset file input
      setType(""); // Reset type select
    } catch (error) {
      setUploadStatus("error");
      setMessage(error.message || "Failed to upload CSV.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto container py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Upload className="text-primary" size={20} weight="duotone" />
            Upload Assets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Asset Type
            </label>
            <Select value={type} onValueChange={handleTypeChange} disabled={isUploading}>
              <SelectTrigger className="h-10 bg-background/50">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Meters</SelectItem>
                <SelectItem value="2">Submeters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              CSV File
            </label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
              className="h-10 bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Upload a CSV file with{" "}
              {type === "1" ? "meterid" : "submeterid, wifi_mac, serial_number"} headers.
            </p>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !type || isUploading}
            className="w-full h-10 bg-primary hover:bg-primary/90"
          >
            {isUploading ? (
              <span className="animate-pulse">Uploading...</span>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload
              </>
            )}
          </Button>

          {uploadStatus && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md ${
                uploadStatus === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {uploadStatus === "success" ? (
                <CheckCircle size={20} weight="duotone" />
              ) : (
                <WarningCircle size={20} weight="duotone" />
              )}
              <span>{message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}