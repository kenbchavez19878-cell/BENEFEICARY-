const TAB_SESSION_KEY = "benefitrack_tab_session";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.href);
  const isLogin = /\/api\/auth\/login\/?$/.test(url.pathname);
  const sessionToken = sessionStorage.getItem(TAB_SESSION_KEY);
  if (url.origin === window.location.origin && sessionToken && !isLogin) {
    headers.set('X-Benefitrack-Session', sessionToken);
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())) {
    const token = document.cookie.split('; ').find(value => value.startsWith('csrftoken='))?.slice(10);
    if (token) headers.set('X-CSRFToken', decodeURIComponent(token));
  }
  const response = await fetch(input, { ...init, headers, credentials: 'same-origin' });
  if (response.status === 403 && sessionToken && url.origin === window.location.origin && !/\/api\/auth\/logout\/?$/.test(url.pathname)) {
    const error = await response.clone().json().catch(() => null);
    if (String(error?.detail || '').startsWith('Your tab session has expired.')) {
      sessionStorage.removeItem(TAB_SESSION_KEY);
      window.dispatchEvent(new Event('benefitrack:session-expired'));
    }
  }
  return response;
}

export async function loginAccount(username: string, password: string, role: string) {
  const session = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' });
  if (!session.ok) throw new Error('The login service is unavailable. Please try again.');
  const response = await authFetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.detail || 'Login failed. Please try again.');
  if (!result.sessionToken) throw new Error('The login service did not issue a tab session. Please try again.');
  sessionStorage.setItem(TAB_SESSION_KEY, result.sessionToken);
  return result.account as { id: string; role: string; name: string };
}

export async function logoutAccount() {
  const hadTabSession = Boolean(sessionStorage.getItem(TAB_SESSION_KEY));
  const response = await authFetch('/api/auth/logout', { method: 'POST' });
  if (response.ok) { sessionStorage.removeItem(TAB_SESSION_KEY); return; }
  if (response.status === 403) {
    const session = await authFetch('/api/auth/session', { cache: 'no-store' });
    if (session.ok && !(await session.json()).authenticated) { sessionStorage.removeItem(TAB_SESSION_KEY); return; }
    if (session.status === 403 && hadTabSession) { sessionStorage.removeItem(TAB_SESSION_KEY); return; }
  }
  throw new Error('Logout failed. Please try again.');
}
