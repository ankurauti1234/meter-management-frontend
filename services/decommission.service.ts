import api from "./api";

export interface AssignedMeter {
  id: string;
  meterId: string;
  meterType: string | null;
  assetSerialNumber: string | null;
  household: {
    id: string;
    hhid: string;
  } | null;
  assignedAt: string;
}

export interface DecommissionMeterPayload {
  meterId: string;
  reason?: string;
}

export interface DecommissionResponse {
  meterId: string;
  previousHouseholdHhid: string;
  decommissionedAt: string;
  logId: string;
  reason: string;
  status: "decommissioned";
}

export interface DecommissionLog {
  id: string;
  meterId: string;
  householdHhid: string;
  reason: string | null;
  decommissionedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  decommissionedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  msg: string;
}

// Flat response shape used by history endpoint (matches actual backend sendSuccess output)
export interface FlatPaginatedResponse<T> {
  success: boolean;
  msg: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MeterHistoryRecord {
  id: string;
  meterId: string;
  hhid: string;
  assignedAt: string;
  decommissionedAt: string | null;
}

class DecommissionService {
  private basePath = "/decommission";

  /**
   * Get list of currently assigned meters (for selection in UI)
   */
  async getAssignedMeters(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<AssignedMeter>> {
    const res = await api.get(`${this.basePath}/assigned`, { params });
    return res.data;
  }

  /**
   * Decommission a meter
   * Sends MQTT command + unassigns + logs action
   */
  async decommissionMeter(
    payload: DecommissionMeterPayload
  ): Promise<{ success: boolean; data: DecommissionResponse; msg: string }> {
    const res = await api.post(`${this.basePath}/decommission`, payload);
    return res.data;
  }

  /**
   * Get decommission history logs
   */
  async getDecommissionLogs(params: {
    page?: number;
    limit?: number;
    meterId?: string;
    hhid?: string;
  } = {}): Promise<PaginatedResponse<DecommissionLog>> {
    const res = await api.get(`${this.basePath}/logs`, { params });
    return res.data;
  }

  /**
   * Get full household meter assignment history
   */
  async getHouseholdMeterHistory(params: {
    page?: number;
    limit?: number;
    meterId?: string;
    hhid?: string;
    assigned_from?: string;
    assigned_to?: string;
    decommissioned_from?: string;
    decommissioned_to?: string;
  } = {}): Promise<FlatPaginatedResponse<MeterHistoryRecord>> {
    const res = await api.get(`${this.basePath}/history`, { params });
    return res.data;
  }

  /**
   * Fetch all records for CSV export (no pagination limit)
   */
  async exportHouseholdMeterHistory(params: {
    meterId?: string;
    hhid?: string;
    assigned_from?: string;
    assigned_to?: string;
    decommissioned_from?: string;
    decommissioned_to?: string;
  } = {}): Promise<MeterHistoryRecord[]> {
    const res = await api.get(`${this.basePath}/history`, {
      params: { ...params, page: 1, limit: 999999 },
    });
    return res.data.data; // res.data = API body { data: [], pagination: {} }
  }
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new DecommissionService();