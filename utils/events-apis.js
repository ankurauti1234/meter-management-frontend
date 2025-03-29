// @/utils/events-apis.js
import api from "./api";

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
    ...(filters.deviceId && { deviceId: filters.deviceId }), // Ensure deviceId is included
    ...(filters.deviceIdMin && { deviceIdMin: filters.deviceIdMin }),
    ...(filters.deviceIdMax && { deviceIdMax: filters.deviceIdMax }),
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

    const response = await api.get("/events/meters/associated", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch associated devices with latest events:", error);
    throw error;
  }
};

export const fetchAllMeters = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.hhid && { hhid: filters.hhid }),
      ...(filters.associated && { associated: filters.associated }),
      ...(filters.isAssigned && { isAssigned: filters.isAssigned }),
      ...(filters.sim2Imsi && { sim2Imsi: filters.sim2Imsi }),
      ...(filters.sim1Pass && { sim1Pass: filters.sim1Pass }),
      ...(filters.sim2Pass && { sim2Pass: filters.sim2Pass }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events/meters", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch all meters:", error);
    throw error;
  }
};

export const fetchAllSubmeters = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...(deviceParams.deviceId && { submeterId: deviceParams.deviceId }), // Map deviceId to submeterId
      ...(deviceParams.deviceIdMin && { submeterIdMin: deviceParams.deviceIdMin }),
      ...(deviceParams.deviceIdMax && { submeterIdMax: deviceParams.deviceIdMax }),
      ...(filters.hhid && { hhid: filters.hhid }),
      ...(filters.isAssigned && { isAssigned: filters.isAssigned }),
      ...(filters.submeterMac && { submeterMac: filters.submeterMac }),
      ...(filters.boundedSerialNumber && { boundedSerialNumber: filters.boundedSerialNumber }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
    };

    const response = await api.get("/events/submeters", { params });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch all submeters:", error);
    throw error;
  }
};

export const fetchAlerts = async (filters) => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      ...deviceParams,
      ...(filters.type && filters.type !== "all" && { type: filters.type }),
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

// Create a descriptive filename based on filters
const generateReportFilename = (filters, format) => {
  // Handle device ID part
  let devicePart = 'all-devices';
  if (filters.deviceSearch) {
    if (filters.deviceSearch.includes('-')) {
      const [min, max] = filters.deviceSearch.split('-').map(d => d.trim());
      devicePart = `devices-${min}-to-${max}`;
    } else {
      devicePart = `device-${filters.deviceSearch.trim()}`;
    }
  }
  
  // Handle date range part
  let datePart = 'all-time';
  if (filters.fromDate && filters.toDate) {
    datePart = `${filters.fromDate.replace(/-/g, '')}-to-${filters.toDate.replace(/-/g, '')}`;
  } else if (filters.fromDate) {
    datePart = `from-${filters.fromDate.replace(/-/g, '')}`;
  } else if (filters.toDate) {
    datePart = `to-${filters.toDate.replace(/-/g, '')}`;
  }
  
  // Add event type if specified
  let typePart = '';
  if (filters.type && filters.type !== 'all') {
    typePart = `-type-${filters.type.replace(/,/g, '-')}`;
  }
  
  return `${devicePart}_${datePart}${typePart}_report.${format}`;
};

export const fetchEventsReport = async (filters, format = 'json') => {
  try {
    const deviceParams = parseDeviceSearch(filters.deviceSearch);
    const params = {
      ...deviceParams,
      ...(filters.type && filters.type !== "all" && { type: filters.type }),
      ...(filters.fromDate && { fromDate: filters.fromDate }),
      ...(filters.toDate && { toDate: filters.toDate }),
      format
    };

    // Request human-readable timestamp format
    params.humanReadableTimestamp = true;

    const response = await api.get("/events/reports", { 
      params,
      responseType: format === 'json' ? 'json' : 'blob' // Handle binary responses for CSV/XLSX
    });

    if (format === 'json') {
      return response.data.data;
    } else {
      // For CSV and XLSX, return blob URL for download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      // Try to get filename from Content-Disposition header first
      let filename = null;
      const contentDisposition = response.headers?.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // If no filename from header, generate one based on filters
      if (!filename) {
        filename = generateReportFilename(filters, format);
      }
      
      return {
        url,
        filename
      };
    }
  } catch (error) {
    console.error("Failed to fetch events report:", error);
    throw error;
  }
};

export default {
  fetchEvents,
  getRealtimeEventsUrl,
  fetchLatestEvents,
  fetchLatestEventByDeviceAndType,
  fetchAssociatedDevicesWithLatestEvents,
  fetchAllMeters,
  fetchAllSubmeters,
  fetchAlerts,
  updateAlertStatus,
  fetchEventsReport
};