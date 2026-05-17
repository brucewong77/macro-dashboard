import { useState } from 'react';
import { verifyLogin, saveAuth } from '../utils/auth';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    // 模拟一点延迟，防止暴力破解
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (verifyLogin(username.trim(), password.trim())) {
      saveAuth({ username: username.trim(), loginAt: Date.now() });
      onLogin();
    } else {
      setError('用户名或密码错误');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>📊</div>
          <h1 style={styles.title}>宏观经济数据看板</h1>
          <p style={styles.subtitle}>请登录以继续访问</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              style={styles.input}
              autoFocus
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div style={styles.hint}>
          默认账号: admin / macro2024
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f7fa',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: '#1f1f1f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  },
  input: {
    padding: '10px 14px',
    fontSize: 15,
    borderRadius: 8,
    border: '1px solid #d9d9d9',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fafafa',
  },
  error: {
    padding: '10px 12px',
    borderRadius: 6,
    background: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#cf1322',
    fontSize: 13,
  },
  button: {
    padding: '12px',
    fontSize: 15,
    fontWeight: 500,
    borderRadius: 8,
    border: 'none',
    background: '#1890ff',
    color: '#fff',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: 4,
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#bbb',
  },
};
