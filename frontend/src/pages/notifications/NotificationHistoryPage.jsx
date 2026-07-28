import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../features/notifications/notificationApi.js';
import '../../styles/pages/notification-history.css';

const TYPE_ICONS = {
  contract_expiring: '⏰',
  contract_expired: '⚠',
  workflow_approved: '✓',
  workflow_rejected: '✗',
  workflow_changes_requested: '↻',
  workflow_completed: '✓',
  signature_requested: '✍',
  signature_signed: '✓',
  signature_declined: '✗',
  default: '•',
};

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationHistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['notificationHistory', page],
    queryFn: () => notificationApi.getNotifications(pageSize, page * pageSize).then((r) => r.data.data),
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
  });

  const notifications = result || [];
  const unreadCount = unreadData?.count || 0;

  const handleClick = (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }
    if (notif.relatedContractId?._id) {
      navigate(`/contracts/${notif.relatedContractId._id}`);
    }
  };

  if (error) {
    return (
      <div className="notification-history-page">
        <div className="page-header">
          <h1 className="page-title">Notification History</h1>
        </div>
        <div className="nh-error">
          <p>Failed to load notifications. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-history-page">
      <div className="page-header">
        <h1 className="page-title">Notification History</h1>
        <div className="nh-actions">
          {unreadCount > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="nh-loading">
          <div className="skeleton-block" style={{ height: 48, marginBottom: 8 }} />
          <div className="skeleton-block" style={{ height: 48, marginBottom: 8 }} />
          <div className="skeleton-block" style={{ height: 48, marginBottom: 8 }} />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="nh-empty">
          <div className="nh-empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You'll see contract approvals, signature requests, and compliance alerts here.</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="nh-list">
          {notifications.map((notif) => {
            const icon = TYPE_ICONS[notif.type] || TYPE_ICONS.default;
            return (
              <div
                key={notif._id}
                className={`nh-item ${!notif.isRead ? 'nh-item--unread' : ''}`}
                onClick={() => handleClick(notif)}
              >
                <div className="nh-item-icon">{icon}</div>
                <div className="nh-item-body">
                  <div className="nh-item-header">
                    <span className="nh-item-title">{notif.title}</span>
                    {!notif.isRead && <span className="nh-item-dot" />}
                  </div>
                  <p className="nh-item-message">{notif.message}</p>
                  <span className="nh-item-time">{timeAgo(notif.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && notifications.length >= pageSize && (
        <div className="nh-pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="nh-page-label">Page {page + 1}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={notifications.length < pageSize}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationHistoryPage;
