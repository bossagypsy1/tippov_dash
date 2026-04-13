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

// ─── Theme tokens ──────────────────────────────────────────────────────────────
// Two variants: "dark" (sidebar) and "light" (map popup).

interface Theme {
  label: string;
  value: string;
  meta: string;
  photoBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputFocus: string;
  divider: string;
  linkText: string;
  linkHover: string;
  sectionLabel: string;
}

const DARK: Theme = {
  label:       "text-slate-400",
  value:       "text-white font-medium",
  meta:        "text-slate-400",
  photoBg:     "bg-[#142840]",
  inputBg:     "bg-[#0f2337]",
  inputBorder: "border-[#1e3448]",
  inputText:   "text-slate-200",
  inputFocus:  "focus:border-indigo-500",
  divider:     "border-[#1e3448]",
  linkText:    "text-indigo-400",
  linkHover:   "hover:text-indigo-300",
  sectionLabel:"text-slate-500",
};

const LIGHT: Theme = {
  label:       "text-gray-500",
  value:       "text-gray-900 font-medium",
  meta:        "text-gray-400",
  photoBg:     "bg-gray-100",
  inputBg:     "bg-white",
  inputBorder: "border-gray-200",
  inputText:   "text-gray-700",
  inputFocus:  "focus:border-indigo-400",
  divider:     "border-gray-100",
  linkText:    "text-indigo-600",
  linkHover:   "hover:text-indigo-700",
  sectionLabel:"text-gray-400",
};

// ─── Shared inner content ──────────────────────────────────────────────────────

interface ContentProps {
  incident: Incident;
  statusTypes: StatusType[];
  onStatusUpdate: (incidentId: number, statusTypeId: number) => void;
  onAssigneeUpdate: (incidentId: number, assignee: string) => void;
  photoUrl: string | null;
  t: Theme;
}

function IncidentContent({
  incident,
  statusTypes,
  onStatusUpdate,
  onAssigneeUpdate,
  photoUrl,
  t,
}: ContentProps) {
  const typeConfig  = getIncidentTypeConfig(incident.incidentType?.name);
  const statusName  = incident.statusType?.name ?? "";

  return (
    <div className="space-y-3">

      {/* ── Type icon + title ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: typeConfig.bgColor }}
          dangerouslySetInnerHTML={{ __html: typeConfig.svgIcon }}
        />
        <span className={`font-semibold text-sm leading-snug ${t.value}`}>
          {incident.title}
        </span>
      </div>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 text-xs ${t.meta}`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {formatCoords(incident.latitude, incident.longitude)}
      </div>

      {/* ── Date ─────────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 text-xs ${t.meta}`}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
        {formatDate(incident.createdAt)}
      </div>

      {/* ── Photo ────────────────────────────────────────────────────────── */}
      <div className={`rounded-lg overflow-hidden ${t.photoBg} h-36 flex items-center justify-center`}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Incident photo" className="w-full h-full object-cover" />
        ) : incident.photoFileName || incident.photoUrl ? (
          /* Has a photo but proxy URL not set yet — show subtle spinner */
          <div className={`flex flex-col items-center gap-1.5 ${t.meta}`}>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
            <span className="text-xs opacity-60">Loading…</span>
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-1.5 ${t.meta} opacity-40`}>
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-xs">No photo</span>
          </div>
        )}
      </div>

      {/* ── Status (current badge + inline update dropdown) ───────────────── */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`text-xs w-24 flex-shrink-0 ${t.sectionLabel}`}>Status</span>
          {/* Read-only badge showing current value */}
          {statusName ? (
            (() => {
              const ds = getStatusStyle(statusName);
              const ls = getStatusStyleLight(statusName);
              const isDark = t === DARK;
              const s = isDark ? ds : ls;
              return (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                  {isDark && <span className={`w-1.5 h-1.5 rounded-full ${ds.dot}`} />}
                  {statusName}
                </span>
              );
            })()
          ) : (
            <span className={`text-xs ${t.meta} opacity-50`}>—</span>
          )}
        </div>

        {/* Change status */}
        <div className="relative">
          <select
            value={incident.statusTypeId ?? ""}
            onChange={(e) => onStatusUpdate(incident.id, Number(e.target.value))}
            className={`w-full appearance-none rounded-lg px-3 py-2 text-sm border
              ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputFocus}
              focus:outline-none cursor-pointer`}
          >
            <option value="" disabled>Change status…</option>
            {statusTypes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${t.meta}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ── Assign to ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <span className={`text-xs ${t.sectionLabel}`}>Assign to</span>
        <div className="relative">
          <select
            defaultValue=""
            onChange={(e) => onAssigneeUpdate(incident.id, e.target.value)}
            className={`w-full appearance-none rounded-lg px-3 py-2 text-sm border
              ${t.inputBg} ${t.inputBorder} ${t.inputText} ${t.inputFocus}
              focus:outline-none cursor-pointer`}
          >
            <option value="" disabled>Select assignee…</option>
            {DEMO_ASSIGNEES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <svg className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${t.meta}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* ── Metadata rows ─────────────────────────────────────────────────── */}
      {incident.iamOrganizationId && (
        <div className="flex items-start gap-2 text-sm">
          <span className={`w-24 flex-shrink-0 text-xs ${t.sectionLabel}`}>Tenant</span>
          <span className={`flex-1 text-xs ${t.value}`}>{incident.iamOrganizationId}</span>
        </div>
      )}
      <div className="flex items-start gap-2 text-sm">
        <span className={`w-24 flex-shrink-0 text-xs ${t.sectionLabel}`}>Reference</span>
        <span className={`flex-1 text-xs font-mono ${t.value}`}>{formatReferenceId(incident)}</span>
      </div>

      {/* ── View Full Details ─────────────────────────────────────────────── */}
      <div className={`pt-1 border-t ${t.divider}`}>
        <button className={`w-full flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 transition-colors ${t.linkText} ${t.linkHover}`}>
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

// ─── Sidebar card (dark theme) ────────────────────────────────────────────────

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
}: SidebarCardProps) {
  return (
    <div className="px-3 pb-4 pt-3">
      <div className="rounded-xl bg-[#0f2337] border border-[#1e3448] overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3448]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-indigo-500" />
            <h3 className="text-sm font-semibold text-white">Incident Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded hover:bg-white/10"
            aria-label="Close panel"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Card body */}
        <div className="px-4 py-4">
          <IncidentContent
            incident={incident}
            statusTypes={statusTypes}
            onStatusUpdate={onStatusUpdate}
            onAssigneeUpdate={onAssigneeUpdate}
            photoUrl={photoUrl}
            t={DARK}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Map popup card (light theme) ─────────────────────────────────────────────

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
}: PopupCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden p-4">
      <IncidentContent
        incident={incident}
        statusTypes={statusTypes}
        onStatusUpdate={onStatusUpdate}
        onAssigneeUpdate={onAssigneeUpdate}
        photoUrl={photoUrl}
        t={LIGHT}
      />
    </div>
  );
}
