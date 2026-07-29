import { NavLink } from 'react-router-dom';
import '../../styles/layout/sidebar.css';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Contracts', path: '/contracts' },
  { label: 'Chat', path: '/chat' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Compliance', path: '/compliance' },
  { label: 'Obligations', path: '/obligations' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Profile', path: '/profile' },
  { label: 'Settings', path: '/settings' },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay${isOpen ? ' visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand-link" onClick={onClose}>
            <h2 className="sidebar-brand">CLM</h2>
            <span className="sidebar-brand-sub">Enterprise</span>
          </NavLink>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
