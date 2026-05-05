/* eslint-disable import/no-anonymous-default-export */
import api from "./api";

export interface ViewershipCSVReport {
  id: number;
  date_label: string; // "DD-MM-YYYY"
  s3_url: string;
  createdAt: string;
}

export interface ViewershipCSVPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class ViewershipCSVService {
  async getReports(filters: {
    date_label?: string;
    month?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ViewershipCSVReport[]; pagination: ViewershipCSVPagination }> {
    const params = new URLSearchParams();
    if (filters.date_label) params.append("date_label", filters.date_label);
    if (filters.month) params.append("month", filters.month);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/reports/viewership-csv?${params.toString()}`);
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  }
}

export default new ViewershipCSVService();