import type { DatabaseQuery } from "@/lib/database";
import { analyticsEventSchema, type AnalyticsEventInput } from "@/schemas/analytics";

export async function recordAnalyticsEvent(database: DatabaseQuery, input: unknown): Promise<AnalyticsEventInput> {
  const event = analyticsEventSchema.parse(input);
  await database.query(
    "insert into analytics_events(event_name, product_id, session_id, metadata_json) values($1, $2, $3, $4::jsonb)",
    [event.eventName, event.productId ?? null, event.sessionId, JSON.stringify(event.metadata)],
  );
  return event;
}
