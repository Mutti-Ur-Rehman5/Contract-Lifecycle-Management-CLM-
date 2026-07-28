import axiosClient from '../../lib/axiosClient.js';

export const signatureApi = {
  requestSignatures: (contractId) =>
    axiosClient.post(`/signatures/contracts/${contractId}/request`),
  uploadSignatureImage: (contractId, imageBase64) =>
    axiosClient.post(`/signatures/contracts/${contractId}/upload-image`, { imageBase64 }),
  sign: (contractId, signatureImageUrl) =>
    axiosClient.post(`/signatures/contracts/${contractId}/sign`, { signatureImageUrl }),
  decline: (contractId, comment) =>
    axiosClient.post(`/signatures/contracts/${contractId}/decline`, { comment }),
  getStatus: (contractId) =>
    axiosClient.get(`/signatures/contracts/${contractId}/status`),

  compareVersions: (contractId, versionAId, versionBId) =>
    axiosClient.get(`/signatures/contracts/${contractId}/versions/compare`, {
      params: { versionAId, versionBId },
    }),
  rollbackVersion: (contractId, targetVersionId) =>
    axiosClient.post(`/signatures/contracts/${contractId}/versions/rollback`, { targetVersionId }),
};
