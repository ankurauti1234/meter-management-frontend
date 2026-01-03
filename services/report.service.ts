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

export interface GeneratedHHReport {
  id: number;
  generation_time: string; // ISO string
  report_date: string;     // YYYY-MM-DD
  report_url: string;
  session_count: number;
}

export interface ReportFilters {
  type?: string;
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
  format?: "json" | "csv" | "xlsx" | "xml";
}

// Unified response type that matches your actual backend
export interface ApiResponse<T = any> {
  success: boolean;
  msg: string;
  data: {
    reports?: T[];
    events?: ReportEvent[];
    pagination: {
      page: string | number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class ReportService {
  private baseURL = "/reports";

  // === Main Events Report ===
  async getReport(filters: ReportFilters = {}): Promise<ApiResponse<ReportEvent> | Blob> {
    const params = this.buildParams(filters);
    const url = `${this.baseURL}?${params.toString()}`;
    console.log("Requesting events report:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  // === Bridge Reports ===
  async getBridgeReports(
    filters: Omit<ReportFilters, "type"> = {}
  ): Promise<ApiResponse<GeneratedHHReport> | Blob> {
    const params = this.buildParams(filters);
    const url = `${this.baseURL}/bridge?${params.toString()}`;
    console.log("Requesting bridge reports:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  // === Unbridge Reports ===
  async getUnbridgeReports(
    filters: Omit<ReportFilters, "type"> = {}
  ): Promise<ApiResponse<GeneratedHHReport> | Blob> {
    const params = this.buildParams(filters);
    const url = `${this.baseURL}/unbridge?${params.toString()}`;
    console.log("Requesting unbridge reports:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  // === Memberwise Bridge Reports ===
  async getMemberwiseBridgeReports(
    filters: Omit<ReportFilters, "type"> = {}
  ): Promise<ApiResponse<GeneratedHHReport> | Blob> {
    const params = this.buildParams(filters);
    const url = `${this.baseURL}/memberwise-bridge?${params.toString()}`;
    console.log("Requesting memberwise bridge reports:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  // === Memberwise Unbridge Reports ===
  async getMemberwiseUnbridgeReports(
    filters: Omit<ReportFilters, "type"> = {}
  ): Promise<ApiResponse<GeneratedHHReport> | Blob> {
    const params = this.buildParams(filters);
    const url = `${this.baseURL}/memberwise-unbridge?${params.toString()}`;
    console.log("Requesting memberwise unbridge reports:", url);

    const response = await api.get(url, {
      responseType: filters.format && filters.format !== "json" ? "blob" : "json",
    });

    return response.data;
  }

  // Helper to build URLSearchParams consistently
  private buildParams(filters: any): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.type?.trim()) params.append("type", filters.type.trim());
    if (filters.start_time !== undefined) params.append("start_time", String(filters.start_time));
    if (filters.end_time !== undefined) params.append("end_time", String(filters.end_time));
    if (filters.page !== undefined) params.append("page", String(filters.page));
    if (filters.limit !== undefined) params.append("limit", String(filters.limit));
    if (filters.format) params.append("format", filters.format);

    return params;
  }

  // Utility to trigger download for non-JSON formats
  downloadBlob(
    blob: Blob,
    format: "csv" | "xlsx" | "xml",
    reportType:
      | "events"
      | "bridge"
      | "unbridge"
      | "memberwise-bridge"
      | "memberwise-unbridge" = "events"
  ) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const ext = format === "xlsx" ? "xlsx" : format;

    const typePrefixMap: Record<typeof reportType, string> = {
      events: "events-report",
      bridge: "hh-bridge-report",
      unbridge: "hh-unbridge-report",
      "memberwise-bridge": "hh-memberwise-bridge-report",
      "memberwise-unbridge": "hh-memberwise-unbridge-report",
    };

    const typePrefix = typePrefixMap[reportType];
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    a.download = `${typePrefix}-${timestamp}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default new ReportService();