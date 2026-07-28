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

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand-link">
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
          >
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
