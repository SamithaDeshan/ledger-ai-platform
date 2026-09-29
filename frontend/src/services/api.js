import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getCategoryBreakdown = async () => {
  const response = await api.get('/dashboard/category-breakdown');
  return response.data;
};

export const getTransactions = async (filters = {}) => {
  const response = await api.get('/transactions', { params: filters });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export const updateTransaction = async (id, payload) => {
  const response = await api.put(`/transactions/${id}`, payload);
  return response.data;
};

export const deleteTransaction = async (id, reason) => {
  const response = await api.delete(`/transactions/${id}`, { params: { reason } });
  return response.data;
};

export const getTransactionAuditTrail = async (id) => {
  const response = await api.get(`/audit/transaction/${id}`);
  return response.data;
};

export const sendWhatsAppWebhook = async (payload) => {
  const response = await api.post('/whatsapp/webhook', payload);
  return response.data;
};

export const uploadLedgerImage = async (formData) => {
  const response = await api.post('/ledger/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
