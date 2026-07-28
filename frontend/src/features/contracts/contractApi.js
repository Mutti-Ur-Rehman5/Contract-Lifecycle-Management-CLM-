import axiosClient from '../../lib/axiosClient.js';

export const contractApi = {
  // Templates
  getTemplates: (contractType) =>
    axiosClient.get('/contracts/templates', { params: contractType ? { contractType } : {} }),
  getTemplate: (id) => axiosClient.get(`/contracts/templates/${id}`),
  getTemplateVariables: (id) => axiosClient.get(`/contracts/templates/${id}/variables`),
  createTemplate: (data) => axiosClient.post('/contracts/templates', data),
  updateTemplate: (id, data) => axiosClient.put(`/contracts/templates/${id}`, data),
  deleteTemplate: (id) => axiosClient.delete(`/contracts/templates/${id}`),

  // Clauses
  getClauses: (category) =>
    axiosClient.get('/contracts/clauses', { params: category ? { category } : {} }),
  createClause: (data) => axiosClient.post('/contracts/clauses', data),
  updateClause: (id, data) => axiosClient.put(`/contracts/clauses/${id}`, data),
  deleteClause: (id) => axiosClient.delete(`/contracts/clauses/${id}`),

  // Contracts
  getContracts: (params) => axiosClient.get('/contracts', { params }),
  getContract: (id) => axiosClient.get(`/contracts/${id}`),
  getContractVersions: (id) => axiosClient.get(`/contracts/${id}/versions`),
  createFromTemplate: (data) => axiosClient.post('/contracts/from-template', data),
  saveContract: (id, data) => axiosClient.put(`/contracts/${id}/save`, data),
  deleteContract: (id) => axiosClient.delete(`/contracts/${id}`),
  generatePdf: (id) => axiosClient.post(`/contracts/${id}/generate-pdf`),
  downloadPdf: (contractId, versionId) =>
    axiosClient.get(`/contracts/${contractId}/pdf/${versionId}`, { responseType: 'blob' }),
};
