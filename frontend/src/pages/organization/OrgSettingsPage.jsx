import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { orgApi } from '../../features/organization/orgApi.js';
import { workflowApi } from '../../features/workflows/workflowApi.js';
import { contractApi } from '../../features/contracts/contractApi.js';
import WorkflowDefinitionEditor from '../../components/workflow/WorkflowDefinitionEditor.jsx';
import '../../styles/pages/org-settings.css';

function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`settings-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ConfirmDialog({ message, isDanger, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="modal-message" dangerouslySetInnerHTML={{ __html: message }} />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete Permanently</button>
        </div>
      </div>
    </div>
  );
}

function OrgSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('departments');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showWfEditor, setShowWfEditor] = useState(false);
  const [wfEditing, setWfEditing] = useState(null);

  // Queries
  const { data: departments, isLoading: deptsLoading, error: deptsError } = useQuery({
    queryKey: ['departments'],
    queryFn: () => orgApi.getDepartments().then((r) => r.data.data),
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => orgApi.getTeams().then((r) => r.data.data),
  });

  const { data: branchOffices, isLoading: officesLoading } = useQuery({
    queryKey: ['branchOffices'],
    queryFn: () => orgApi.getBranchOffices().then((r) => r.data.data),
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['orgUsers'],
    queryFn: () => orgApi.getUsers().then((r) => r.data.data),
  });

  // Mutations
  const createDept = useMutation({
    mutationFn: (data) => orgApi.createDepartment(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setShowForm(false); },
  });
  const updateDept = useMutation({
    mutationFn: ({ id, data }) => orgApi.updateDepartment(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setEditing(null); },
  });
  const deleteDept = useMutation({
    mutationFn: (id) => orgApi.deleteDepartment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setDeleting(null); },
  });

  const createTeam = useMutation({
    mutationFn: (data) => orgApi.createTeam(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setShowForm(false); },
  });
  const deleteTeam = useMutation({
    mutationFn: (id) => orgApi.deleteTeam(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setDeleting(null); },
  });

  const createOffice = useMutation({
    mutationFn: (data) => orgApi.createBranchOffice(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branchOffices'] }); setShowForm(false); },
  });
  const deleteOffice = useMutation({
    mutationFn: (id) => orgApi.deleteBranchOffice(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branchOffices'] }); setDeleting(null); },
  });

  const inviteUser = useMutation({
    mutationFn: (data) => orgApi.inviteUser(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orgUsers'] }); setShowInviteForm(false); },
  });

  const toggleActive = useMutation({
    mutationFn: (id) => orgApi.toggleUserActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orgUsers'] }),
  });

  // Workflow Definitions
  const { data: wfDefinitions } = useQuery({
    queryKey: ['wfDefinitions'],
    queryFn: () => workflowApi.getDefinitions().then((r) => r.data.data),
  });

  const seedWf = useMutation({
    mutationFn: () => workflowApi.seedDefinitions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wfDefinitions'] }),
  });

  const createWf = useMutation({
    mutationFn: (data) => workflowApi.createDefinition(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wfDefinitions'] }); setShowWfEditor(false); },
  });

  const updateWf = useMutation({
    mutationFn: ({ id, data }) => workflowApi.updateDefinition(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['wfDefinitions'] }); setWfEditing(null); setShowWfEditor(false); },
  });

  const deleteWf = useMutation({
    mutationFn: (id) => workflowApi.deleteDefinition(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wfDefinitions'] }),
  });

  // Templates
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => contractApi.getTemplates().then((r) => r.data.data),
  });

  // Contracts (all for this org)
  const { data: contractsData } = useQuery({
    queryKey: ['settingsContracts'],
    queryFn: () => contractApi.getContracts({ limit: 200 }).then((r) => r.data.data),
  });
  const contracts = contractsData?.data || [];

  const createTemplate = useMutation({
    mutationFn: (data) => contractApi.createTemplate(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setShowForm(false); },
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }) => contractApi.updateTemplate(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setEditing(null); },
  });

  const deleteTemplate = useMutation({
    mutationFn: (id) => contractApi.deleteTemplate(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setDeleting(null); },
  });

  const deleteContract = useMutation({
    mutationFn: (id) => contractApi.deleteContract(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settingsContracts'] }); setDeleting(null); },
  });

  return (
    <div className="settings-page">
      <h1 className="settings-title">Organization Settings</h1>

      {!isAdmin && (
        <div className="settings-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 15 }}>
            You don't have permission to view this page. Only organization administrators can manage settings.
          </p>
        </div>
      )}

      {isAdmin && (
      <div className="settings-tabs">
        <TabButton active={activeTab === 'departments'} onClick={() => setActiveTab('departments')}>
          Departments
        </TabButton>
        <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')}>
          Teams
        </TabButton>
        <TabButton active={activeTab === 'branchOffices'} onClick={() => setActiveTab('branchOffices')}>
          Branch Offices
        </TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          Users
        </TabButton>
        <TabButton active={activeTab === 'workflows'} onClick={() => setActiveTab('workflows')}>
          Workflows
        </TabButton>
        <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>
          Templates
        </TabButton>
        <TabButton active={activeTab === 'contracts'} onClick={() => setActiveTab('contracts')}>
          Contracts
        </TabButton>
      </div>
      )}

      {isAdmin && (
      <div className="settings-panel">
        {/* --- Departments Tab --- */}
        {activeTab === 'departments' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Departments</h2>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
                Add department
              </button>
            </div>
            {(showForm || editing) && (
              <DepartmentForm
                initial={editing}
                onSubmit={(data) => {
                  if (editing) updateDept.mutate({ id: editing._id, data });
                  else createDept.mutate(data);
                }}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Parent Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deptsLoading && (
                  <tr><td colSpan={3} className="empty-cell">Loading...</td></tr>
                )}
                {deptsError && !deptsLoading && (
                  <tr><td colSpan={3} className="empty-cell" style={{ color: '#B3261E' }}>Failed to load departments.</td></tr>
                )}
                {!deptsLoading && !deptsError && (departments || []).map((d) => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td>{departments?.find((p) => p._id === d.parentDepartmentId)?.name || '—'}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(d); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting(d)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {departments?.length === 0 && (
                  <tr><td colSpan={3} className="empty-cell">No departments yet. Add one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* --- Teams Tab --- */}
        {activeTab === 'teams' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Teams</h2>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
                Add team
              </button>
            </div>
            {showForm && (
              <TeamForm
                departments={departments}
                onSubmit={(data) => createTeam.mutate(data)}
                onCancel={() => setShowForm(false)}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamsLoading && (
                  <tr><td colSpan={3} className="empty-cell">Loading...</td></tr>
                )}
                {!teamsLoading && (teams || []).map((t) => (
                  <tr key={t._id}>
                    <td>{t.name}</td>
                    <td>{departments?.find((d) => d._id === t.departmentId)?.name || '—'}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {teams?.length === 0 && (
                  <tr><td colSpan={3} className="empty-cell">No teams yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* --- Branch Offices Tab --- */}
        {activeTab === 'branchOffices' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Branch Offices</h2>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
                Add branch office
              </button>
            </div>
            {showForm && (
              <BranchOfficeForm
                onSubmit={(data) => createOffice.mutate(data)}
                onCancel={() => setShowForm(false)}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Timezone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officesLoading && (
                  <tr><td colSpan={4} className="empty-cell">Loading...</td></tr>
                )}
                {!officesLoading && (branchOffices || []).map((o) => (
                  <tr key={o._id}>
                    <td>{o.name}</td>
                    <td>{o.address || '—'}</td>
                    <td>{o.timezone}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting(o)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {branchOffices?.length === 0 && (
                  <tr><td colSpan={4} className="empty-cell">No branch offices yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* --- Workflow Definitions Tab --- */}
        {activeTab === 'workflows' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Workflow Definitions</h2>
              <div className="panel-header-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => seedWf.mutate()} disabled={seedWf.isPending}>
                  {seedWf.isPending ? 'Seeding...' : 'Seed defaults'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => { setShowWfEditor(true); setWfEditing(null); }}>
                  Add definition
                </button>
              </div>
            </div>
            {showWfEditor && (
              <WorkflowDefinitionEditor
                initial={wfEditing}
                onSubmit={(data) => {
                  if (wfEditing) updateWf.mutate({ id: wfEditing._id, data });
                  else createWf.mutate(data);
                }}
                onCancel={() => { setShowWfEditor(false); setWfEditing(null); }}
                error={createWf.error?.response?.data?.error?.message || updateWf.error?.response?.data?.error?.message}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contract Type</th>
                  <th>Stages</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(wfDefinitions || []).map((d) => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td><span className="role-badge">{d.contractType}</span></td>
                    <td>{(d.stages || []).length}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setWfEditing(d); setShowWfEditor(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting(d)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {wfDefinitions?.length === 0 && (
                  <tr><td colSpan={4} className="empty-cell">No workflow definitions. Click "Seed defaults" to create them.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
        {/* --- Users Tab --- */}
        {activeTab === 'templates' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Contract Templates</h2>
              <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); }}>
                Add template
              </button>
            </div>
            {(showForm || editing) && (
              <TemplateForm
                initial={editing}
                onSubmit={(data) => {
                  if (editing) updateTemplate.mutate({ id: editing._id, data });
                  else createTemplate.mutate(data);
                }}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                error={createTemplate.error?.response?.data?.error?.message || updateTemplate.error?.response?.data?.error?.message}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contract Type</th>
                  <th>Variables</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(templates || []).map((t) => (
                  <tr key={t._id}>
                    <td>{t.name}</td>
                    <td><span className="role-badge">{t.contractType}</span></td>
                    <td>
                      {(t.contentTemplate || '').match(/\{\{(\w+)\}\}/g)?.map((v) => v.replace(/\{\{|\}\}/g, '')) || '—'}
                    </td>
                    <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {templates?.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">No templates yet. Add one to start creating contracts from templates.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* --- Contracts Tab --- */}
        {activeTab === 'contracts' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">All Contracts</h2>
            </div>
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c._id}>
                    <td>{c.title}</td>
                    <td><span className="role-badge">{c.type}</span></td>
                    <td><span className={`status-badge ${c.status === 'published' ? 'active' : ''}`}>{c.status?.replace(/_/g, ' ')}</span></td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="actions-cell">
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleting({ ...c, _deleteType: 'contract' })}>Delete</button>
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">No contracts in this organization yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

        {/* --- Users Tab --- */}
        {activeTab === 'users' && (
          <>
            <div className="panel-header">
              <h2 className="panel-title">Users</h2>
              <button className="btn btn-primary" onClick={() => setShowInviteForm(true)}>
                Invite user
              </button>
            </div>
            {showInviteForm && (
              <InviteUserForm
                departments={departments}
                onSubmit={(data) => inviteUser.mutate(data)}
                onCancel={() => setShowInviteForm(false)}
                error={inviteUser.error?.response?.data?.error?.message}
              />
            )}
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading && (
                  <tr><td colSpan={5} className="empty-cell">Loading...</td></tr>
                )}
                {!usersLoading && (users || []).map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="role-badge">{u.role.replace('_', ' ')}</span></td>
                    <td>
                      <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => toggleActive.mutate(u._id)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users?.length === 0 && (
                  <tr><td colSpan={5} className="empty-cell">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
      )}

      {/* Delete confirmation modal */}
      {isAdmin && deleting && (
        <ConfirmDialog
          message={deleting._deleteType === 'contract'
            ? `Are you sure you want to permanently delete "<strong>${deleting.title}</strong>"?<span class="delete-warning">This will remove the contract and ALL related data: workflow instances, approval steps, versions, signatures, obligations, notifications, and audit logs. This action is irreversible.</span>`
            : `Are you sure you want to delete "<strong>${deleting.name || deleting.title}</strong>"? This cannot be undone.`}
          onConfirm={() => {
            if (deleting._deleteType === 'contract') deleteContract.mutate(deleting._id);
            else if (activeTab === 'departments') deleteDept.mutate(deleting._id);
            else if (activeTab === 'teams') deleteTeam.mutate(deleting._id);
            else if (activeTab === 'branchOffices') deleteOffice.mutate(deleting._id);
            else if (activeTab === 'workflows') deleteWf.mutate(deleting._id);
            else if (activeTab === 'templates') deleteTemplate.mutate(deleting._id);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function DepartmentForm({ initial, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
  };
  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input className="form-input" placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">{initial ? 'Update' : 'Create'}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function TeamForm({ departments, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, departmentId: departmentId || null });
  };
  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input className="form-input" placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <select className="form-input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
        <option value="">No department</option>
        {(departments || []).map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">Create</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function BranchOfficeForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, address });
  };
  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input className="form-input" placeholder="Office name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <input className="form-input" placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">Create</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function InviteUserForm({ departments, onSubmit, onCancel, error }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'drafter', departmentId: '' });
  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, departmentId: form.departmentId || null });
  };
  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <input className="form-input" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required autoFocus />
      <input className="form-input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input className="form-input" name="password" type="password" placeholder="Temporary password" value={form.password} onChange={handleChange} required minLength={8} />
      <select className="form-input" name="role" value={form.role} onChange={handleChange}>
        <option value="drafter">Drafter</option>
        <option value="reviewer">Reviewer</option>
        <option value="legal">Legal</option>
        <option value="finance">Finance</option>
        <option value="executive">Executive</option>
        <option value="signatory">Signatory</option>
        <option value="compliance_officer">Compliance Officer</option>
        <option value="admin">Admin</option>
      </select>
      <select className="form-input" name="departmentId" value={form.departmentId} onChange={handleChange}>
        <option value="">No department</option>
        {(departments || []).map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">Invite</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function TemplateForm({ initial, onSubmit, onCancel, error }) {
  const [name, setName] = useState(initial?.name || '');
  const [contractType, setContractType] = useState(initial?.contractType || 'service');
  const [contentTemplate, setContentTemplate] = useState(initial?.contentTemplate || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, contractType, contentTemplate });
  };

  return (
    <form className="inline-form template-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <input className="form-input" placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <select className="form-input" value={contractType} onChange={(e) => setContractType(e.target.value)}>
        <option value="employment">Employment</option>
        <option value="vendor">Vendor</option>
        <option value="nda">NDA</option>
        <option value="service">Service</option>
        <option value="purchase">Purchase</option>
        <option value="partnership">Partnership</option>
        <option value="client">Client</option>
      </select>
      <textarea
        className="form-textarea"
        placeholder="Template content using {{variable_name}} syntax — e.g. {{party_name}}, {{start_date}}, {{end_date}}"
        value={contentTemplate}
        onChange={(e) => setContentTemplate(e.target.value)}
        rows={6}
      />
      <div className="inline-form-actions">
        <button type="submit" className="btn btn-primary btn-sm">{initial ? 'Update' : 'Create'}</button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default OrgSettingsPage;
