import type { ProductSpecification } from "@/schemas/product-spec";
import { toolRegistry } from "@/tools/registry";

export type RegistryCandidate = { slug: string; name: string; category: string; componentKey: string; acceptedFileTypes: string[] };
export function slugToComponentKey(slug: string): string { return slug.replace(/-([a-z0-9])/g, (_, character: string) => character.toUpperCase()); }
export function validateRegistryCandidate(candidate: RegistryCandidate, definitions: Record<string, { componentKey: string }> = toolRegistry): void {
  if (candidate.slug in definitions) throw new Error("このslugはRegistryに登録済みです。");
  if (Object.values(definitions).some((entry) => entry.componentKey === candidate.componentKey)) throw new Error("componentKey候補がRegistryと重複しています。");
}
export function createRegistryCandidate(spec: ProductSpecification): RegistryCandidate {
  const candidate = { slug: spec.slug, name: spec.name, category: spec.category, componentKey: slugToComponentKey(spec.slug), acceptedFileTypes: spec.input.acceptedTypes ?? [] };
  validateRegistryCandidate(candidate);
  return candidate;
}
