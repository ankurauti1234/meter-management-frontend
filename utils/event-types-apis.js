// @/utils/event-types-api.js
import api from "./api";

export const fetchEventTypes = async () => {
  try {
    const response = await api.get("/event-types");
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to fetch event types");
  }
};

export const addEventType = async (eventType) => {
  try {
    const response = await api.post("/event-types", eventType);
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to add event type: " + error.message);
  }
};

export const addMultipleEventTypes = async (eventTypes) => {
  try {
    const response = await api.post("/event-types/add-multiple", eventTypes);
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to add multiple event types: " + error.message);
  }
};

export const updateEventType = async (id, eventType) => {
  try {
    const response = await api.put(`/event-types/${id}`, eventType);
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to update event type: " + error.message);
  }
};

export const deleteEventType = async (id) => {
  try {
    const response = await api.delete(`/event-types/${id}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete event type: " + error.message);
  }
};

export default {
  fetchEventTypes,
  addEventType,
  addMultipleEventTypes,
  updateEventType,
  deleteEventType
};