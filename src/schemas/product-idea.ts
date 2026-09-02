import { z } from "zod";
import { toolCategorySchema } from "./product-spec";

const optionalText = z.string().trim().max(2000).default("");

export const productIdeaSchema = z.object({
  name: z.string().trim().min(1).max(120), shortDescription: optionalText,
  category: toolCategorySchema.optional(), targetUser: optionalText, problem: optionalText,
  input: optionalText, output: optionalText, features: optionalText, notes: optionalText,
}).strict();

export type ProductIdea = z.infer<typeof productIdeaSchema>;
