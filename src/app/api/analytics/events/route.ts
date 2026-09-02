import { NextResponse } from "next/server";
import { analyticsEventSchema } from "@/schemas/analytics";
import { neonDatabase } from "@/lib/database";
import { recordAnalyticsEvent } from "@/features/analytics/service";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = analyticsEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_event" }, { status: 400 });
  try {
    await recordAnalyticsEvent(neonDatabase, parsed.data);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "analytics_unavailable" }, { status: 503 });
  }
}
