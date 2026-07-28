import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { dashboardApi } from '../../features/dashboard/dashboardApi.js';
import '../../styles/pages/dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboard().then((r) => r.data.data),
  });

  if (isLoading) return <div className="loading-msg">Loading dashboard...</div>;
  if (error) return <div className="loading-msg dashboard-error">Failed to load dashboard. Please try again.</div>;

  const { stats, recentActivity, organization } = data || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Active Contracts', value: stats?.activeContracts ?? 0, icon: '📄' },
    { label: 'Pending Your Action', value: stats?.pendingActions ?? 0, icon: '⏳' },
    { label: 'Expiring in 30 Days', value: stats?.expiring30 ?? 0, icon: '🔔' },
    { label: 'Published This Month', value: stats?.publishedThisMonth ?? 0, icon: '✅' },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">{greeting}, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="dashboard-org-name">{organization?.name || 'Your Organization'}</p>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <span className="stat-icon">{card.icon}</span>
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/contracts/new')}>
          + New Contract
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/compliance')}>
          View Compliance Dashboard
        </button>
      </div>

      <div className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
        {!recentActivity || recentActivity.length === 0 ? (
          <div className="empty-state">
            <p>No recent activity yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/contracts/new')}>
              + Create your first contract
            </button>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivity.map((item) => (
              <div key={item._id} className="activity-item">
                <span className="activity-user">{item.userName}</span>
                <span className="activity-action">{item.action.replace(/_/g, ' ')}</span>
                <span className="activity-entity">{item.entityType}</span>
                <span className="activity-time">{formatRelativeTime(item.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default DashboardPage;
