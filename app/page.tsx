"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import Navbar from "@/components/Navbar";
import FiltersPanel, { type Filters, type TenantOption } from "@/components/FiltersPanel";
import { SidebarIncidentCard } from "@/components/IncidentCard";
import {
  getAllIncidents,
  getIncidentsByLocation,
  getIncidentTypes,
  getStatusTypes,
  updateIncidentStatus,
  setAuthToken,
} from "@/lib/api";
import {
  loadToken,
  clearToken,
  getOrgIdsFromToken,
  getUserFromToken,
} from "@/lib/auth";
import type { Incident, IncidentType, StatusType } from "@/lib/types";
import { getIncidentTypeConfig } from "@/lib/incident-utils";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const DEFAULT_FILTERS: Filters = {
  tenant: "", incidentTypeId: "", statusTypeId: "",
  assignTo: "", dateFrom: "", dateTo: "",
};

export default function DashboardPage() {
  const router = useRouter();

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [token, setToken]   = useState<string | null>(null);
  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const t = loadToken();
    if (t) {
      setAuthToken(t);
      setToken(t);
      setOrgIds(getOrgIdsFromToken(t));
      setUserName(getUserFromToken(t).name);
    }
    setAuthChecked(true);
  }, []);

  // Redirect to login once we know there's no token
  useEffect(() => {
    if (authChecked && !token) router.replace("/login");
  }, [authChecked, token, router]);

  // ── Incident data ──────────────────────────────────────────────────────────
  const [rawIncidents,  setRawIncidents]  = useState<Incident[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [statusTypes,   setStatusTypes]   = useState<StatusType[]>([]);
  const [tenantNames,   setTenantNames]   = useState<Map<string, string>>(new Map());
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function load() {
      try {
        const [inc, types, statuses] = await Promise.all([
          getAllIncidents(),
          getIncidentTypes(),
          getStatusTypes(),
        ]);

        // Fall back to location search if the auth endpoint returns nothing
        const incidents = inc.length > 0
          ? inc
          : await getIncidentsByLocation({ lat: 52.3555, lng: -1.1743, radius: 500 });

        if (cancelled) return;

        const typeMap   = new Map(types.map((t) => [t.id, t]));
        const statusMap = new Map(statuses.map((s) => [s.id, s]));

        const enriched = incidents.map((i) => ({
          ...i,
          incidentType: i.incidentType ?? (i.incidentTypeId != null ? (typeMap.get(i.incidentTypeId) ?? null) : null),
          statusType:   i.statusType   ?? (i.statusTypeId   != null ? (statusMap.get(i.statusTypeId)   ?? null) : null),
        }));

        setIncidentTypes(types);
        setStatusTypes(statuses);
        setRawIncidents(enriched);

        // Resolve org IDs → names from the IAM API
        const uniqueOrgIds = Array.from(
          new Set(enriched.map((i) => i.iamOrganizationId).filter(Boolean) as string[])
        );
        const nameMap = new Map<string, string>();
        await Promise.all(
          uniqueOrgIds.map(async (id) => {
            try {
              const r = await fetch(`/api/auth-proxy/organizations/${id}`);
              if (r.ok) {
                const org = await r.json();
                nameMap.set(id, org.Name ?? org.name ?? id);
              }
            } catch {
              // fall back to showing the ID
            }
          })
        );
        if (!cancelled) setTenantNames(nameMap);
      } catch (err) {
        if (!cancelled) setError("Failed to load incident data.");
        console.error(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [photoUrl,         setPhotoUrl]         = useState<string | null>(null);
  const [isPhotoLoading,   setIsPhotoLoading]   = useState(false);
  const [pendingFilters,   setPendingFilters]   = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters,   setAppliedFilters]   = useState<Filters>(DEFAULT_FILTERS);
  const [activeView,       setActiveView]       = useState<"map" | "list">("map");
  const [searchQuery,      setSearchQuery]      = useState("");

  // Set photo proxy URL when an incident is selected
  useEffect(() => {
    if (!selectedIncident || (!selectedIncident.photoFileName && !selectedIncident.photoUrl)) {
      setPhotoUrl(null);
      return;
    }
    setPhotoUrl(`/api/photo/${selectedIncident.id}`);
    setIsPhotoLoading(false);
  }, [selectedIncident?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    clearToken();
    setAuthToken(null);
    router.replace("/login");
  }, [router]);

  const handleSelectIncident = useCallback((inc: Incident) => setSelectedIncident(inc), []);
  const handleCloseIncident  = useCallback(() => { setSelectedIncident(null); setPhotoUrl(null); }, []);

  const handleStatusUpdate = useCallback(async (incidentId: number, statusTypeId: number) => {
    try {
      await updateIncidentStatus(incidentId, { statusTypeId });
      const updated = statusTypes.find((s) => s.id === statusTypeId) ?? null;
      setRawIncidents((prev) => prev.map((i) => i.id === incidentId ? { ...i, statusTypeId, statusType: updated } : i));
      setSelectedIncident((prev) => prev?.id === incidentId ? { ...prev, statusTypeId, statusType: updated } : prev);
    } catch (err) {
      console.error("Status update failed:", err);
    }
  }, [statusTypes]);

  const handleAssigneeUpdate = useCallback((_id: number, _name: string) => {
    // No assignee endpoint yet
  }, []);

  const handleApplyFilters = useCallback(() => setAppliedFilters(pendingFilters), [pendingFilters]);
  const handleReset = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  }, []);

  // ── Derived: filter incidents ──────────────────────────────────────────────
  const tenants = useMemo<TenantOption[]>(
    () =>
      Array.from(new Set(rawIncidents.map((i) => i.iamOrganizationId).filter(Boolean) as string[]))
        .map((id) => ({ id, name: tenantNames.get(id) ?? id })),
    [rawIncidents, tenantNames]
  );

  const filteredIncidents = useMemo(() => {
    return rawIncidents.filter((inc) => {
      // Tenant scope — restrict to the user's own org IDs from the JWT.
      // If orgIds is empty (superadmin / unknown), show everything.
      if (orgIds.length > 0 && inc.iamOrganizationId) {
        if (!orgIds.includes(inc.iamOrganizationId)) return false;
      }

      if (appliedFilters.incidentTypeId !== "" && inc.incidentTypeId !== appliedFilters.incidentTypeId) return false;
      if (appliedFilters.statusTypeId   !== "" && inc.statusTypeId   !== appliedFilters.statusTypeId)   return false;
      if (appliedFilters.tenant && inc.iamOrganizationId !== appliedFilters.tenant) return false;

      if (inc.createdAt) {
        const d = new Date(inc.createdAt);
        if (appliedFilters.dateFrom && d < new Date(appliedFilters.dateFrom)) return false;
        if (appliedFilters.dateTo   && d > new Date(appliedFilters.dateTo + "T23:59:59")) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!inc.title?.toLowerCase().includes(q) && !inc.description?.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [rawIncidents, orgIds, appliedFilters, searchQuery]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!authChecked || !token) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0d1b2a] text-white overflow-hidden">
      <Navbar userName={userName} onLogout={handleLogout} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 flex flex-col overflow-y-auto border-r border-[#1e3448] bg-[#0d1b2a] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0a1420] [&::-webkit-scrollbar-thumb]:bg-[#2d4a68] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3d6088]">
          <FiltersPanel
            incidentTypes={incidentTypes}
            statusTypes={statusTypes}
            tenants={tenants}
            filters={pendingFilters}
            onFiltersChange={setPendingFilters}
            onApplyFilters={handleApplyFilters}
            onReset={handleReset}
          />

          {selectedIncident ? (
            <SidebarIncidentCard
              incident={selectedIncident}
              statusTypes={statusTypes}
              onClose={handleCloseIncident}
              onStatusUpdate={handleStatusUpdate}
              onAssigneeUpdate={handleAssigneeUpdate}
              photoUrl={photoUrl}
              isPhotoLoading={isPhotoLoading}
            />
          ) : (
            <div className="px-3 pb-4 pt-3">
              <div className="rounded-xl bg-[#0f2337] border border-[#1e3448] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e3448]">
                  <div className="w-1 h-3.5 rounded-full bg-indigo-500" />
                  <h3 className="text-xs font-semibold text-white">Incident Details</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#1e3448] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-xs">Click a marker to view details</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">

          {/* Toolbar */}
          <div className="absolute top-0 left-0 right-0 z-[600] p-3 flex items-center gap-3 pointer-events-none">
            <div className="flex-1 relative pointer-events-auto">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-800 placeholder-gray-400 rounded-lg px-4 py-2.5 pl-10 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex bg-white rounded-lg overflow-hidden shadow-lg divide-x divide-gray-200 pointer-events-auto">
              {(["map", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-4 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-colors capitalize ${activeView === v ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {v === "map" ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" strokeLinecap="round" strokeWidth={3} />
                      <line x1="3" y1="12" x2="3.01" y2="12" strokeLinecap="round" strokeWidth={3} />
                      <line x1="3" y1="18" x2="3.01" y2="18" strokeLinecap="round" strokeWidth={3} />
                    </svg>
                  )}
                  {v === "map" ? "Map View" : "List View"}
                </button>
              ))}
              <button className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Content */}
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
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="text-indigo-400 hover:text-indigo-300 text-sm underline">Retry</button>
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
            <div className="flex-1 overflow-y-auto pt-16 px-4 pb-4 bg-[#0a1628]">
              <div className="mt-3 space-y-2">
                {filteredIncidents.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">No incidents match the current filters.</div>
                ) : filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  const cfg = getIncidentTypeConfig(inc.incidentType?.name);
                  return (
                    <button
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`w-full text-left rounded-xl px-4 py-3 transition-colors border ${isSelected ? "bg-indigo-900/40 border-indigo-500" : "bg-[#0f2337] hover:bg-[#142840] border-[#1e3448]"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.bgColor }} dangerouslySetInnerHTML={{ __html: cfg.svgIcon }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-white truncate">{inc.title}</span>
                            {inc.statusType && <span className="text-xs text-slate-400 flex-shrink-0">{inc.statusType.name}</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{inc.description}</p>
                          <p className="text-xs text-slate-600 mt-1">{inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
