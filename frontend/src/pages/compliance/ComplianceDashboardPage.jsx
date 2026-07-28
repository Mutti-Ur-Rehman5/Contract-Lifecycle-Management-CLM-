import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { complianceApi } from '../../features/compliance/complianceApi.js';
import '../../styles/pages/compliance-dashboard.css';

function riskColor(level) {
  const colors = { critical: '#B3261E', high: '#C68A2E', medium: '#7C8BC4', low: '#2E7D4F' };
  return colors[level] || '#9AA1AC';
}

function riskScoreColor(score) {
  if (score >= 70) return '#B3261E';
  if (score >= 40) return '#C68A2E';
  return '#2E7D4F';
}

function ComplianceDashboardPage() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn: () => complianceApi.getDashboard().then((r) => r.data.data),
  });

  const { data: riskContracts = [] } = useQuery({
    queryKey: ['risk-contracts'],
    queryFn: () => complianceApi.getRiskContracts().then((r) => r.data.data),
  });

  if (isLoading) return <div className="loading-msg">Loading compliance data...</div>;
  if (error) return <div className="loading-msg" style={{ color: '#B3261E' }}>Failed to load compliance data. Please try again.</div>;
  if (!dashboard) return <div className="loading-msg">No data available.</div>;

  const { summary, expiringIn30, overdueObligations, upcomingObligations, pendingApprovals, pendingSignatures, riskBreakdown } = dashboard;

  return (
    <div className="compliance-page">
      <div className="page-header">
        <h1 className="page-title">Compliance Dashboard</h1>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-value">{summary.activeContracts}</span>
          <span className="summary-label">Active contracts</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{summary.draftContracts}</span>
          <span className="summary-label">Drafts</span>
        </div>
        <div className="summary-card summary-card--overdue">
          <span className="summary-value">{summary.overdueObligations}</span>
          <span className="summary-label">Overdue obligations</span>
        </div>
        <div className="summary-card summary-card--pending">
          <span className="summary-value">{summary.pendingApprovals}</span>
          <span className="summary-label">Pending approvals</span>
        </div>
        <div className="summary-card summary-card--sig">
          <span className="summary-value">{summary.pendingSignatureCount}</span>
          <span className="summary-label">Awaiting signatures</span>
        </div>
        <div className="summary-card summary-card--score">
          <span className="summary-value" style={{ color: riskScoreColor(summary.riskScore) }}>
            {summary.riskScore}%
          </span>
          <span className="summary-label">Risk score</span>
        </div>
      </div>

      <div className="widgets-grid">
        <div className="widget widget--expiring">
          <div className="widget-header">
            <h3 className="widget-title">Expiring in 30 days</h3>
            <span className="widget-badge">{expiringIn30.length}</span>
          </div>
          <div className="widget-body">
            {expiringIn30.length === 0 && <p className="empty-msg">No contracts expiring soon.</p>}
            {expiringIn30.map((c) => (
              <div
                key={c._id}
                className="widget-item clickable"
                onClick={() => navigate(`/contracts/${c._id}`)}
              >
                <div className="widget-item-main">
                  <span className="widget-item-title">{c.title}</span>
                  <span className="widget-item-sub">{c.ownerName}</span>
                </div>
                <span className="widget-item-date">
                  {new Date(c.endDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="widget widget--overdue">
          <div className="widget-header">
            <h3 className="widget-title">Overdue obligations</h3>
            <span className="widget-badge widget-badge--red">{overdueObligations.length}</span>
          </div>
          <div className="widget-body">
            {overdueObligations.length === 0 && <p className="empty-msg">No overdue obligations.</p>}
            {overdueObligations.map((o) => (
              <div key={o._id} className="widget-item">
                <div className="widget-item-main">
                  <span className="widget-item-title">{o.title}</span>
                  <span className="widget-item-sub">{o.type?.replace('_', ' ')}</span>
                </div>
                <span className="widget-item-date overdue-date">
                  {new Date(o.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="widget widget--approvals">
          <div className="widget-header">
            <h3 className="widget-title">Upcoming obligations</h3>
            <span className="widget-badge">{(upcomingObligations || []).length}</span>
          </div>
          <div className="widget-body">
            {(!upcomingObligations || upcomingObligations.length === 0) && <p className="empty-msg">No upcoming obligations.</p>}
            {(upcomingObligations || []).map((o) => (
              <div key={o._id} className="widget-item">
                <div className="widget-item-main">
                  <span className="widget-item-title">{o.title}</span>
                  <span className="widget-item-sub">{o.type?.replace('_', ' ')}</span>
                </div>
                <span className="widget-item-date">
                  {new Date(o.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="widget widget--approvals">
          <div className="widget-header">
            <h3 className="widget-title">Pending approvals</h3>
            <span className="widget-badge">{pendingApprovals.length}</span>
          </div>
          <div className="widget-body">
            {pendingApprovals.length === 0 && <p className="empty-msg">No pending approvals.</p>}
            {pendingApprovals.map((a) => (
              <div key={a._id} className="widget-item">
                <div className="widget-item-main">
                  <span className="widget-item-title">{a.contractTitle}</span>
                  <span className="widget-item-sub">Stage: {a.currentStage?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget widget--signatures">
          <div className="widget-header">
            <h3 className="widget-title">Awaiting signatures</h3>
            <span className="widget-badge">{pendingSignatures.length}</span>
          </div>
          <div className="widget-body">
            {pendingSignatures.length === 0 && <p className="empty-msg">No signatures pending.</p>}
            {pendingSignatures.map((s) => (
              <div key={s._id} className="widget-item">
                <div className="widget-item-main">
                  <span className="widget-item-title">{s.contractTitle}</span>
                  <span className="widget-item-sub">{s.signatoryName} ({s.signatoryEmail})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="widget widget--risk-breakdown">
          <div className="widget-header">
            <h3 className="widget-title">Risk breakdown</h3>
          </div>
          <div className="widget-body risk-bars">
            <div className="risk-row">
              <span className="risk-label">High risk</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-fill risk-bar--high"
                  style={{ width: `${Math.min((riskBreakdown.high / Math.max(summary.totalContracts, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="risk-count">{riskBreakdown.high}</span>
            </div>
            <div className="risk-row">
              <span className="risk-label">Medium risk</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-fill risk-bar--medium"
                  style={{ width: `${Math.min((riskBreakdown.medium / Math.max(summary.totalContracts, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="risk-count">{riskBreakdown.medium}</span>
            </div>
            <div className="risk-row">
              <span className="risk-label">Low risk</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-fill risk-bar--low"
                  style={{ width: `${Math.min((riskBreakdown.low / Math.max(summary.totalContracts, 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="risk-count">{riskBreakdown.low}</span>
            </div>
          </div>
        </div>

        <div className="widget widget--risk-contracts">
          <div className="widget-header">
            <h3 className="widget-title">Contracts by risk</h3>
          </div>
          <div className="widget-body">
            {riskContracts.length === 0 && <p className="empty-msg">No contracts.</p>}
            {riskContracts.slice(0, 10).map((c) => (
              <div
                key={c._id}
                className="widget-item clickable"
                onClick={() => navigate(`/contracts/${c._id}`)}
              >
                <div className="widget-item-main">
                  <span className="widget-item-title">{c.title}</span>
                  <span className="widget-item-sub">{c.type} · {c.ownerName}</span>
                </div>
                <div className="risk-tag-wrapper">
                  <span
                    className="risk-tag"
                    style={{ backgroundColor: riskColor(c.riskLevel) }}
                  >
                    {c.riskLevel}
                  </span>
                  <span className="widget-item-date">
                    {c.daysUntilEnd < 0 ? `${Math.abs(c.daysUntilEnd)}d expired` : `${c.daysUntilEnd}d left`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceDashboardPage;
