import { NavLink } from 'react-router-dom';
import '../../styles/layout/sidebar.css';

const navItems = [
  { label: 'Contracts', path: '/contracts', icon: '📄' },
  { label: 'Approvals', path: '/approvals', icon: '✓' },
  { label: 'Compliance', path: '/compliance', icon: '⚖' },
  { label: 'Obligations', path: '/obligations', icon: '📋' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-brand">CLM</h2>
        <span className="sidebar-brand-sub">Enterprise</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
