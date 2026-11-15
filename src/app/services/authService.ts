export function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes((init.method || 'GET').toUpperCase())) {
    const token = document.cookie.split('; ').find(value => value.startsWith('csrftoken='))?.slice(10);
    if (token) headers.set('X-CSRFToken', decodeURIComponent(token));
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}

export async function loginAccount(username: string, password: string, role: string) {
  const session = await authFetch('/api/auth/session', { cache: 'no-store' });
  if (!session.ok) throw new Error('The login service is unavailable. Please try again.');
  const response = await authFetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || result.detail || 'Login failed. Please try again.');
  return result.account as { id: string; role: string; name: string };
}

export async function logoutAccount() {
  const response = await authFetch('/api/auth/logout', { method: 'POST' });
  if (response.ok) return;
  if (response.status === 403) {
    const session = await authFetch('/api/auth/session', { cache: 'no-store' });
    if (session.ok && !(await session.json()).authenticated) return;
  }
  throw new Error('Logout failed. Please try again.');
}
