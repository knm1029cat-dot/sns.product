import { describe, expect, it, vi } from "vitest";
import type { DatabaseQuery } from "@/lib/database";
import { recordAnalyticsEvent } from "@/features/analytics/service";

const valid = {
  eventName: "tool_started" as const,
  sessionId: "00000000-0000-4000-8000-000000000002",
  metadata: { toolSlug: "csv-merge" as const, fileCount: 2 },
};

describe("Analytics database service", () => {
  it("validates and inserts a normal event", async () => {
    const query = vi.fn().mockResolvedValue([]);
    await expect(recordAnalyticsEvent({ query } as DatabaseQuery, valid)).resolves.toEqual(valid);
    expect(query).toHaveBeenCalledOnce();
  });

  it("rejects invalid events and arbitrary metadata before querying", async () => {
    const query = vi.fn().mockResolvedValue([]);
    await expect(recordAnalyticsEvent({ query } as DatabaseQuery, { ...valid, metadata: { ...valid.metadata, fileName: "secret.csv" } })).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
});
