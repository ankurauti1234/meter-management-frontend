import api from './api'; // Import the Axios instance

// Fetch available meters using the Axios instance
export const fetchMeters = async () => {
  try {
    const response = await api.get('/ssh/meters');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch meters' };
  }
};

// Utility function for WebSocket since Axios doesn't handle WebSocket
export const createWebSocket = () => {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
  return new WebSocket(wsUrl);
};