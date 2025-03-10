import api from "./api";

export const uploadFullOtaUpdate = async (file, version, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (version) formData.append("version", version);

    const response = await api.post("/ota/upload/full", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        console.log('Full Upload Progress:', progress);
        onProgress(progress);
      },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Full update failed" };
  }
};

export const uploadDeltaSwu = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/ota/upload/delta/swu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        console.log('SWU Upload Progress:', progress); // Debug log
        onProgress(progress);
      },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Delta SWU upload failed" };
  }
};

export const uploadDeltaZck = async (file, swuUrl, version, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("swuUrl", swuUrl);
    if (version) formData.append("version", version);

    const response = await api.post("/ota/upload/delta/zck", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        console.log('ZCK Upload Progress:', progress);
        onProgress(progress);
      },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Delta ZCK upload failed" };
  }
};

export const fetchOtaHistory = async () => {
  try {
    const response = await api.get("/ota/history");
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch OTA history" };
  }
};