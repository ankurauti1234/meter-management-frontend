/* eslint-disable import/no-anonymous-default-export */
// services/household.service.ts
import api from "./api";

export interface HouseholdFilters {
  search?: string;
  assigned?: "true" | "false";
  groupName?: string;
  contactEmail?: string;
  page?: number;
  limit?: number;
}

export interface EnrichedHousehold {
  id: string;
  hhid: string;
  createdAt: string;
  isAssigned: boolean;
  assignedMeterId?: string | null;
  preassignedContact?: {
    email: string;
    isActive: boolean;
  } | null;
  memberCount: number;
}

export interface PaginatedHouseholds {
  households: EnrichedHousehold[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UploadMembersResult {
  uploaded: number;
  saved: number;
  skipped: number;
  errors: string[];
}

class HouseholdService {
  // Existing
  async getHouseholds(filters: HouseholdFilters = {}): Promise<PaginatedHouseholds> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.assigned) params.append("assigned", filters.assigned);
    if (filters.groupName) params.append("groupName", filters.groupName);
    if (filters.contactEmail) params.append("contactEmail", filters.contactEmail);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await api.get(`/households?${params.toString()}`);
    return res.data.data;
  }

  async updatePreassignedContact(householdId: string, contactEmail: string) {
    const res = await api.patch(`/households/${householdId}/contact`, { contactEmail });
    return res.data.data;
  }

  // New: Upload members via CSV/XLSX
  async uploadMembers(file: File, householdId: string): Promise<UploadMembersResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("householdId", householdId);

    const res = await api.post("/households/members/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.data;
  }

  // New: Delete a household member
  async deleteMember(memberId: string): Promise<void> {
    await api.delete(`/households/members/${memberId}`);
  }
}

export default new HouseholdService();