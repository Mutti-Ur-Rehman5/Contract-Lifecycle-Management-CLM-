import { useAuth } from '../../hooks/useAuth.js';
import '../../styles/layout/navbar.css';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="navbar-page-title">Dashboard</span>
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <span className="navbar-user-name">{user?.name || 'User'}</span>
          <span className="navbar-user-role">{user?.role?.replace('_', ' ')}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
