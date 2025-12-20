/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */
// src/services/report.service.ts
import api from "./api";

export interface ReportEvent {
  id: number;
  device_id: string;
  timestamp: number;
  type: number;
  details: Record<string, any>;
}

export interface ReportFilters {
  type?: string;
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
  format?: "json" | "csv" | "xlsx" | "xml";
}

class ReportService {
  private baseURL = "/reports"; // Make sure this matches your backend route

  async getReport(filters: ReportFilters): Promise<any> {
    const params = new URLSearchParams();

    if (filters.type?.trim()) params.append("type", filters.type.trim());
    if (filters.start_time) params.append("start_time", String(filters.start_time));
    if (filters.end_time) params.append("end_time", String(filters.end_time));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.format) params.append("format", filters.format);

    const url = `${this.baseURL}?${params.toString()}`;
    console.log("Requesting:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  downloadBlob(blob: Blob, format: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format === "xlsx" ? "xlsx" : format;
    a.download = `events-report-${new Date().toISOString().slice(0, 16).replace("T", "-")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new ReportService();