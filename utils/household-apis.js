// @/utils/household-apis.js
import api from "./api";

export const fetchAllHouseholds = async (filters = {}) => {
  try {
    // Construct query parameters from filters
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.hhid && { hhid: filters.hhid }),
      ...(filters.is_assigned !== undefined && { is_assigned: filters.is_assigned.toString() }), // Convert boolean to string
      ...(filters.meter_id && { meter_id: filters.meter_id }),
    };

    // Make API request
    const response = await api.get("/households/simplified", { params });

    // Return the full response data (including pagination metadata and households)
    return {
      households: response.data.households || [],
      count: response.data.count || 0,
      totalCount: response.data.totalCount || 0,
      totalPages: response.data.totalPages || 0,
      currentPage: response.data.currentPage || 1,
    };
  } catch (error) {
    console.error("Failed to fetch all households:", error);
    throw error;
  }
};

export default {
  fetchAllHouseholds,
};