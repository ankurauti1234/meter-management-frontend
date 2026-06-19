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

export interface DayConnectivity {
  date: string;
  day: string;
  connected: boolean;
}

export interface WeeklyConnectivityItem {
  device_id: string;
  hhid: string;
  days: DayConnectivity[];
  connected_days: number;
  total_days: number;
  connectivity_rate: number;
}

export interface WeeklyConnectivityResponse {
  data: WeeklyConnectivityItem[];
  week_start: string;
  week_end: string;
  stats: {
    total_meters: number;
    fully_connected: number;
    partially_connected: number;
    not_connected: number;
    avg_connectivity_rate: number;
  };
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

  // 6. Get Live Monitoring
  async getLiveMonitoring(filters: {
    device_id?: string;
    hhid?: string;
    date?: string;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      last_event_timestamp: number | null;
    }>;
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.date) params.append("date", filters.date);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/live-monitoring?${params.toString()}`);
    return res.data.data;
  }

  // 7. Get Viewership
  async getViewership(filters: {
    device_id?: string;
    hhid?: string;
    date?: string;
    status?: "Yes" | "No";
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      viewership: "Yes" | "No";
      date: string;
    }>;
    stats: {
      active: number;
      total: number;
    };
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.date) params.append("date", filters.date);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/viewership?${params.toString()}`);
    return res.data.data;
  }

  // 8. Get Connectivity Report
  async getConnectivityReport(filters: {
    device_id?: string;
    hhid?: string;
    date?: string;
    status?: "Yes" | "No";
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      connectivity: "Yes" | "No";
      date: string;
    }>;
    stats: {
      active: number;
      total: number;
    };
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.date) params.append("date", filters.date);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/connectivity-report?${params.toString()}`);
    return res.data.data;
  }

  // 9. Get Button Pressed Report
  async getButtonPressedReport(filters: {
    device_id?: string;
    hhid?: string;
    date?: string;
    status?: "Yes" | "No";
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      button_pressed: "Yes" | "No";
      date: string;
    }>;
    stats: {
      active: number;
      total: number;
    };
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.date) params.append("date", filters.date);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/button-pressed-report?${params.toString()}`);
    return res.data.data;
  }

  // 10. Get Household Visualization
  async getHouseholdVisualization(filters: {
    device_id?: string;
    hhid?: string;
    status?: "all" | "active" | "inactive";
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      household_id: string;
      total_members: number;
      active_users: number;
      last_type3_timestamp: number | null;
      last_type3_details: any;
    }>;
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/household-visualization?${params.toString()}`);
    return res.data.data;
  }

  // 11. Get Weekly Connectivity Report
  async getWeeklyConnectivityReport(filters: {
    device_id?: string;
    hhid?: string;
    week_start?: string;
    status?: "connected" | "disconnected" | "partial";
    page?: number;
    limit?: number;
  }): Promise<WeeklyConnectivityResponse> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid) params.append("hhid", filters.hhid);
    if (filters.week_start) params.append("week_start", filters.week_start);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/events/weekly-connectivity?${params.toString()}`);
    return res.data.data;
  }
  async getDailyReport(filters: {
    device_id?: string;
    hhid?: string;
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      device_id: string;
      hhid: string;
      date: string;
      region: string;
      connectivity: "Yes" | "No";
      viewership: "Yes" | "No";
      member_dec: "Yes" | "No";
      image_rec: "Yes" | "No" | "No Data";
      audio_fingerprint: "Yes" | "No" | "No Data";
    }>;
    stats: { total: number; connectivity: number; viewership: number; member_dec: number; image_rec: number };
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.hhid)      params.append("hhid",      filters.hhid);
    if (filters.date)      params.append("date",      filters.date);
    if (filters.dateFrom)  params.append("dateFrom",  filters.dateFrom);
    if (filters.dateTo)    params.append("dateTo",    filters.dateTo);
    if (filters.region)    params.append("region",    filters.region);
    if (filters.page)      params.append("page",      String(filters.page));
    if (filters.limit)     params.append("limit",     String(filters.limit));
    const res = await api.get(`/events/daily-report?${params.toString()}`);
    return res.data.data;
  }

}

export default new EventsService();