/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-empty-object-type */
// src/services/event-mapping.service.ts
import api from "./api"; // your axios instance

export interface EventMapping {
  id: number;
  type: number;
  name: string;
  description?: string;
  is_alert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface CreateEventMappingDTO {
  type: number;
  name: string;
  description?: string;
  is_alert: boolean;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

export interface UpdateEventMappingDTO extends Partial<CreateEventMappingDTO> {}

export interface EventMappingFilters {
  search?: string;
  is_alert?: boolean | "";
  severity?: string;
  enabled?: boolean | "";
  page?: number;
  limit?: number;
}

class EventMappingService {
  private baseURL = "/events/mapping";

  async getAll(filters: EventMappingFilters = {}): Promise<{
    data: EventMapping[];
    pagination: { total: number; pages: number; page: number; limit: number };
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
    return res.data;
  }

  async getById(id: number): Promise<EventMapping> {
    const res = await api.get(`${this.baseURL}/${id}`);
    return res.data.data;
  }

  async create(dto: CreateEventMappingDTO): Promise<EventMapping> {
    const res = await api.post(this.baseURL, dto);
    return res.data.data;
  }

  async update(id: number, dto: UpdateEventMappingDTO): Promise<EventMapping> {
    const res = await api.patch(`${this.baseURL}/${id}`, dto);
    return res.data.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }
}

export default new EventMappingService();
