import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PostgreSQL migration invariants", () => {
  const migration = readFileSync("database/migrations/001_initial_schema.sql", "utf8");

  it("declares DRAFT/PUBLISHED publication timestamp constraints", () => {
    expect(migration).toContain("status = 'DRAFT' and published_at is null");
    expect(migration).toContain("status = 'PUBLISHED' and published_at is not null");
  });

  it("declares slug, version and event allowlist constraints", () => {
    expect(migration).toContain("slug text not null unique");
    expect(migration).toContain("spec_version integer not null check (spec_version > 0)");
    for (const event of ["page_view", "tool_open", "tool_started", "tool_completed", "download_clicked"]) {
      expect(migration).toContain(`'${event}'`);
    }
  });

  it("has no Supabase auth or RLS dependency", () => {
    expect(migration).not.toMatch(/auth\.users|row level security|create policy/i);
  });
});
