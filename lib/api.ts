import type {
  Incident,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  UpdateIncidentStatusPayload,
  IncidentType,
  StatusType,
  LocationQuery,
  PhotoUrlResponse,
  UserProfile,
} from "./types";

// All browser requests go through the local Next.js proxy at /api/proxy
// to avoid CORS issues with the external API.
// The proxy route (app/api/proxy/[...path]/route.ts) forwards them server-side.
const BASE_URL = "/api/proxy";

// ─── Module-level auth token ─────────────────────────────────────────────────
// Set by auth-context after login so all API calls are automatically authenticated.

let _authToken: string | null = null;
export function setAuthToken(token: string | null) {
  _authToken = token;
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const t = token ?? _authToken;
  if (t) headers["Authorization"] = `Bearer ${t}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      // non-JSON error body — keep statusText
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── PascalCase → camelCase normalizers ─────────────────────────────────────
//
// The live API returns PascalCase field names (e.g. Id, Title, CreatedAt) even
// though the Swagger spec documents camelCase. These normalizers translate
// every raw response into the typed shapes our UI expects.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function normalizeIncidentType(raw: Raw): IncidentType {
  return {
    id:          raw.Id          ?? raw.id,
    name:        raw.Name        ?? raw.name,
    description: raw.Description ?? raw.description,
    icon:        raw.Icon        ?? raw.icon,
    isActive:    raw.IsActive    ?? raw.isActive,
    sortOrder:   raw.SortOrder   ?? raw.sortOrder,
  };
}

function normalizeStatusType(raw: Raw): StatusType {
  return {
    id:          raw.Id          ?? raw.id,
    name:        raw.Name        ?? raw.name,
    description: raw.Description ?? raw.description,
    color:       raw.Color       ?? raw.color,
    icon:        raw.Icon        ?? raw.icon,
    isActive:    raw.IsActive    ?? raw.isActive,
    sortOrder:   raw.SortOrder   ?? raw.sortOrder,
  };
}

function normalizeIncident(raw: Raw): Incident {
  return {
    id:                  raw.Id                  ?? raw.id,
    title:               raw.Title               ?? raw.title,
    description:         raw.Description         ?? raw.description,
    latitude:            raw.Latitude            ?? raw.latitude,
    longitude:           raw.Longitude           ?? raw.longitude,
    createdAt:           raw.CreatedAt           ?? raw.createdAt,
    updatedAt:           raw.UpdatedAt           ?? raw.updatedAt           ?? null,
    photoUrl:            raw.PhotoUrl            ?? raw.photoUrl            ?? null,
    photoFileName:       raw.PhotoFileName       ?? raw.photoFileName       ?? null,
    photoContentType:    raw.PhotoContentType    ?? raw.photoContentType    ?? null,
    photoSizeBytes:      raw.PhotoSizeBytes      ?? raw.photoSizeBytes      ?? null,
    incidentTypeId:      raw.IncidentTypeId      ?? raw.incidentTypeId      ?? null,
    statusTypeId:        raw.StatusTypeId        ?? raw.statusTypeId        ?? null,
    iamOrganizationId:   raw.IamOrganizationId   ?? raw.iamOrganizationId   ?? null,
    reportedByIamUserId: raw.ReportedByIamUserId ?? raw.reportedByIamUserId ?? null,
    reportedByName:      raw.ReportedByName      ?? raw.reportedByName      ?? null,
    reportedByEmail:     raw.ReportedByEmail      ?? raw.reportedByEmail     ?? null,
    incidentType:
      raw.IncidentType ?? raw.incidentType
        ? normalizeIncidentType(raw.IncidentType ?? raw.incidentType)
        : null,
    statusType:
      raw.StatusType ?? raw.statusType
        ? normalizeStatusType(raw.StatusType ?? raw.statusType)
        : null,
  };
}

// ─── Incidents ───────────────────────────────────────────────────────────────

export async function getAllIncidents(token?: string): Promise<Incident[]> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    headers: getAuthHeaders(token),
  });
  const raw = await handleResponse<Raw[]>(res);
  return raw.map(normalizeIncident);
}

export async function getIncidentById(id: number, token?: string): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`, {
    headers: getAuthHeaders(token),
  });
  const raw = await handleResponse<Raw>(res);
  return normalizeIncident(raw);
}

export async function getIncidentsByLocation(
  query: LocationQuery,
  token?: string
): Promise<Incident[]> {
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    ...(query.radius !== undefined && { radius: String(query.radius) }),
  });
  const res = await fetch(`${BASE_URL}/incidents/location?${params}`, {
    headers: getAuthHeaders(token),
  });
  const raw = await handleResponse<Raw[]>(res);
  return raw.map(normalizeIncident);
}

export async function createIncident(
  payload: CreateIncidentPayload,
  token?: string
): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  const raw = await handleResponse<Raw>(res);
  return normalizeIncident(raw);
}

export async function updateIncident(
  id: number,
  payload: UpdateIncidentPayload,
  token?: string
): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  const raw = await handleResponse<Raw>(res);
  return normalizeIncident(raw);
}

export async function updateIncidentStatus(
  id: number,
  payload: UpdateIncidentStatusPayload,
  token?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/incidents/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<void>(res);
}

export async function deleteIncident(id: number, token?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  return handleResponse<void>(res);
}

// ─── Incident Types ──────────────────────────────────────────────────────────

export async function getIncidentTypes(token?: string): Promise<IncidentType[]> {
  const res = await fetch(`${BASE_URL}/incident-types`, {
    headers: getAuthHeaders(token),
  });
  const raw = await handleResponse<Raw[]>(res);
  return raw.map(normalizeIncidentType);
}

// ─── Status Types ────────────────────────────────────────────────────────────

export async function getStatusTypes(token?: string): Promise<StatusType[]> {
  const res = await fetch(`${BASE_URL}/status-types`, {
    headers: getAuthHeaders(token),
  });
  const raw = await handleResponse<Raw[]>(res);
  return raw.map(normalizeStatusType);
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export async function uploadIncidentPhoto(
  incidentId: number,
  file: File,
  token?: string
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": file.type || "application/octet-stream",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const buffer = await file.arrayBuffer();
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/photo`, {
    method: "POST",
    headers,
    body: buffer,
  });
  return handleResponse<void>(res);
}

export async function deleteIncidentPhoto(incidentId: number, token?: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/photo`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  return handleResponse<void>(res);
}

export async function getIncidentPhotoUrl(
  incidentId: number,
  token?: string
): Promise<PhotoUrlResponse> {
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/photo/url`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse<PhotoUrlResponse>(res);
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/user/profile`, {
    headers: getAuthHeaders(token),
  });
  return handleResponse<UserProfile>(res);
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function ping(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${BASE_URL}/ping`);
  return handleResponse<{ status: string; timestamp: string }>(res);
}
