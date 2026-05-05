/* eslint-disable import/no-anonymous-default-export */
import api from "./api";

export interface InactivityAlert {
  id: number;
  device_id: string;
  hhid: string | null;
  lastEventAt: string | null;
  detectedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AlertRecipient {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AlertSettingsData {
  id: number;
  inactivityThresholdHours: number;
  emailFrequencyHours: number;
  lastEmailSentAt: string | null;
  lastCheckAt: string | null;
  updatedAt: string;
}

class AlertsService {
  // ─── Inactivity Alerts ──────────────────────────────────

  async getInactiveMeters(filters: {
    page?: number;
    limit?: number;
    device_id?: string;
    inactivity_filter?: "lt_3d" | "lt_1w" | "lt_2w" | "lt_1m" | "gt_1m";
  }): Promise<{
    data: InactivityAlert[];
    pagination: AlertPagination;
  }> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));
    if (filters.device_id) params.append("device_id", filters.device_id);
    if (filters.inactivity_filter) params.append("inactivity_filter", filters.inactivity_filter);

    const res = await api.get(`/alerts/inactivity?${params.toString()}`);
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
  }

  async getInactiveCount(): Promise<number> {
    const res = await api.get("/alerts/inactivity/count");
    return res.data.data.count;
  }

  async exportInactiveMeters(): Promise<void> {
    const res = await api.get("/alerts/inactivity/export", {
      responseType: "blob",
    });

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Inactive_Meters_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async triggerCheck(): Promise<{
    newInactive: number;
    resolved: number;
    totalInactive: number;
  }> {
    const res = await api.post("/alerts/inactivity/check");
    return res.data.data;
  }

  async sendEmail(): Promise<{ sent: boolean; recipientCount: number }> {
    const res = await api.post("/alerts/inactivity/send-email");
    return res.data.data;
  }

  // ─── Email Recipients ──────────────────────────────────

  async getRecipients(): Promise<AlertRecipient[]> {
    const res = await api.get("/alerts/recipients");
    return res.data.data;
  }

  async addRecipient(
    email: string,
    name?: string
  ): Promise<AlertRecipient> {
    const res = await api.post("/alerts/recipients", { email, name });
    return res.data.data;
  }

  async removeRecipient(id: number): Promise<void> {
    await api.delete(`/alerts/recipients/${id}`);
  }

  // ─── Settings ──────────────────────────────────────────

  async getSettings(): Promise<AlertSettingsData> {
    const res = await api.get("/alerts/settings");
    return res.data.data;
  }

  async updateSettings(updates: {
    inactivityThresholdHours?: number;
    emailFrequencyHours?: number;
  }): Promise<AlertSettingsData> {
    const res = await api.put("/alerts/settings", updates);
    return res.data.data;
  }
}

export default new AlertsService();