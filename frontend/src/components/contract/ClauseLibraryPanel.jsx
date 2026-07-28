import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../features/contracts/contractApi.js';
import '../../styles/components/panel.css';

function ClauseLibraryPanel({ onInsertClause }) {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: clauses } = useQuery({
    queryKey: ['clauses', category],
    queryFn: () => contractApi.getClauses(category || undefined).then((r) => r.data.data),
  });

  const filtered = (clauses || []).filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel">
      <h3 className="panel-title">Clause Library</h3>
      <input
        className="panel-search"
        placeholder="Search clauses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select className="panel-select" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All categories</option>
        {[...new Set((clauses || []).map((c) => c.category).filter(Boolean))].map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="panel-list">
        {filtered.length === 0 && <p className="panel-empty">No clauses found.</p>}
        {filtered.map((clause) => (
          <div key={clause._id} className="panel-item">
            <div className="panel-item-header">
              <span className="panel-item-title">{clause.title}</span>
              {clause.category && <span className="panel-item-badge">{clause.category}</span>}
            </div>
            <p className="panel-item-preview">{clause.content?.replace(/<[^>]+>/g, '').slice(0, 120)}...</p>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onInsertClause(clause.content, clause.title)}
            >
              Insert clause
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClauseLibraryPanel;
