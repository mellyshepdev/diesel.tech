// Keycloak OIDC auth for the mechanic career ladder (coins/level/owned
// tools) — same PKCE authorization-code pattern as
// main-website/public/js/keycloak-auth.js, adapted for a single-page app:
// no separate callback.html, the code exchange happens inline on whatever
// page the redirect lands back on, then the URL is cleaned up in place.

const KC_BASE = 'https://bsco-keycloak.fly.dev';
const KC_REALM = 'blacksheep';
const KC_CLIENT_ID = 'diesel-tech-frontend';
// Registered redirect is the app's own origin+path — matches in both local
// dev (http://localhost:5173/*, already whitelisted on the Keycloak client)
// and the deployed GitLab Pages URL once that's added to the client too.
const KC_REDIRECT_URI = `${window.location.origin}${window.location.pathname}`;

const KC_AUTH_URL = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/auth`;
const KC_TOKEN_URL = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/token`;
const KC_LOGOUT_URL = `${KC_BASE}/realms/${KC_REALM}/protocol/openid-connect/logout`;

function base64url(buf: Uint8Array) {
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generatePKCE() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(hash));
  return { verifier, challenge };
}

/** Redirects to Keycloak; comes back to this same page with `?code=&state=`. */
export async function kcLogin() {
  const { verifier, challenge } = await generatePKCE();
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem('kc_pkce_verifier', verifier);
  sessionStorage.setItem('kc_oauth_state', state);

  const params = new URLSearchParams({
    client_id: KC_CLIENT_ID,
    redirect_uri: KC_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  window.location.href = `${KC_AUTH_URL}?${params}`;
}

export function kcLogout() {
  const idToken = sessionStorage.getItem('kc_id_token');
  sessionStorage.removeItem('kc_access_token');
  sessionStorage.removeItem('kc_refresh_token');
  sessionStorage.removeItem('kc_id_token');
  const params = new URLSearchParams({
    client_id: KC_CLIENT_ID,
    post_logout_redirect_uri: `${window.location.origin}${window.location.pathname}`,
  });
  if (idToken) params.set('id_token_hint', idToken);
  window.location.href = `${KC_LOGOUT_URL}?${params}`;
}

/** Call once on app mount. If the URL carries a fresh `?code=`, exchanges it
 *  for tokens and strips the query params back off via history.replaceState
 *  (no separate callback route to redirect through). Returns true if a login
 *  round-trip was just completed, so the caller can trigger a progress fetch. */
export async function kcHandleRedirect(): Promise<boolean> {
  const qs = new URLSearchParams(window.location.search);
  const code = qs.get('code');
  const state = qs.get('state');
  if (!code || !state) return false;

  const cleanUrl = () => {
    qs.delete('code'); qs.delete('state'); qs.delete('session_state'); qs.delete('iss');
    const q = qs.toString();
    window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
  };

  const verifier = sessionStorage.getItem('kc_pkce_verifier');
  const expectedState = sessionStorage.getItem('kc_oauth_state');
  if (!verifier || state !== expectedState) { cleanUrl(); return false; }

  const res = await fetch(KC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KC_CLIENT_ID,
      redirect_uri: KC_REDIRECT_URI,
      code,
      code_verifier: verifier,
    }),
  });
  sessionStorage.removeItem('kc_pkce_verifier');
  sessionStorage.removeItem('kc_oauth_state');
  cleanUrl();
  if (!res.ok) return false;

  const tokens = await res.json();
  sessionStorage.setItem('kc_access_token', tokens.access_token);
  sessionStorage.setItem('kc_refresh_token', tokens.refresh_token || '');
  sessionStorage.setItem('kc_id_token', tokens.id_token || '');
  return true;
}

async function kcRefresh(): Promise<boolean> {
  const refreshToken = sessionStorage.getItem('kc_refresh_token');
  if (!refreshToken) return false;
  const res = await fetch(KC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', client_id: KC_CLIENT_ID, refresh_token: refreshToken }),
  });
  if (!res.ok) {
    sessionStorage.removeItem('kc_access_token');
    sessionStorage.removeItem('kc_refresh_token');
    sessionStorage.removeItem('kc_id_token');
    return false;
  }
  const tokens = await res.json();
  sessionStorage.setItem('kc_access_token', tokens.access_token);
  sessionStorage.setItem('kc_refresh_token', tokens.refresh_token || refreshToken);
  return true;
}

export function kcIsLoggedIn(): boolean {
  return !!sessionStorage.getItem('kc_access_token');
}

/** Decoded from the access token locally — no network call, just for display. */
export function kcCurrentUser(): { name: string; sub: string } | null {
  const token = sessionStorage.getItem('kc_access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { name: payload.preferred_username || payload.name || payload.email || 'mechanic', sub: payload.sub };
  } catch { return null; }
}

/** Authenticated fetch to the diesel-tech-backend API — retries once after a
 *  token refresh on 401, matching kcRefresh's pattern from main-website. */
export async function kcApiFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!apiBase) throw new Error('VITE_API_BASE_URL not configured');
  const doFetch = () => fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${sessionStorage.getItem('kc_access_token') || ''}` },
  });
  let res = await doFetch();
  if (res.status === 401 && await kcRefresh()) res = await doFetch();
  return res;
}
