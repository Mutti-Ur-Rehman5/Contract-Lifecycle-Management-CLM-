import userRepository from '../repositories/user.repository.js';
import departmentRepository from '../repositories/department.repository.js';
import teamRepository from '../repositories/team.repository.js';
import branchOfficeRepository from '../repositories/branchOffice.repository.js';

const organizationService = {
  // --- Departments ---
  async createDepartment(organizationId, data) {
    return departmentRepository.create({ organizationId, name: data.name, parentDepartmentId: data.parentDepartmentId || null });
  },

  async listDepartments(organizationId) {
    return departmentRepository.findByOrganization(organizationId);
  },

  async updateDepartment(id, organizationId, data) {
    const dept = await departmentRepository.findById(id);
    if (!dept || dept.organizationId.toString() !== organizationId) {
      const err = new Error('Department not found');
      err.statusCode = 404;
      throw err;
    }
    return departmentRepository.updateById(id, { name: data.name, parentDepartmentId: data.parentDepartmentId });
  },

  async deleteDepartment(id, organizationId) {
    const dept = await departmentRepository.findById(id);
    if (!dept || dept.organizationId.toString() !== organizationId) {
      const err = new Error('Department not found');
      err.statusCode = 404;
      throw err;
    }
    await teamRepository.findByDepartment(id).then((teams) => {
      if (teams.length > 0) {
        const err = new Error('Cannot delete department with existing teams');
        err.statusCode = 400;
        throw err;
      }
    });
    return departmentRepository.deleteById(id);
  },

  // --- Teams ---
  async createTeam(organizationId, data) {
    if (data.departmentId) {
      const dept = await departmentRepository.findById(data.departmentId);
      if (!dept || dept.organizationId.toString() !== organizationId) {
        const err = new Error('Department not found in this organization');
        err.statusCode = 404;
        throw err;
      }
    }
    return teamRepository.create({ organizationId, name: data.name, departmentId: data.departmentId || null });
  },

  async listTeams(organizationId, departmentId) {
    if (departmentId) return teamRepository.findByDepartment(departmentId);
    return teamRepository.findByOrganization(organizationId);
  },

  async updateTeam(id, organizationId, data) {
    const team = await teamRepository.findById(id);
    if (!team || team.organizationId.toString() !== organizationId) {
      const err = new Error('Team not found');
      err.statusCode = 404;
      throw err;
    }
    return teamRepository.updateById(id, { name: data.name, departmentId: data.departmentId });
  },

  async deleteTeam(id, organizationId) {
    const team = await teamRepository.findById(id);
    if (!team || team.organizationId.toString() !== organizationId) {
      const err = new Error('Team not found');
      err.statusCode = 404;
      throw err;
    }
    return teamRepository.deleteById(id);
  },

  // --- Branch Offices ---
  async createBranchOffice(organizationId, data) {
    return branchOfficeRepository.create({
      organizationId,
      name: data.name,
      address: data.address || '',
      timezone: data.timezone || 'UTC',
    });
  },

  async listBranchOffices(organizationId) {
    return branchOfficeRepository.findByOrganization(organizationId);
  },

  async updateBranchOffice(id, organizationId, data) {
    const office = await branchOfficeRepository.findById(id);
    if (!office || office.organizationId.toString() !== organizationId) {
      const err = new Error('Branch office not found');
      err.statusCode = 404;
      throw err;
    }
    return branchOfficeRepository.updateById(id, { name: data.name, address: data.address, timezone: data.timezone });
  },

  async deleteBranchOffice(id, organizationId) {
    const office = await branchOfficeRepository.findById(id);
    if (!office || office.organizationId.toString() !== organizationId) {
      const err = new Error('Branch office not found');
      err.statusCode = 404;
      throw err;
    }
    return branchOfficeRepository.deleteById(id);
  },

  // --- Users ---
  async inviteUser(organizationId, data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const err = new Error('A user with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    return userRepository.create({
      organizationId,
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      role: data.role,
      departmentId: data.departmentId || null,
    });
  },

  async listUsers(organizationId) {
    return userRepository.findByOrganization(organizationId);
  },

  async updateUserRole(userId, organizationId, role) {
    const user = await userRepository.findById(userId);
    if (!user || user.organizationId.toString() !== organizationId) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return userRepository.updateById(userId, { role });
  },

  async toggleUserActive(userId, organizationId) {
    const user = await userRepository.findById(userId);
    if (!user || user.organizationId.toString() !== organizationId) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return userRepository.updateById(userId, { isActive: !user.isActive });
  },
};

export default organizationService;
