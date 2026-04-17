// Simple auth helpers — no context, no extra API calls.
// The JWT payload already contains the user's org IDs (including descendants).

const TOKEN_KEY = "tippov_token";
export const APP_ID = "app_2e05551ed2f14c129c48c0d0520e49bc";

// ─── JWT decode (client-side, no library needed) ──────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decodeJwt(token: string): Record<string, any> {
  try {
    const payload = token.split(".")[1];
    // base64url → base64 → JSON
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

/** Extract org IDs from the JWT payload.
 *  Tries PascalCase and camelCase variants since the IAM system uses PascalCase. */
export function getOrgIdsFromToken(token: string): string[] {
  const c = decodeJwt(token);
  const candidates = [
    "OrganizationIds", "organizationIds",
    "OrgIds", "orgIds",
    "Organizations", "organizations",
    "OrganizationId", "organizationId",
    "org_ids", "organization_ids",
  ];
  for (const key of candidates) {
    const v = c[key];
    if (Array.isArray(v) && v.length > 0) return v.map(String);
    if (typeof v === "string" && v.length > 0) return [v];
  }
  return [];
}

/** Pull a display name from the JWT (firstName + lastName, or email, or "User"). */
export function getUserFromToken(token: string): { name: string; email: string } {
  const c = decodeJwt(token);
  const first = (c.FirstName ?? c.firstName ?? c.given_name ?? "") as string;
  const last  = (c.LastName  ?? c.lastName  ?? c.family_name ?? "") as string;
  const name  = [first, last].filter(Boolean).join(" ")
    || (c.Name ?? c.name ?? c.Email ?? c.email ?? "User") as string;
  const email = (c.Email ?? c.email ?? c.sub ?? "") as string;
  return { name: String(name), email: String(email) };
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Login API call ───────────────────────────────────────────────────────────

async function doLoginRequest(email: string, password: string): Promise<Response> {
  return fetch("/api/auth-proxy/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, applicationId: APP_ID }),
  });
}

export async function loginRequest(
  email: string,
  password: string
): Promise<string> {
  let res = await doLoginRequest(email, password);

  // Azure Functions sometimes cold-start and return 500 on the first request.
  // Retry once automatically before surfacing the error.
  if (res.status === 500) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await doLoginRequest(email, password);
  }

  // Safely parse the body
  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${res.status}). Please try again.`);
  }

  // API returns PascalCase fields: Success, Token, User, Message, Error
  const token = (data.Token ?? data.token) as string | undefined;
  if (token) return token;

  const msg =
    ((data.Message ?? data.message) as string) ||
    ((data.Error ?? data.error) as string) ||
    (res.status === 500
      ? "The server encountered an error. Please try again in a moment."
      : `Login failed (HTTP ${res.status})`);
  throw new Error(msg);
}
