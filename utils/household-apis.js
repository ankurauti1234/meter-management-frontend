// @/utils/household-apis.js
import api from "./api";

export const fetchAllHouseholds = async (filters) => {
  try {
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(filters.hhid && { hhid: filters.hhid }),
    };

    const response = await api.get("/households", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch all households:", error);
    throw error;
  }
};

export default {
  fetchAllHouseholds,
};