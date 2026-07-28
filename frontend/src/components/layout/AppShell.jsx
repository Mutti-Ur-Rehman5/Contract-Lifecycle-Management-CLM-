import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useSocket } from '../../hooks/useSocket.js';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import '../../styles/layout/app-shell.css';

function AppShell() {
  const { user } = useAuth();
  useSocket(user?._id);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
