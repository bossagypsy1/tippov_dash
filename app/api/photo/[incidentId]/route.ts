import { type NextRequest, NextResponse } from "next/server";

const UPSTREAM = (
  process.env.API_BASE_URL ??
  "https://incident-management-api.azurewebsites.net/api"
).replace(/\/$/, "");

/**
 * GET /api/photo/[incidentId]
 *
 * 1. Calls the upstream API to get a time-limited SAS URL for the photo.
 * 2. Fetches the image bytes from Azure Blob Storage (server-side, no CORS).
 * 3. Streams the bytes back to the browser from localhost — no CORS issue.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { incidentId: string } }
) {
  const { incidentId } = params;

  // Step 1: get the SAS URL
  const sasRes = await fetch(`${UPSTREAM}/incidents/${incidentId}/photo/url`);
  if (!sasRes.ok) {
    return new NextResponse("Photo URL not available", { status: sasRes.status });
  }

  const { photoUrl } = (await sasRes.json()) as { photoUrl: string };
  if (!photoUrl) {
    return new NextResponse("No photo URL in response", { status: 404 });
  }

  // Step 2: fetch the image bytes from blob storage
  const imgRes = await fetch(photoUrl);
  if (!imgRes.ok) {
    return new NextResponse("Failed to fetch image from storage", { status: imgRes.status });
  }

  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imgRes.arrayBuffer();

  // Step 3: return to browser — same origin, no CORS
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600", // safe to cache for the SAS window (1 hour)
    },
  });
}
