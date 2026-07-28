import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { obligationApi } from '../../features/obligations/obligationApi.js';
import { contractApi } from '../../features/contracts/contractApi.js';
import '../../styles/pages/obligations.css';

const OBLIGATION_TYPES = [
  { value: 'deliverable', label: 'Deliverable' },
  { value: 'payment_milestone', label: 'Payment Milestone' },
  { value: 'renewal_date', label: 'Renewal Date' },
  { value: 'compliance_task', label: 'Compliance Task' },
  { value: 'sla_commitment', label: 'SLA Commitment' },
];

const STATUS_LABELS = { pending: 'Pending', completed: 'Completed', overdue: 'Overdue' };

const TYPE_COLORS = {
  deliverable: '#7C8BC4',
  payment_milestone: '#2E7D4F',
  renewal_date: '#C68A2E',
  compliance_task: '#8A5FBF',
  sla_commitment: '#1F5C4C',
};

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function ObligationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'legal';
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ contractId: '', title: '', type: 'deliverable', dueDate: '' });

  const { data: obligations = [], isLoading, error } = useQuery({
    queryKey: ['obligations', { status: filterStatus, type: filterType }],
    queryFn: () =>
      obligationApi.getObligations({ status: filterStatus || undefined, type: filterType || undefined })
        .then((r) => r.data.data),
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-for-obligation'],
    queryFn: () => contractApi.getContracts({ limit: 100 }).then((r) => r.data.data?.data || r.data.data || []),
    staleTime: 60_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['obligation-stats'],
    queryFn: () => obligationApi.getStats().then((r) => r.data.data),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['obligations'] });
    queryClient.invalidateQueries({ queryKey: ['obligation-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => obligationApi.createObligation(data),
    onSuccess: () => { invalidateAll(); closeForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => obligationApi.updateObligation(id, data),
    onSuccess: () => { invalidateAll(); closeForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => obligationApi.deleteObligation(id),
    onSuccess: () => { invalidateAll(); setDeleteTarget(null); },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }) => obligationApi.updateObligation(id, { status: 'completed' }),
    onSuccess: () => invalidateAll(),
  });

  function resetForm() { setForm({ contractId: '', title: '', type: 'deliverable', dueDate: '' }); }
  function closeForm() { setShowForm(false); setEditingId(null); resetForm(); }

  function openCreate() { resetForm(); setEditingId(null); setShowForm(true); }
  function openEdit(o) {
    setEditingId(o._id);
    setForm({
      contractId: o.contractId?._id || o.contractId || '',
      title: o.title,
      type: o.type,
      dueDate: o.dueDate?.slice(0, 10) || '',
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.contractId || !form.title || !form.dueDate) return;
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="obligations-page">
      <div className="page-header">
        <h1 className="page-title">Obligations</h1>
        {canManage && <button className="btn btn-primary" onClick={openCreate}>New obligation</button>}
      </div>

      {stats && (
        <div className="obligation-stats-row">
          <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
          <div className="stat-card stat-card--pending"><span className="stat-value">{stats.pending}</span><span className="stat-label">Pending</span></div>
          <div className="stat-card stat-card--overdue"><span className="stat-value">{stats.overdue}</span><span className="stat-label">Overdue</span></div>
          <div className="stat-card stat-card--completed"><span className="stat-value">{stats.completed}</span><span className="stat-label">Completed</span></div>
          <div className="stat-card stat-card--upcoming"><span className="stat-value">{stats.upcoming30Days}</span><span className="stat-label">Due in 30 days</span></div>
        </div>
      )}

      <div className="filters-bar">
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
        <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All types</option>
          {OBLIGATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingId ? 'Edit Obligation' : 'New Obligation'}</h3>
            <div className="form-group">
              <label>Contract</label>
              <select className="form-select" value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })} disabled={!!editingId}>
                <option value="">Select contract</option>
                {contracts.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 deliverable payment" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {OBLIGATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.contractId || !form.title || !form.dueDate || isSaving}>
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Obligation</h3>
            <p style={{ color: 'var(--ink-secondary)', marginBottom: 20 }}>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background: '#B3261E' }}
                onClick={() => deleteMutation.mutate(deleteTarget._id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="contract-table-wrapper">
        <table className="contract-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Contract</th>
              <th>Type</th>
              <th>Due date</th>
              <th>Status</th>
              {canManage && <th style={{ width: 160 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={canManage ? 6 : 5} className="empty-cell">Loading...</td></tr>}
            {error && !isLoading && <tr><td colSpan={canManage ? 6 : 5} className="empty-cell" style={{ color: '#B3261E' }}>Failed to load obligations. Please try again.</td></tr>}
            {!isLoading && !error && obligations.length === 0 && <tr><td colSpan={canManage ? 6 : 5} className="empty-cell">No obligations yet.</td></tr>}
            {obligations.map((o) => {
              const days = daysUntil(o.dueDate);
              const isOverdue = o.status === 'pending' && days < 0;
              return (
                <tr key={o._id} className={isOverdue ? 'row-overdue' : ''}>
                  <td className="contract-title-cell">{o.title}</td>
                  <td>{o.contractId?.title || '—'}</td>
                  <td>
                    <span className="obligation-type-badge" style={{ backgroundColor: TYPE_COLORS[o.type] || '#9AA1AC' }}>
                      {OBLIGATION_TYPES.find((t) => t.value === o.type)?.label || o.type}
                    </span>
                  </td>
                  <td>
                    <span className={`due-date ${isOverdue ? 'due-date--overdue' : ''}`}>
                      {new Date(o.dueDate).toLocaleDateString()}
                      {o.status === 'pending' && (
                        <span className="days-label">
                          {days === 0 ? 'Today' : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`status-label status-${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span>
                  </td>
                  {canManage && (
                    <td className="actions-cell">
                      {o.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success" onClick={() => completeMutation.mutate({ id: o._id })}>Complete</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => openEdit(o)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(o)}>Delete</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ObligationsPage;
