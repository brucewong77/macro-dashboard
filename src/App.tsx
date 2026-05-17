import { useState, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { isAuthenticated, clearAuth } from './utils/auth';

function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated);

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setLoggedIn(false);
    window.location.reload();
  }, []);

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div style={{ textAlign: 'right', padding: '12px 16px 0', maxWidth: 1200, margin: '0 auto' }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 14px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #d9d9d9',
            background: '#fff',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          退出登录
        </button>
      </div>
      <Dashboard />
    </div>
  );
}

export default App;
