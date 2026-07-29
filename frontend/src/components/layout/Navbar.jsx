import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import NotificationBell from '../notifications/NotificationBell.jsx';
import '../../styles/layout/navbar.css';

function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (n) => {
    if (!n) return '?';
    return n.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-hamburger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <span />
          <span />
          <span />
        </button>
        <span className="navbar-page-title">Dashboard</span>
      </div>
      <div className="navbar-right">
        <NotificationBell />
        <div
          className="navbar-user"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="View profile"
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user?.name}
              className="navbar-avatar"
            />
          ) : (
            <span className="navbar-avatar navbar-avatar--initials">
              {getInitials(user?.name)}
            </span>
          )}
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || 'User'}</span>
            <span className="navbar-user-role">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
