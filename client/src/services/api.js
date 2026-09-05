import axios from "axios";

const API_BASE_URL = "/api";

export const getStatus = async () => {
  const response = await axios.get(`${API_BASE_URL}/status`);
  return response.data;
};

export const getConnections = async () => {
  const response = await axios.get(`${API_BASE_URL}/connections/all`);
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

export const runScenario = async (scenarioName) => {
  const response = await axios.post(`${API_BASE_URL}/scenarios/${scenarioName}`);
  return response.data;
};

export const resetSimulation = async () => {
  const response = await axios.post(`${API_BASE_URL}/reset`);
  return response.data;
};
