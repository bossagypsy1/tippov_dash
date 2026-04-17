// Auth API client — all requests go through /api/auth-proxy to avoid CORS.
// App ID is fixed for the TIP·POV application in the IAM system.

const AUTH_BASE = "/api/auth-proxy";
export const TIPPOV_APP_ID = "app_2e05551ed2f14c129c48c0d0520e49bc";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: string;
}

/** An IAM organisation the user is a member of.
 *  NOTE: "organisation" here is an IAM concept and may exist at any level.
 *  The one whose id matches an incident's iamOrganizationId is the Tenant. */
export interface IamOrganization {
  id: string;
  name: string;
  type: number;       // 1 = root, 2 = branch, 3 = leaf — approximate
  typeName: string;
  parentOrganizationId?: string | null;
  parentOrganizationName?: string | null;
  isActive: boolean;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(`${AUTH_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, applicationId: TIPPOV_APP_ID }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? data.error ?? "Login failed");
  }
  return { token: data.token, user: data.user };
}

export async function getUserOrganizations(
  userId: string,
  token: string
): Promise<IamOrganization[]> {
  const res = await fetch(`${AUTH_BASE}/users/${userId}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  // API may return plain array or { success, data: [...] } wrapper
  return Array.isArray(data) ? data : (data.data ?? []);
}
