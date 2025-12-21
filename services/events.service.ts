/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./api";

export interface EventFilters {
  device_id?: string;
  type?: string | number;
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
}

export interface MeterChannelFilters {
  device_id?: string; // optional
  status?: "recognized" | "unrecognized";
  start_time?: number;
  end_time?: number;
  page?: number;
  limit?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface Event {
  processed_s3_key: any;
  id: string;
  device_id: string;
  type: number;
  timestamp: number;
  data: any;
  createdAt: string;
}

export interface MeterChannel {
  id: string;
  device_id: string;
  timestamp: number;
  status: "recognized" | "unrecognized";
  processed_s3_key: string;
  label?: string;
  confidence?: number;
}

export interface PaginatedEvents {
  data: never[];
  events: Event[];
  pagination: Pagination;
}

export interface PaginatedMeterChannels {
  channels: MeterChannel[];
  pagination: Pagination;
}

class EventsService {
  // 1. Get All Events
  async getEvents(filters: any): Promise<{
    data: {
      events: Event[];
      pagination: { total: number; page: number; limit: number; pages: number };
    };
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.type !== undefined) params.append("type", String(filters.type));
    if (filters.start_time)
      params.append("start_time", String(filters.start_time));
    if (filters.end_time) params.append("end_time", String(filters.end_time));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events?${params.toString()}`);
    return res.data;
  }

  // 2. Get Events by Type
  async getEventsByType(
    type: number,
    filters: Omit<EventFilters, "type"> = {}
  ): Promise<PaginatedEvents> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.start_time)
      params.append("start_time", String(filters.start_time));
    if (filters.end_time) params.append("end_time", String(filters.end_time));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/type/${type}?${params.toString()}`);
    return res.data.data;
  }

  // 3. Get Alerts
  async getAlerts(filters: EventFilters = {}): Promise<PaginatedEvents> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.start_time)
      params.append("start_time", String(filters.start_time));
    if (filters.end_time) params.append("end_time", String(filters.end_time));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/alerts?${params.toString()}`);
    return res.data.data;
  }

  // 4. Get Alerts by Device
  async getAlertsByDevice(
    device_id: string,
    filters: Omit<EventFilters, "device_id"> = {}
  ): Promise<PaginatedEvents> {
    const params = new URLSearchParams();
    if (filters.start_time)
      params.append("start_time", String(filters.start_time));
    if (filters.end_time) params.append("end_time", String(filters.end_time));
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(
      `/events/alerts/device/${device_id}?${params.toString()}`
    );
    return res.data.data;
  }

  // 5. Get Meter Channels – device_id is optional
  async getMeterChannels(
    filters: MeterChannelFilters
  ): Promise<PaginatedMeterChannels> {
    const params = new URLSearchParams();

    // Only append device_id if provided
    if (filters.device_id) {
      params.append("device_id", filters.device_id);
    }
    if (filters.status) {
      params.append("status", filters.status);
    }
    if (filters.start_time) {
      params.append("start_time", String(filters.start_time));
    }
    if (filters.end_time) {
      params.append("end_time", String(filters.end_time));
    }
    if (filters.page) {
      params.append("page", String(filters.page));
    }
    if (filters.limit) {
      params.append("limit", String(filters.limit));
    }

    const res = await api.get(`/events/meter-channels?${params.toString()}`);
    return res.data.data;
  }
}

export default new EventsService();
