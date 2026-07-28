import userRepository from '../repositories/user.repository.js';
import departmentRepository from '../repositories/department.repository.js';
import teamRepository from '../repositories/team.repository.js';
import branchOfficeRepository from '../repositories/branchOffice.repository.js';
import auditLogService from './auditLog.service.js';

const organizationService = {
  // --- Departments ---
  async createDepartment(organizationId, data) {
    const dept = await departmentRepository.create({ organizationId, name: data.name, parentDepartmentId: data.parentDepartmentId || null });
    await auditLogService.log({ organizationId, userId: data.userId, action: 'department.create', entityType: 'Department', entityId: dept._id, metadata: { name: data.name } });
    return dept;
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
    const updated = await departmentRepository.updateById(id, { name: data.name, parentDepartmentId: data.parentDepartmentId });
    await auditLogService.log({ organizationId, userId: data.userId, action: 'department.update', entityType: 'Department', entityId: id, metadata: { name: data.name } });
    return updated;
  },

  async deleteDepartment(id, organizationId, userId) {
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
    await auditLogService.log({ organizationId, userId, action: 'department.delete', entityType: 'Department', entityId: id, metadata: { name: dept.name } });
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
    const team = await teamRepository.create({ organizationId, name: data.name, departmentId: data.departmentId || null });
    await auditLogService.log({ organizationId, userId: data.userId, action: 'team.create', entityType: 'Team', entityId: team._id, metadata: { name: data.name } });
    return team;
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
    const office = await branchOfficeRepository.create({
      organizationId,
      name: data.name,
      address: data.address || '',
      timezone: data.timezone || 'UTC',
    });
    await auditLogService.log({ organizationId, userId: data.userId, action: 'branch_office.create', entityType: 'BranchOffice', entityId: office._id, metadata: { name: data.name } });
    return office;
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

    const user = await userRepository.create({
      organizationId,
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      role: data.role,
      departmentId: data.departmentId || null,
    });

    await auditLogService.log({ organizationId, userId: data.userId, action: 'user.invite', entityType: 'User', entityId: user._id, metadata: { email: data.email, role: data.role } });
    return user;
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
