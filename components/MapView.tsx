"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Incident, StatusType } from "@/lib/types";
import { getIncidentTypeConfig } from "@/lib/incident-utils";
import { PopupIncidentCard } from "./IncidentCard";

// ─── Custom DivIcon builder ────────────────────────────────────────────────

function buildMarkerIcon(incident: Incident, isSelected: boolean): L.DivIcon {
  const cfg = getIncidentTypeConfig(incident.incidentType?.name);
  const size = isSelected ? 46 : 38;
  const border = isSelected ? "3px solid white" : "2px solid rgba(255,255,255,0.25)";
  const shadow = isSelected
    ? `0 0 0 4px ${cfg.bgColor}55, 0 4px 16px rgba(0,0,0,0.45)`
    : "0 2px 8px rgba(0,0,0,0.35)";

  return L.divIcon({
    className: isSelected ? "marker-selected" : "",
    html: `<div style="
        width:${size}px;height:${size}px;
        background:${cfg.bgColor};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        border:${border};
        box-shadow:${shadow};
        transition:width 0.15s ease,height 0.15s ease,box-shadow 0.15s ease;
        cursor:pointer;">${cfg.svgIcon}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

// ─── Per-marker component (manages its own popup-open side-effect) ─────────

interface IncidentMarkerProps {
  incident: Incident;
  isSelected: boolean;
  onSelect: (incident: Incident) => void;
  statusTypes: StatusType[];
  onStatusUpdate: (incidentId: number, statusTypeId: number) => void;
  onAssigneeUpdate: (incidentId: number, assignee: string) => void;
  photoUrl: string | null;
  isPhotoLoading: boolean;
}

function IncidentMarker({
  incident,
  isSelected,
  onSelect,
  statusTypes,
  onStatusUpdate,
  onAssigneeUpdate,
  photoUrl,
  isPhotoLoading,
}: IncidentMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null);

  // When this marker becomes selected, open its popup after the map has
  // had time to re-centre (map.setView animation ~200 ms).
  useEffect(() => {
    if (isSelected && markerRef.current) {
      const timer = setTimeout(() => {
        markerRef.current?.openPopup();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef as React.Ref<L.Marker>}
      position={[incident.latitude, incident.longitude]}
      icon={buildMarkerIcon(incident, isSelected)}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(incident) }}
    >
      <Popup minWidth={320} maxWidth={320} closeButton={false}>
        <PopupIncidentCard
          incident={incident}
          statusTypes={statusTypes}
          onStatusUpdate={onStatusUpdate}
          onAssigneeUpdate={onAssigneeUpdate}
          photoUrl={isSelected ? photoUrl : null}
          isPhotoLoading={isSelected ? isPhotoLoading : false}
        />
      </Popup>
    </Marker>
  );
}

// ─── Map centering controller ──────────────────────────────────────────────

function MapController({ selected }: { selected: Incident | null }) {
  const map = useMap();
  const prevIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selected) return;
    if (prevIdRef.current === selected.id) return; // already centred
    prevIdRef.current = selected.id;
    map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
    });
  }, [selected, map]);

  return null;
}

// ─── Zoom controls (inside MapContainer so useMap() is available) ──────────

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-32 right-4 z-[500] flex flex-col gap-1 pointer-events-auto">
      <button
        className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors text-xl leading-none select-none"
        onClick={() => map.zoomIn()}
        title="Zoom in"
      >
        +
      </button>
      <button
        className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors text-xl leading-none select-none"
        onClick={() => map.zoomOut()}
        title="Zoom out"
      >
        −
      </button>
      <button
        className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors mt-1"
        onClick={() => map.locate({ setView: true, maxZoom: 14 })}
        title="My location"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M1 12h4M19 12h4" strokeLinecap="round" />
        </svg>
      </button>
      <button
        className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        title="Layer options"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Legend bar ────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: "Flytipping",          typeName: "flytipping"          },
  { label: "Pothole",             typeName: "pothole"             },
  { label: "Broken Street Light", typeName: "broken street light" },
  { label: "Graffiti",            typeName: "graffiti"            },
  { label: "Abandoned Vehicle",   typeName: "abandoned vehicle"   },
  { label: "Other",               typeName: "other"               },
];

function LegendBar() {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg pointer-events-none">
      {LEGEND_ITEMS.map(({ label, typeName }) => {
        const cfg = getIncidentTypeConfig(typeName);
        return (
          <div key={typeName} className="flex items-center gap-1.5 px-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: cfg.bgColor }}
              dangerouslySetInnerHTML={{ __html: cfg.svgIcon }}
            />
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────

interface MapViewProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (incident: Incident) => void;
  statusTypes: StatusType[];
  onStatusUpdate: (incidentId: number, statusTypeId: number) => void;
  onAssigneeUpdate: (incidentId: number, assignee: string) => void;
  photoUrl: string | null;
  isPhotoLoading: boolean;
}

// Default centre: Warwickshire / Leamington Spa area (matches mock-up)
const DEFAULT_CENTER: [number, number] = [52.29, -1.535];
const DEFAULT_ZOOM = 11;

export default function MapView({
  incidents,
  selectedIncident,
  onSelectIncident,
  statusTypes,
  onStatusUpdate,
  onAssigneeUpdate,
  photoUrl,
  isPhotoLoading,
}: MapViewProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* CartoDB Voyager — clean light basemap matching mock-up style */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />

        <MapController selected={selectedIncident} />
        <ZoomControls />

        {incidents.map((incident) => (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            isSelected={selectedIncident?.id === incident.id}
            onSelect={onSelectIncident}
            statusTypes={statusTypes}
            onStatusUpdate={onStatusUpdate}
            onAssigneeUpdate={onAssigneeUpdate}
            photoUrl={photoUrl}
            isPhotoLoading={isPhotoLoading}
          />
        ))}
      </MapContainer>

      <LegendBar />
    </div>
  );
}
