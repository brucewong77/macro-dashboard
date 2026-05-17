const AUTH_KEY = 'macro_dashboard_auth';

// 从环境变量获取密码，默认为 macro2024
const DEFAULT_PASSWORD = import.meta.env.VITE_LOGIN_PASSWORD || 'macro2024';
const DEFAULT_USERNAME = import.meta.env.VITE_LOGIN_USERNAME || 'admin';

export interface AuthInfo {
  username: string;
  loginAt: number;
}

/**
 * 验证用户名密码
 */
export function verifyLogin(username: string, password: string): boolean {
  return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
}

/**
 * 保存登录状态到 localStorage
 */
export function saveAuth(info: AuthInfo): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(info));
}

/**
 * 获取登录状态
 */
export function getAuth(): AuthInfo | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const info = JSON.parse(raw) as AuthInfo;
    // 登录有效期 7 天
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - info.loginAt > maxAge) {
      clearAuth();
      return null;
    }
    return info;
  } catch {
    return null;
  }
}

/**
 * 是否已登录
 */
export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

/**
 * 清除登录状态
 */
export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}
