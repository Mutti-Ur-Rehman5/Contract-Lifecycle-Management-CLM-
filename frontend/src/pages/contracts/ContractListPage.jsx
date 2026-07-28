import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { contractApi } from '../../features/contracts/contractApi.js';
import '../../styles/pages/contract-list.css';

const CONTRACT_TYPES = ['employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client'];
const CONTRACT_STATUSES = ['draft', 'internal_review', 'legal_review', 'finance_approval', 'executive_approval', 'pending_signature', 'published', 'archived', 'rejected'];

function StageDot({ status }) {
  const colorMap = {
    draft: '#9AA1AC',
    internal_review: '#7C8BC4',
    legal_review: '#8A5FBF',
    finance_approval: '#C68A2E',
    executive_approval: '#B5543A',
    pending_signature: '#1F5C4C',
    published: '#2E7D4F',
    archived: '#5B6472',
    rejected: '#B3261E',
  };
  const color = colorMap[status] || '#9AA1AC';
  return <span className="stage-dot" style={{ backgroundColor: color }} title={status.replace('_', ' ')} />;
}

function ContractListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreateContracts = user?.role === 'admin' || user?.role === 'drafter';
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['contracts', { type, status, search }],
    queryFn: () =>
      contractApi.getContracts({
        type: type || undefined,
        status: status || undefined,
        search: search || undefined,
        limit: 50,
      }).then((r) => r.data.data),
  });

  const contracts = result?.data || [];

  return (
    <div className="contract-list-page">
      <div className="page-header">
        <h1 className="page-title">Contract Repository</h1>
        {canCreateContracts && (
          <button className="btn btn-primary" onClick={() => navigate('/contracts/new')}>
            New contract
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {CONTRACT_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="contract-table-wrapper">
        <table className="contract-table">
          <thead>
            <tr>
              <th style={{ width: 20 }}></th>
              <th>Title</th>
              <th>Type</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="empty-cell">Loading...</td></tr>
            )}
            {error && !isLoading && (
              <tr><td colSpan={6} className="empty-cell" style={{ color: '#B3261E' }}>Failed to load contracts. Please try again.</td></tr>
            )}
            {!isLoading && !error && contracts.length === 0 && (
              <tr><td colSpan={6} className="empty-cell">No contracts yet. Create one from a template.</td></tr>
            )}
            {contracts.map((c) => (
              <tr key={c._id} className="contract-row" onClick={() => navigate(`/contracts/${c._id}`)}>
                <td><StageDot status={c.status} /></td>
                <td className="contract-title-cell">{c.title}</td>
                <td><span className="type-badge">{c.type?.replace('_', ' ')}</span></td>
                <td>{c.ownerId?.name || '—'}</td>
                <td>
                  <span className={`status-label status-${c.status}`}>
                    {c.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="date-cell">{new Date(c.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ContractListPage;
