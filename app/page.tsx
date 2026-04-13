"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

import Navbar from "@/components/Navbar";
import FiltersPanel, { type Filters } from "@/components/FiltersPanel";
import { SidebarIncidentCard } from "@/components/IncidentCard";
import {
  getIncidentsByLocation,
  getIncidentTypes,
  getStatusTypes,
  updateIncidentStatus,
} from "@/lib/api";
import type { Incident, IncidentType, StatusType } from "@/lib/types";
import { getIncidentTypeConfig } from "@/lib/incident-utils";

// Leaflet requires a browser environment — load with no SSR
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS: Filters = {
  tenant: "",
  incidentTypeId: "",
  statusTypeId: "",
  assignTo: "",
  dateFrom: "",
  dateTo: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── Raw data from API ──────────────────────────────────────────────────────
  const [rawIncidents, setRawIncidents] = useState<Incident[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [statusTypes, setStatusTypes] = useState<StatusType[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        // GET /incidents requires JWT auth and returns [].
        // GET /incidents/location works without auth and returns fully-nested objects.
        // Use a UK-wide radius so we get all incidents regardless of location.
        const [inc, types, statuses] = await Promise.all([
          getIncidentsByLocation({ lat: 52.3555, lng: -1.1743, radius: 500 }),
          getIncidentTypes(),
          getStatusTypes(),
        ]);

        setIncidentTypes(types);
        setStatusTypes(statuses);

        // The location endpoint already includes nested incidentType/statusType.
        // Merge from lookup maps as a fallback for any incidents where they are null.
        const typeMap = new Map(types.map((t) => [t.id, t]));
        const statusMap = new Map(statuses.map((s) => [s.id, s]));
        const enriched = inc.map((i) => ({
          ...i,
          incidentType: i.incidentType ?? (i.incidentTypeId != null ? (typeMap.get(i.incidentTypeId) ?? null) : null),
          statusType:   i.statusType   ?? (i.statusTypeId   != null ? (statusMap.get(i.statusTypeId)   ?? null) : null),
        }));

        setRawIncidents(enriched);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          "Failed to load incident data. Check your network connection or API configuration."
        );
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── Set photo URL when an incident with a photo is selected ─────────────
  // Photos are in private Azure Blob Storage — SAS URLs have CORS blocked in
  // the browser. We proxy through /api/photo/[id] which fetches server-side.
  useEffect(() => {
    if (!selectedIncident || (!selectedIncident.photoFileName && !selectedIncident.photoUrl)) {
      setPhotoUrl(null);
      return;
    }
    setPhotoUrl(`/api/photo/${selectedIncident.id}`);
    setIsPhotoLoading(false);
  }, [selectedIncident?.id, selectedIncident?.photoFileName, selectedIncident?.photoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectIncident = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
  }, []);

  const handleCloseIncident = useCallback(() => {
    setSelectedIncident(null);
    setPhotoUrl(null);
  }, []);

  const handleStatusUpdate = useCallback(
    async (incidentId: number, statusTypeId: number) => {
      try {
        await updateIncidentStatus(incidentId, { statusTypeId });
        const updatedStatus = statusTypes.find((s) => s.id === statusTypeId) ?? null;

        setRawIncidents((prev) =>
          prev.map((inc) =>
            inc.id === incidentId ? { ...inc, statusTypeId, statusType: updatedStatus } : inc
          )
        );
        setSelectedIncident((prev) =>
          prev?.id === incidentId ? { ...prev, statusTypeId, statusType: updatedStatus } : prev
        );
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    },
    [statusTypes]
  );

  // NOTE: assignee update is isolated here — no assignee endpoint exists yet in the API.
  // Replace the console.warn body with a real PATCH/PUT call when the endpoint is available.
  const handleAssigneeUpdate = useCallback(
    (_incidentId: number, _assignee: string) => {
      console.warn("[Assignee] API endpoint not yet available — no-op.");
    },
    []
  );

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(pendingFilters);
  }, [pendingFilters]);

  const handleReset = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Unique tenants from live incident data for the tenant filter dropdown
  const tenants = useMemo(
    () =>
      Array.from(
        new Set(rawIncidents.map((i) => i.iamOrganizationId).filter(Boolean) as string[])
      ),
    [rawIncidents]
  );

  const filteredIncidents = useMemo(() => {
    return rawIncidents.filter((inc) => {
      if (
        appliedFilters.incidentTypeId !== "" &&
        inc.incidentTypeId !== appliedFilters.incidentTypeId
      ) return false;
      if (
        appliedFilters.statusTypeId !== "" &&
        inc.statusTypeId !== appliedFilters.statusTypeId
      ) return false;
      if (appliedFilters.tenant && inc.iamOrganizationId !== appliedFilters.tenant) return false;
      if (inc.createdAt) {
        const created = new Date(inc.createdAt);
        if (appliedFilters.dateFrom && created < new Date(appliedFilters.dateFrom)) return false;
        if (
          appliedFilters.dateTo &&
          created > new Date(appliedFilters.dateTo + "T23:59:59")
        ) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = inc.title?.toLowerCase().includes(q) ?? false;
        const inDesc  = inc.description?.toLowerCase().includes(q) ?? false;
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [rawIncidents, appliedFilters, searchQuery]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#0d1b2a] text-white overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 flex flex-col overflow-y-auto border-r border-[#1e3448] bg-[#0d1b2a] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1e3448] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#2d4a68]">
          <FiltersPanel
            incidentTypes={incidentTypes}
            statusTypes={statusTypes}
            tenants={tenants}
            filters={pendingFilters}
            onFiltersChange={setPendingFilters}
            onApplyFilters={handleApplyFilters}
            onReset={handleReset}
          />

          {selectedIncident && (
            <SidebarIncidentCard
              incident={selectedIncident}
              statusTypes={statusTypes}
              onClose={handleCloseIncident}
              onStatusUpdate={handleStatusUpdate}
              onAssigneeUpdate={handleAssigneeUpdate}
              photoUrl={photoUrl}
              isPhotoLoading={isPhotoLoading}
            />
          )}
        </aside>

        {/* ── Map / List area ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          {/* ── Top toolbar (floats above map) ──────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 z-[600] p-3 flex items-center gap-3 pointer-events-none">
            {/* Search */}
            <div className="flex-1 relative pointer-events-auto">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-800 placeholder-gray-400 rounded-lg px-4 py-2.5 pl-10 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* View switcher + Export */}
            <div className="flex bg-white rounded-lg overflow-hidden shadow-lg divide-x divide-gray-200 pointer-events-auto">
              <button
                onClick={() => setActiveView("map")}
                className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  activeView === "map"
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Map View
              </button>
              <button
                onClick={() => setActiveView("list")}
                className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  activeView === "list"
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6"  x2="3.01" y2="6"  strokeLinecap="round" strokeWidth={3} />
                  <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth={3} />
                  <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth={3} />
                </svg>
                List View
              </button>
              <button className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* ── Content ───────────────────────────────────────────────────────── */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-400 text-sm">Loading incidents…</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-sm px-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8"  x2="12"   y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round" strokeWidth={3} />
                  </svg>
                </div>
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : activeView === "map" ? (
            <MapView
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onSelectIncident={handleSelectIncident}
              statusTypes={statusTypes}
              onStatusUpdate={handleStatusUpdate}
              onAssigneeUpdate={handleAssigneeUpdate}
              photoUrl={photoUrl}
              isPhotoLoading={isPhotoLoading}
            />
          ) : (
            /* ── List view ───────────────────────────────────────────────────── */
            <div className="flex-1 overflow-y-auto pt-16 px-4 pb-4 bg-[#0a1628]">
              <div className="mt-3 space-y-2">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">
                    No incidents match the current filters.
                  </div>
                ) : (
                  filteredIncidents.map((inc) => {
                    const isSelected = selectedIncident?.id === inc.id;
                    const cfg = getIncidentTypeConfig(inc.incidentType?.name);
                    return (
                      <button
                        key={inc.id}
                        onClick={() => handleSelectIncident(inc)}
                        className={`w-full text-left rounded-xl px-4 py-3 transition-colors border ${
                          isSelected
                            ? "bg-indigo-900/40 border-indigo-500"
                            : "bg-[#0f2337] hover:bg-[#142840] border-[#1e3448]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: cfg.bgColor }}
                            dangerouslySetInnerHTML={{ __html: cfg.svgIcon }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-white truncate">
                                {inc.title}
                              </span>
                              {inc.statusType && (
                                <span className="text-xs text-slate-400 flex-shrink-0">
                                  {inc.statusType.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {inc.description}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Incident count badge */}
          {!isLoading && !error && (
            <div className="absolute top-[68px] right-4 z-[600] bg-[#0d1b2a]/90 backdrop-blur-sm text-slate-400 text-xs px-2.5 py-1 rounded-full border border-[#1e3448]">
              {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? "s" : ""}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
