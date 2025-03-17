// @/utils/upload-assets-apis.js
import api from "./api";

export const uploadCSV = async (file, type) => {
  try {
    const formData = new FormData();
    formData.append("csvFile", file);

    const response = await api.post(`/assets/upload-csv?type=${type}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to upload CSV:", error);
    throw error.response?.data || error;
  }
};

export default {
  uploadCSV,
};