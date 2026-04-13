// ─── Reference Types ───────────────────────────────────────────────────────

export interface IncidentType {
  id: number;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

export interface StatusType {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Incident ──────────────────────────────────────────────────────────────

export interface Incident {
  id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
  photoFileName: string | null;
  photoContentType: string | null;
  photoSizeBytes: number | null;
  incidentTypeId: number | null;
  statusTypeId: number | null;
  iamOrganizationId: string | null;
  reportedByIamUserId: string | null;
  reportedByName: string | null;
  reportedByEmail: string | null;
  incidentType: IncidentType | null;
  statusType: StatusType | null;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  incidentTypeId?: number;
  statusTypeId?: number;
  iamOrganizationId?: string;
}

export interface UpdateIncidentPayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  incidentTypeId?: number;
  statusTypeId?: number;
}

export interface UpdateIncidentStatusPayload {
  statusTypeId: number;
}

// ─── Location Query ─────────────────────────────────────────────────────────

export interface LocationQuery {
  lat: number;
  lng: number;
  radius?: number;
}

// ─── Photo ──────────────────────────────────────────────────────────────────

export interface PhotoUrlResponse {
  photoUrl: string;   // actual field name returned by the API
  expiresAt: string;
  incidentId: number;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  [key: string]: unknown;
}

// ─── API Error ──────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  message: string;
}
