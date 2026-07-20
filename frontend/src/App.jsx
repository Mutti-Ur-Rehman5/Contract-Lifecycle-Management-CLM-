import { Routes, Route } from 'react-router-dom';
import { useHealthCheck } from './hooks/useHealthCheck.js';

function App() {
  const status = useHealthCheck();

  const statusDisplay = {
    loading: { text: 'Checking API connection...', bg: '#EEECE5' },
    connected: { text: 'API Connected', bg: '#D4EDDA' },
    error: { text: 'API Not Connected', bg: '#F8D7DA' },
  };

  const { text, bg } = statusDisplay[status] || statusDisplay.loading;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '48px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', fontWeight: 600, color: '#1B2430' }}>
              CLM Platform
            </h1>
            <p style={{ color: '#5B6472', marginTop: '8px' }}>Enterprise Contract Lifecycle Management</p>
            <div
              id="api-status"
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                background: bg,
                borderRadius: '6px',
                display: 'inline-block',
                fontWeight: 500,
              }}
            >
              {text}
            </div>
          </div>
        }
      />
      <Route
        path="*"
        element={
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '48px', textAlign: 'center' }}>
            <h2 style={{ color: '#1B2430' }}>404 — Page Not Found</h2>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
