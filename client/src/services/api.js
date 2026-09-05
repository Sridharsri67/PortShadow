import axios from "axios";

const API_BASE_URL = "/api";

// Intercept errors to extract clean backend error messages
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverError = error.response?.data?.error || error.response?.data?.message || error.message;
    return Promise.reject(new Error(serverError));
  } 
);

export const getStatus = async () => {
  const response = await axios.get(`${API_BASE_URL}/status`);
  return response.data;
};

export const getConnections = async () => {
  const response = await axios.get(`${API_BASE_URL}/connections/all`);
  return response.data;
};

export const createConnection = async (data = {}) => {
  const response = await axios.post(`${API_BASE_URL}/connections`, data);
  return response.data;
};

export const closeConnection = async (connectionId) => {
  const response = await axios.post(`${API_BASE_URL}/connections/${connectionId}/close`);
  return response.data;
};

export const getTombstones = async () => {
  const response = await axios.get(`${API_BASE_URL}/tombstones`);
  return response.data;
};

export const getPackets = async () => {
  const response = await axios.get(`${API_BASE_URL}/packets`);
  return response.data;
};

export const sendPacket = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/packets`, data);
  return response.data;
};

export const transmitNetworkPacket = async (packetId, options = {}) => {
  const response = await axios.post(`${API_BASE_URL}/network/transmit`, { packetId, ...options });
  return response.data;
};

export const releaseDelayedPacket = async (packetId) => {
  const response = await axios.post(`${API_BASE_URL}/network/release/${packetId}`);
  return response.data;
};

export const runScenario = async (scenarioName) => {
  const response = await axios.post(`${API_BASE_URL}/scenarios/${scenarioName}`);
  return response.data;
};

export const resetSimulation = async () => {
  const response = await axios.post(`${API_BASE_URL}/reset`);
  return response.data;
};
