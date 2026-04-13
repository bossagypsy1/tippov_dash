import type { Incident } from "./types";

// ─── Incident type SVG icons (white fill, 17×17) ─────────────────────────────
// Keyed to the real incident types returned by GET /incident-types

const SVG_TRASH    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const SVG_TAG      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>`;
const SVG_LAMP     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`;
const SVG_WARNING  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
const SVG_WALK     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>`;
const SVG_CAR      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;
const SVG_PET      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M4.5 11c1.38 0 2.5-1.12 2.5-2.5S5.88 6 4.5 6 2 7.12 2 8.5 3.12 11 4.5 11zm0-3c.28 0 .5.22.5.5s-.22.5-.5.5S4 8.78 4 8.5 4.22 8 4.5 8zm6-1C11.88 7 13 5.88 13 4.5S11.88 2 10.5 2 8 3.12 8 4.5 9.12 7 10.5 7zm0-3c.28 0 .5.22.5.5s-.22.5-.5.5S10 4.78 10 4.5s.22-.5.5-.5zm6.5 7c1.38 0 2.5-1.12 2.5-2.5S18.38 6 17 6s-2.5 1.12-2.5 2.5S15.62 11 17 11zm0-3c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5zm-3.5 3c-1.38 0-2.5 1.12-2.5 2.5S12.12 17 13.5 17s2.5-1.12 2.5-2.5S14.88 11 13.5 11zm0 3c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-7 1c0-2.21 2.69-5 6-5s6 2.79 6 5c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2z"/></svg>`;
const SVG_BENCH    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M13 10h-2V7H9v3H4v2h1v5h2v-5h10v5h2v-5h1v-2h-5V7h-2v3zm-1-8C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>`;
const SVG_LEAF     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-5 8"/></svg>`;
const SVG_LITTER   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
const SVG_SOUND    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const SVG_DOTS     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="17" height="17"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`;

export interface IncidentTypeConfig {
  bgColor: string;
  label: string;
  svgIcon: string;
}

// Keys match the real API incident type names (lowercase for matching)
const TYPE_MAP: Record<string, IncidentTypeConfig> = {
  "flytipping":               { bgColor: "#7C3AED", label: "Flytipping",               svgIcon: SVG_TRASH  },
  "fly tipping":              { bgColor: "#7C3AED", label: "Flytipping",               svgIcon: SVG_TRASH  },
  "fly-tipping":              { bgColor: "#7C3AED", label: "Flytipping",               svgIcon: SVG_TRASH  },
  "graffiti":                 { bgColor: "#16A34A", label: "Graffiti",                 svgIcon: SVG_TAG    },
  "broken street light":      { bgColor: "#1D4ED8", label: "Broken Street Light",      svgIcon: SVG_LAMP   },
  "broken street lamp":       { bgColor: "#1D4ED8", label: "Broken Street Light",      svgIcon: SVG_LAMP   },
  "pothole":                  { bgColor: "#F97316", label: "Pothole",                  svgIcon: SVG_WARNING},
  "broken pavement":          { bgColor: "#92400E", label: "Broken Pavement",          svgIcon: SVG_WALK   },
  "abandoned vehicle":        { bgColor: "#6B7280", label: "Abandoned Vehicle",        svgIcon: SVG_CAR    },
  "dog fouling":              { bgColor: "#A16207", label: "Dog Fouling",              svgIcon: SVG_PET    },
  "damaged public furniture": { bgColor: "#0F766E", label: "Damaged Public Furniture", svgIcon: SVG_BENCH  },
  "overgrown vegetation":     { bgColor: "#15803D", label: "Overgrown Vegetation",     svgIcon: SVG_LEAF   },
  "littering":                { bgColor: "#DC2626", label: "Littering",                svgIcon: SVG_LITTER },
  "noise pollution":          { bgColor: "#7C3AED", label: "Noise Pollution",          svgIcon: SVG_SOUND  },
  "other":                    { bgColor: "#6B7280", label: "Other",                    svgIcon: SVG_DOTS   },
};

const FALLBACK: IncidentTypeConfig = {
  bgColor: "#6B7280",
  label: "Other",
  svgIcon: SVG_DOTS,
};

export function getIncidentTypeConfig(typeName?: string | null): IncidentTypeConfig {
  if (!typeName) return FALLBACK;
  return TYPE_MAP[typeName.toLowerCase().trim()] ?? FALLBACK;
}

// ─── Status badge colours (dark theme — sidebar) ─────────────────────────────
// Keyed to real status names from GET /status-types

export interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

const STATUS_STYLES: Record<string, StatusStyle> = {
  "new":               { bg: "bg-blue-500/20",   text: "text-blue-300",   dot: "bg-blue-400"   },
  "in progress":       { bg: "bg-amber-500/20",  text: "text-amber-300",  dot: "bg-amber-400"  },
  "under review":      { bg: "bg-violet-500/20", text: "text-violet-300", dot: "bg-violet-400" },
  "complete":          { bg: "bg-green-500/20",  text: "text-green-300",  dot: "bg-green-400"  },
  "rejected":          { bg: "bg-red-500/20",    text: "text-red-300",    dot: "bg-red-400"    },
  "duplicate":         { bg: "bg-slate-500/20",  text: "text-slate-300",  dot: "bg-slate-400"  },
  "on hold":           { bg: "bg-cyan-500/20",   text: "text-cyan-300",   dot: "bg-cyan-400"   },
  // legacy / swagger names kept as fallbacks
  "reported":          { bg: "bg-blue-500/20",   text: "text-blue-300",   dot: "bg-blue-400"   },
  "completed":         { bg: "bg-green-500/20",  text: "text-green-300",  dot: "bg-green-400"  },
  "discarded":         { bg: "bg-red-500/20",    text: "text-red-300",    dot: "bg-red-400"    },
  "cleanup completed": { bg: "bg-teal-500/20",   text: "text-teal-300",   dot: "bg-teal-400"   },
};

const STATUS_FALLBACK: StatusStyle = {
  bg: "bg-slate-500/20",
  text: "text-slate-300",
  dot: "bg-slate-400",
};

export function getStatusStyle(statusName?: string | null): StatusStyle {
  if (!statusName) return STATUS_FALLBACK;
  return STATUS_STYLES[statusName.toLowerCase().trim()] ?? STATUS_FALLBACK;
}

// ─── Status badge colours (light theme — map popup) ───────────────────────────

export interface StatusStyleLight {
  bg: string;
  text: string;
}

const STATUS_STYLES_LIGHT: Record<string, StatusStyleLight> = {
  "new":               { bg: "bg-blue-100",    text: "text-blue-700"   },
  "in progress":       { bg: "bg-amber-100",   text: "text-amber-700"  },
  "under review":      { bg: "bg-violet-100",  text: "text-violet-700" },
  "complete":          { bg: "bg-green-100",   text: "text-green-700"  },
  "rejected":          { bg: "bg-red-100",     text: "text-red-700"    },
  "duplicate":         { bg: "bg-slate-100",   text: "text-slate-700"  },
  "on hold":           { bg: "bg-cyan-100",    text: "text-cyan-700"   },
  "reported":          { bg: "bg-blue-100",    text: "text-blue-700"   },
  "completed":         { bg: "bg-green-100",   text: "text-green-700"  },
  "discarded":         { bg: "bg-red-100",     text: "text-red-700"    },
  "cleanup completed": { bg: "bg-teal-100",    text: "text-teal-700"   },
};

export function getStatusStyleLight(statusName?: string | null): StatusStyleLight {
  if (!statusName) return { bg: "bg-gray-100", text: "text-gray-600" };
  return STATUS_STYLES_LIGHT[statusName.toLowerCase().trim()] ?? { bg: "bg-gray-100", text: "text-gray-600" };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatReferenceId(incident: Incident): string {
  const year = incident.createdAt
    ? new Date(incident.createdAt).getFullYear()
    : new Date().getFullYear();
  return `TIP-${year}-${String(incident.id).padStart(6, "0")}`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
