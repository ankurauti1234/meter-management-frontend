// @/utils/config-api.js
import api from "./api";

// Config-related APIs
export const fetchConfigLogs = async () => {
  try {
    const response = await api.get("/config/status");
    return response.data.data;
  } catch (error) {
    // console.error("Error fetching config logs:", error);
    throw error;
  }
};

export const pushConfig = async (payload) => {
  try {
    const response = await api.post("/config", payload);
    return response.data;
  } catch (error) {
    // console.error("Error pushing config:", error);
    throw error;
  }
};

// Decommission-related APIs
export const fetchDecommissionLogs = async () => {
  try {
    const response = await api.get("/decommission/status");
    return response.data.data;
  } catch (error) {
    // console.error("Error fetching decommission logs:", error);
    throw error;
  }
};

export const decommissionDevices = async (payload) => {
  try {
    const response = await api.post("/decommission", payload);
    return response.data;
  } catch (error) {
    // console.error("Error decommissioning devices:", error);
    throw error;
  }
};