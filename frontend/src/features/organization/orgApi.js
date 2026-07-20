import axiosClient from '../../lib/axiosClient.js';

export const orgApi = {
  // Departments
  getDepartments: () => axiosClient.get('/organizations/departments'),
  createDepartment: (data) => axiosClient.post('/organizations/departments', data),
  updateDepartment: (id, data) => axiosClient.put(`/organizations/departments/${id}`, data),
  deleteDepartment: (id) => axiosClient.delete(`/organizations/departments/${id}`),

  // Teams
  getTeams: (departmentId) =>
    axiosClient.get('/organizations/teams', { params: departmentId ? { departmentId } : {} }),
  createTeam: (data) => axiosClient.post('/organizations/teams', data),
  updateTeam: (id, data) => axiosClient.put(`/organizations/teams/${id}`, data),
  deleteTeam: (id) => axiosClient.delete(`/organizations/teams/${id}`),

  // Branch Offices
  getBranchOffices: () => axiosClient.get('/organizations/branch-offices'),
  createBranchOffice: (data) => axiosClient.post('/organizations/branch-offices', data),
  updateBranchOffice: (id, data) => axiosClient.put(`/organizations/branch-offices/${id}`, data),
  deleteBranchOffice: (id) => axiosClient.delete(`/organizations/branch-offices/${id}`),

  // Users
  getUsers: () => axiosClient.get('/organizations/users'),
  inviteUser: (data) => axiosClient.post('/organizations/users/invite', data),
  updateUserRole: (id, role) => axiosClient.patch(`/organizations/users/${id}/role`, { role }),
  toggleUserActive: (id) => axiosClient.patch(`/organizations/users/${id}/toggle-active`),
};
