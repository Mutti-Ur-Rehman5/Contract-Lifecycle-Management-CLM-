import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../features/notifications/notificationApi.js';
import getSocket from '../../lib/socketClient.js';
import '../../styles/components/notification-bell.css';

const STAGE_COLORS = {
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

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const { data: unreadData } = useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: () => notificationApi.getUnreadCount().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(30).then((r) => r.data.data),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    const socket = getSocket();
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    socket.on('chat:unread:update', handler);
    return () => {
      socket.off('notification:new', handler);
      socket.off('chat:unread:update', handler);
    };
  }, [queryClient]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = unreadData?.count || 0;

  const handleClick = (notif) => {
    markReadMutation.mutate(notif._id);
    setOpen(false);
    if (notif.relatedContractId?._id) {
      navigate(`/contracts/${notif.relatedContractId._id}`);
    }
  };

  return (
    <div className="notification-bell-wrap" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={() => setOpen(!open)} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all"
                onClick={() => markAllReadMutation.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-dropdown-list">
            {(!notifications || notifications.length === 0) && (
              <div className="notification-empty">No notifications yet.</div>
            )}
            {notifications?.map((notif) => {
              const contractStatus = notif.relatedContractId?.status;
              const dotColor = STAGE_COLORS[contractStatus] || '#9AA1AC';
              return (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleClick(notif)}
                >
                  <div className="notification-dot" style={{ backgroundColor: dotColor }} />
                  <div className="notification-content">
                    <div className="notification-item-title">{notif.title}</div>
                    <div className="notification-item-message">{notif.message}</div>
                    <div className="notification-item-time">{timeAgo(notif.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
