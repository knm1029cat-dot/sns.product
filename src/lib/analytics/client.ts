import type { AnalyticsEventInput } from "@/schemas/analytics";

function getSessionId(): string {
  const key = "tool-factory-session-id";
  const current = window.sessionStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}

export async function trackAnalyticsEvent(
  input: Omit<AnalyticsEventInput, "sessionId">,
): Promise<void> {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, sessionId: getSessionId() }),
      keepalive: true,
    });
  } catch {
    // Analytics must never prevent tool use.
  }
}
