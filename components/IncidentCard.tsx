"use client";

import type { Incident, StatusType } from "@/lib/types";
import {
  getIncidentTypeConfig,
  getStatusStyle,
  getStatusStyleLight,
  formatDate,
  formatCoords,
  formatReferenceId,
} from "@/lib/incident-utils";

// ─── Demo assignees (hardcoded until an assignees API endpoint is available) ──

const DEMO_ASSIGNEES = [
  "James Fletcher",
  "Sarah Thompson",
  "David Patel",
  "Emma Richardson",
  "Mark Holloway",
];

// ─── Shared sub-components ─────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-white font-medium flex-1">{value}</span>
    </div>
  );
}

function RowLight({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium flex-1">{value}</span>
    </div>
  );
}

// ─── Sidebar card (dark) ───────────────────────────────────────────────────

interface SidebarCardProps {
  incident: Incident;
  statusTypes: StatusType[];
  onClose: () => void;
  onStatusUpdate: (incidentId: number, statusTypeId: number) => void;
  onAssigneeUpdate: (incidentId: number, assignee: string) => void;
  photoUrl: string | null;
  isPhotoLoading: boolean;
}

export function SidebarIncidentCard({
  incident,
  statusTypes,
  onClose,
  onStatusUpdate,
  onAssigneeUpdate,
  photoUrl,
  isPhotoLoading,
}: SidebarCardProps) {
  const typeConfig = getIncidentTypeConfig(incident.incidentType?.name);
  const statusName = incident.statusType?.name ?? "";
  const statusStyle = getStatusStyle(statusName);

  return (
    <div className="border-t border-navy-600">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-white">Incident Details</h3>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Type + title */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: typeConfig.bgColor }}
            dangerouslySetInnerHTML={{ __html: typeConfig.svgIcon }}
          />
          <span className="text-white font-semibold text-base">{incident.title}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-xs">{formatCoords(incident.latitude, incident.longitude)}</span>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(incident.createdAt)}
        </div>

        {/* Photo */}
        <div className="rounded-lg overflow-hidden bg-navy-700 h-36 flex items-center justify-center">
          {isPhotoLoading ? (
            <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Incident photo"
              className="w-full h-full object-cover"
            />
          ) : incident.photoFileName ? (
            <div className="flex flex-col items-center gap-1 text-slate-500">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-xs">Loading photo…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-600">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-xs">No photo</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 w-24 flex-shrink-0">Status</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {incident.statusType?.name ?? "Unknown"}
          </span>
        </div>

        {/* Assign to — NOTE: no assignee field in current API; this is UI scaffolding */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 w-24 flex-shrink-0">Assign to</span>
          <div className="relative flex-1">
            <select
              defaultValue=""
              onChange={(e) => onAssigneeUpdate(incident.id, e.target.value)}
              className="w-full appearance-none bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              <option value="" disabled>Select assignee</option>
              {DEMO_ASSIGNEES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Tenant */}
        {incident.iamOrganizationId && (
          <Row label="Tenant" value={incident.iamOrganizationId} />
        )}

        {/* Reference ID */}
        <Row label="Reference ID" value={formatReferenceId(incident)} />

        {/* Update status */}
        <div className="pt-1 space-y-1.5">
          <label className="text-xs text-slate-400">Update Status</label>
          <div className="relative">
            <select
              value={incident.statusTypeId ?? ""}
              onChange={(e) => onStatusUpdate(incident.id, Number(e.target.value))}
              className="w-full appearance-none bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple cursor-pointer"
            >
              <option value="" disabled>Select status…</option>
              {statusTypes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* View Full Details */}
        <button className="w-full flex items-center justify-center gap-1.5 text-brand-purple hover:text-brand-purple-light text-sm font-medium py-1.5 transition-colors">
          View Full Details
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Map popup card (light) ────────────────────────────────────────────────

interface PopupCardProps {
  incident: Incident;
  statusTypes: StatusType[];
  onStatusUpdate: (incidentId: number, statusTypeId: number) => void;
  onAssigneeUpdate: (incidentId: number, assignee: string) => void;
  photoUrl: string | null;
  isPhotoLoading: boolean;
}

export function PopupIncidentCard({
  incident,
  statusTypes,
  onStatusUpdate,
  onAssigneeUpdate,
  photoUrl,
  isPhotoLoading,
}: PopupCardProps) {
  const typeConfig = getIncidentTypeConfig(incident.incidentType?.name);
  const statusName = incident.statusType?.name ?? "";
  const statusStyle = getStatusStyleLight(statusName);

  return (
    <div className="bg-white rounded-xl w-80 text-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-4 pb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: typeConfig.bgColor }}
          dangerouslySetInnerHTML={{ __html: typeConfig.svgIcon }}
        />
        <span className="font-semibold text-sm flex-1">{incident.title}</span>
      </div>

      {/* Location + date */}
      <div className="px-4 space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {formatCoords(incident.latitude, incident.longitude)}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {formatDate(incident.createdAt)}
        </div>
      </div>

      {/* Photo */}
      <div className="mx-4 my-3 rounded-lg overflow-hidden bg-gray-100 h-36 flex items-center justify-center">
        {isPhotoLoading ? (
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Incident photo" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 w-24 flex-shrink-0">Status</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            {incident.statusType?.name ?? "Unknown"}
          </span>
        </div>

        {/* Assign to */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 w-24 flex-shrink-0">Assign to</span>
          <div className="relative flex-1">
            <select
              defaultValue=""
              onChange={(e) => onAssigneeUpdate(incident.id, e.target.value)}
              className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:border-indigo-400 bg-white cursor-pointer"
            >
              <option value="" disabled>Select assignee</option>
              {DEMO_ASSIGNEES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {incident.iamOrganizationId && (
          <RowLight label="Tenant" value={incident.iamOrganizationId} />
        )}
        <RowLight label="Reference ID" value={formatReferenceId(incident)} />

        {/* Update status */}
        <div className="space-y-1 pt-1">
          <label className="text-xs text-gray-400">Update Status</label>
          <div className="relative">
            <select
              value={incident.statusTypeId ?? ""}
              onChange={(e) => onStatusUpdate(incident.id, Number(e.target.value))}
              className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 bg-white cursor-pointer"
            >
              <option value="" disabled>Select status…</option>
              {statusTypes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 mt-2 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors">
          View Full Details
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
