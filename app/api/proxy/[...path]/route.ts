import { type NextRequest, NextResponse } from "next/server";

// Server-side only — no CORS issues.
// Browser → /api/proxy/<path> → this route → external API
const UPSTREAM = (
  process.env.API_BASE_URL ??
  "https://incident-management-api.azurewebsites.net/api"
).replace(/\/$/, "");

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const tail = params.path.join("/");
  const search = new URL(req.url).search;
  const upstreamUrl = `${UPSTREAM}/${tail}${search}`;

  // Forward auth header if present
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = req.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const text = await req.text();
    if (text) init.body = text;
  }

  const upstream = await fetch(upstreamUrl, init);

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const bodyText = await upstream.text();
  const contentType = upstream.headers.get("content-type") ?? "";

  if (!bodyText) {
    return new NextResponse(null, { status: upstream.status });
  }

  try {
    const data = JSON.parse(bodyText);
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return new NextResponse(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  }
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
