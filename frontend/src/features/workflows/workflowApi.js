import axiosClient from '../../lib/axiosClient.js';

export const workflowApi = {
  // Definitions
  getDefinitions: () => axiosClient.get('/workflows/definitions'),
  getDefinition: (id) => axiosClient.get(`/workflows/definitions/${id}`),
  createDefinition: (data) => axiosClient.post('/workflows/definitions', data),
  updateDefinition: (id, data) => axiosClient.put(`/workflows/definitions/${id}`, data),
  deleteDefinition: (id) => axiosClient.delete(`/workflows/definitions/${id}`),
  seedDefinitions: () => axiosClient.post('/workflows/definitions/seed'),

  // Submission
  submitForApproval: (contractId) =>
    axiosClient.post(`/workflows/contracts/${contractId}/submit`),
  getWorkflowForContract: (contractId) =>
    axiosClient.get(`/workflows/contracts/${contractId}/workflow`),

  // Actions
  approve: (instanceId, comment) =>
    axiosClient.post(`/workflows/instances/${instanceId}/approve`, { comment }),
  reject: (instanceId, comment) =>
    axiosClient.post(`/workflows/instances/${instanceId}/reject`, { comment }),
  requestChanges: (instanceId, comment) =>
    axiosClient.post(`/workflows/instances/${instanceId}/request-changes`, { comment }),

  // Inbox
  getInbox: () => axiosClient.get('/workflows/inbox'),
};
