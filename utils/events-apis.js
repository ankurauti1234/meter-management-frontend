// @/utils/events-apis.js
import api from "./api";

export const fetchEventTypes = async () => {
  try {
    const response = await api.get("/event-types");
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch event types:", error);
    throw error;
  }
};

export const fetchEvents = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.type && filters.type !== "all" && { type: filters.type }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw error;
  }
};

export const getRealtimeEventsUrl = (filters) => {
  const deviceParams = parseDeviceSearch(filters.deviceSearch);
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    ...deviceParams,
    ...(filters.type && filters.type !== "all" && { type: filters.type }),
  }).toString();

  return `${process.env.NEXT_PUBLIC_API_URL}/events/realtime${queryParams ? "?" + queryParams : ""}`;
};

export const fetchLatestEvents = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.type && filters.type !== "all" && { type: filters.type }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events/latest", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch latest events:", error);
    throw error;
  }
};

export const fetchLatestEventByDeviceAndType = async (deviceId, type, filters = {}) => {
  try {
    const params = {
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };
    
    const response = await api.get(`/events/latest/${deviceId}/${type}`, { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch latest event by device and type:", error);
    throw error;
  }
};

export const fetchAssociatedDevicesWithLatestEvents = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.type && filters.type !== "all" && { type: filters.type }),
      ...(filters.hhid && { hhid: filters.hhid }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events/associated", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch associated devices with latest events:", error);
    throw error;
  }
};

// New Alert APIs
export const fetchAlerts = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.priority && filters.priority !== "all" && { priority: filters.priority }),
      ...(filters.status && filters.status !== "all" && { status: filters.status }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events/alerts", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    throw error;
  }
};

export const updateAlertStatus = async (eventId, status) => {
  try {
    const response = await api.put(`/events/alerts/${eventId}/status`, { status });
    return response.data.data;
  } catch (error) {
    console.error("Failed to update alert status:", error);
    throw error;
  }
};

// Helper function to parse device search
const parseDeviceSearch = (deviceSearch) => {
  if (!deviceSearch) return {};
  if (deviceSearch.includes("-")) {
    const [min, max] = deviceSearch.split("-").map((v) => v.trim());
    return { deviceIdMin: min, deviceIdMax: max };
  }
  return { deviceId: deviceSearch };
};

export default {
  fetchEventTypes,
  fetchEvents,
  getRealtimeEventsUrl,
  fetchLatestEvents,
  fetchLatestEventByDeviceAndType,
  fetchAssociatedDevicesWithLatestEvents,
  fetchAlerts,
  updateAlertStatus
};