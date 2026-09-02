import type { ComponentType } from "react";
import type { ToolCategory } from "./registry";

export type ToolComponentProps = { productId?: string };
export type ToolComponentKey = "csvMerge";

export type ToolDefinition = {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  componentKey: ToolComponentKey;
  acceptedFileTypes: readonly string[];
};

export type ToolComponentMap = Record<ToolComponentKey, ComponentType<ToolComponentProps>>;
