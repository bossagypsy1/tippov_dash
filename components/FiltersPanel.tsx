"use client";

import type { IncidentType, StatusType } from "@/lib/types";

export interface Filters {
  tenant: string;
  incidentTypeId: number | "";
  statusTypeId: number | "";
  assignTo: string;
  dateFrom: string;
  dateTo: string;
}

interface FiltersPanelProps {
  incidentTypes: IncidentType[];
  statusTypes: StatusType[];
  tenants: string[];
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  onApplyFilters: () => void;
  onReset: () => void;
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
        {label}
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple cursor-pointer"
        >
          {children}
        </select>
        <svg
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

export default function FiltersPanel({
  incidentTypes,
  statusTypes,
  tenants,
  filters,
  onFiltersChange,
  onApplyFilters,
  onReset,
}: FiltersPanelProps) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-base">Filters</h2>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-brand-purple text-sm hover:text-brand-purple-light transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" strokeLinecap="round" />
            <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" strokeLinecap="round" />
          </svg>
          Reset
        </button>
      </div>

      {/* Tenant */}
      <SelectField
        label="Tenant"
        value={filters.tenant}
        onChange={(v) => set("tenant", v)}
      >
        <option value="">All Tenants</option>
        {tenants.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </SelectField>

      {/* Incident Type */}
      <SelectField
        label="Incident Type"
        value={filters.incidentTypeId}
        onChange={(v) => set("incidentTypeId", v === "" ? "" : Number(v))}
      >
        <option value="">All Types</option>
        {incidentTypes.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </SelectField>

      {/* Status */}
      <SelectField
        label="Incident Status"
        value={filters.statusTypeId}
        onChange={(v) => set("statusTypeId", v === "" ? "" : Number(v))}
      >
        <option value="">All Statuses</option>
        {statusTypes.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </SelectField>

      {/* Assign to — NOTE: assignee field not yet in API; filtering is UI-only */}
      <SelectField
        label="Assign to"
        value={filters.assignTo}
        onChange={(v) => set("assignTo", v)}
      >
        <option value="">All Assignees</option>
        {/* TODO: populate from an assignees endpoint when available */}
      </SelectField>

      {/* Date range */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-400">Date Range</label>
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set("dateFrom", e.target.value)}
            className="bg-transparent text-xs text-white w-28 focus:outline-none [color-scheme:dark]"
          />
          <span className="text-slate-500 text-xs">–</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set("dateTo", e.target.value)}
            className="bg-transparent text-xs text-white w-28 focus:outline-none [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={onApplyFilters}
        className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple-hover text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Apply Filters
      </button>
    </div>
  );
}
