import { describe, expect, it } from "vitest";
import type { Database, DatabaseQuery } from "@/lib/database";
import { createDraftProductTransaction, saveProductSpecificationTransaction } from "@/features/products/service";
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

describe("DRAFT商品登録transaction", () => {
  const specification = { ...csvMergeSpecification, slug: "new-csv-tool", name: "新CSVツール" };

  function createDatabase(failHistory = false, duplicate = false) {
    const state = { product: null as null | { status: string; publishedAt: null }, histories: 0 };
    const database: Database = {
      query: async () => [],
      transaction: async (callback) => {
        const working = structuredClone(state);
        const transaction: DatabaseQuery = { query: async <T extends Record<string, unknown>>(sql: string) => {
          if (sql.startsWith("select id from products")) return (duplicate ? [{ id: "existing" }] : []) as unknown as T[];
          if (sql.startsWith("insert into products")) { working.product = { status: "DRAFT", publishedAt: null }; return [{ id: "new-id" }] as unknown as T[]; }
          if (sql.startsWith("insert into product_spec_versions")) { if (failHistory) throw new Error("history failed"); working.histories += 1; }
          return [];
        } };
        const result = await callback(transaction); Object.assign(state, working); return result;
      },
    };
    return { database, state };
  }

  it("DRAFT、published_at NULL、version履歴を同一transactionで登録する", async () => {
    const memory = createDatabase();
    await expect(createDraftProductTransaction(memory.database, specification, "admin")).resolves.toMatchObject({ productId: "new-id", specification: { version: 1 } });
    expect(memory.state).toEqual({ product: { status: "DRAFT", publishedAt: null }, histories: 1 });
  });
  it("履歴登録失敗時にrollbackする", async () => {
    const memory = createDatabase(true);
    await expect(createDraftProductTransaction(memory.database, specification, "admin")).rejects.toThrow("history failed");
    expect(memory.state).toEqual({ product: null, histories: 0 });
  });
  it("重複slugを拒否する", async () => {
    await expect(createDraftProductTransaction(createDatabase(false, true).database, specification, null)).rejects.toThrow("既に登録");
  });
});
