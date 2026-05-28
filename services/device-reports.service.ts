import api from "./api";

export interface DeviceReportRecord {
  id: number;
  date_label: string;   // "DD-MM-YYYY" — the start of the reporting window
  s3_url: string;
  createdAt: string;    // ISO — when the Lambda ran and inserted this record
}

export interface DeviceReportResponse {
  data: DeviceReportRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class DeviceReportsService {
  async getHealthReports(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<DeviceReportResponse> {
    const res = await api.get("/device-reports/health", { params });
    return res.data.data;
  }

  async getSilentReports(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<DeviceReportResponse> {
    const res = await api.get("/device-reports/silent", { params });
    return res.data.data;
  }
}

export default new DeviceReportsService();