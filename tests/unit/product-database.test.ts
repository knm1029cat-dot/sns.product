import { describe, expect, it } from "vitest";
import type { Database, DatabaseQuery } from "@/lib/database";
import { saveProductSpecificationTransaction } from "@/features/products/service";
import { csvMergeSpecification } from "@/tools/csv/merge/spec";

type State = { version: number; name: string; slug: string; history: Array<{ version: number; createdBy: string | null }> };

function memoryDatabase(initial: State, failHistory = false) {
  let state = structuredClone(initial);
  const database: Database = {
    query: async () => [],
    transaction: async (callback) => {
      const working = structuredClone(state);
      const transaction: DatabaseQuery = {
        query: async <T extends Record<string, unknown>>(sql: string, params: readonly unknown[] = []) => {
          if (sql.startsWith("select spec_version")) return [{ spec_version: working.version }] as unknown as T[];
          if (sql.startsWith("update products")) {
            working.version = Number(params[2]); working.name = String(params[3]); working.slug = String(params[4]);
            return [{ id: String(params[0]) }] as unknown as T[];
          }
          if (sql.startsWith("insert into product_spec_versions")) {
            if (failHistory) throw new Error("history insert failed");
            working.history.push({ version: Number(params[1]), createdBy: params[3] === null ? null : String(params[3]) });
            return [];
          }
          return [];
        },
      };
      const result = await callback(transaction);
      state = working;
      return result;
    },
  };
  return { database, state: () => state };
}

describe("Product Specification transaction", () => {
  const initial: State = { version: 1, name: "Old", slug: "old", history: [] };

  it("updates projections and appends a version history atomically", async () => {
    const memory = memoryDatabase(initial);
    const result = await saveProductSpecificationTransaction(memory.database, "product-1", csvMergeSpecification, "admin");
    expect(result.version).toBe(2);
    expect(memory.state()).toEqual({ version: 2, name: csvMergeSpecification.name, slug: "csv-merge", history: [{ version: 2, createdBy: "admin" }] });
  });

  it("rolls back all state when history insertion fails", async () => {
    const memory = memoryDatabase(initial, true);
    await expect(saveProductSpecificationTransaction(memory.database, "product-1", csvMergeSpecification, null)).rejects.toThrow("history insert failed");
    expect(memory.state()).toEqual(initial);
  });
});
