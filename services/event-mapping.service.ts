/* eslint-disable @typescript-eslint/no-unused-vars */
// src/services/event-mapping.service.ts

import api from "./api"; // your axios instance
import { z } from "zod";

// Optional: Zod schema for runtime validation (recommended)
const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const ApiResponseSchema = z.object({
  success: z.boolean(),
  msg: z.string().optional(),
  data: z.array(
    z.object({
      id: z.number(),
      type: z.number(),
      name: z.string(),
      description: z.string().nullable().optional(),
      is_alert: z.boolean(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      enabled: z.boolean(),
    })
  ),
  pagination: PaginationSchema.optional(),
});

export interface EventMapping {
  id: number;
  type: number;
  name: string;
  description?: string | null;
  is_alert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface EventMappingFilters {
  search?: string;
  is_alert?: boolean | "";
  severity?: string;
  enabled?: boolean | "";
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class EventMappingService {
  private baseURL = "/events/mapping";

  async getAll(filters: EventMappingFilters = {}): Promise<{
    data: EventMapping[];
    pagination?: Pagination;
  }> {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.is_alert !== undefined && filters.is_alert !== "")
      params.append("is_alert", String(filters.is_alert));
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.enabled !== undefined && filters.enabled !== "")
      params.append("enabled", String(filters.enabled));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`${this.baseURL}?${params.toString()}`);
    
    // Optional: validate with Zod
    // const parsed = ApiResponseSchema.parse(res.data);
    // return { data: parsed.data, pagination: parsed.pagination };

    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  }

  async getById(id: number): Promise<EventMapping> {
    const res = await api.get(`${this.baseURL}/${id}`);
    return res.data.data;
  }

  async create(dto: Omit<EventMapping, "id">): Promise<EventMapping> {
    const res = await api.post(this.baseURL, dto);
    return res.data.data;
  }

  async update(id: number, dto: Partial<Omit<EventMapping, "id">>): Promise<EventMapping> {
    const res = await api.patch(`${this.baseURL}/${id}`, dto);
    return res.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }
}

export default new EventMappingService();