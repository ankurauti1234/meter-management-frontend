import api from "./api";

export interface UnassignLog {
  id: string;
  deviceId: string;
  hhid: string;
  unassignedBy: { name: string; email: string } | null;
  unassignedAt: string;
}

export interface UnassignLogsPaginated {
  data: UnassignLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

class UnassignService {
  async getLogs(params: { page?: number; limit?: number; meterId?: string; hhid?: string } = {}) {
    const res = await api.get<{ data: UnassignLogsPaginated }>("/unassign/logs", { params });
    return res.data.data;
  }
}

export default new UnassignService();