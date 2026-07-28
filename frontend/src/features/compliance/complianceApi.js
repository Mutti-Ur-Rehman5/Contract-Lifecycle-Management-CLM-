import axiosClient from '../../lib/axiosClient.js';

export const complianceApi = {
  getDashboard: () => axiosClient.get('/compliance/dashboard'),
  getRiskContracts: () => axiosClient.get('/compliance/risk-contracts'),
};
