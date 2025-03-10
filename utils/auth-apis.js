// @/utils/auth-apis.js
import api from "./api";

export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "An error occurred" };
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post("/auth/create-user", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "An error occurred" };
  }
};

export const listUsers = async (params) => {
  try {
    const response = await api.get("/auth/list-users", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "An error occurred" };
  }
};

export const editUser = async (id, userData) => {
  try {
    const response = await api.put(`/auth/edit-user/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "An error occurred" };
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/auth/delete-user/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "An error occurred" };
  }
};