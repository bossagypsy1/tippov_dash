import { type NextRequest, NextResponse } from "next/server";

const AUTH_UPSTREAM = (
  process.env.AUTH_BASE_URL ?? "https://efidentity-iam-api.azurewebsites.net"
).replace(/\/$/, "");

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const tail = params.path.join("/");
  const search = new URL(req.url).search;
  const upstreamUrl = `${AUTH_UPSTREAM}/${tail}${search}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("Authorization");
  if (auth) headers["Authorization"] = auth;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      ...(body ? { body } : {}),
    });
  } catch (err) {
    console.error("[auth-proxy] fetch failed:", err);
    return NextResponse.json(
      { success: false, error: "Could not reach auth service", detail: String(err) },
      { status: 502 }
    );
  }

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const bodyText = await upstream.text();

  // Log non-2xx for server-side debugging
  if (!upstream.ok) {
    console.error(`[auth-proxy] ${req.method} /${tail} → ${upstream.status}:`, bodyText);
  }

  if (!bodyText) {
    return new NextResponse(null, { status: upstream.status });
  }

  try {
    const data = JSON.parse(bodyText);
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return new NextResponse(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
