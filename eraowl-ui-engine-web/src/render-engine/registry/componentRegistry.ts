import type { ComponentType } from "react";
import { Region } from "../components/Region";
import { Lov } from "../components/Lov";
import { LovSelect } from "../components/LovSelect";

export interface ComponentEntry {
  type: ComponentType<Record<string, unknown>>;
  displayName: string;
  category: "layout" | "form" | "data" | "navigation";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, ComponentType<any>> = {
  region: Region,
  lov: Lov,
  lov_select: LovSelect,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMeta: Record<string, ComponentEntry> = {
  region: { type: Region as ComponentType<Record<string, unknown>>, displayName: "Region", category: "layout" },
  lov: { type: Lov as ComponentType<Record<string, unknown>>, displayName: "LOV", category: "data" },
  lov_select: { type: LovSelect as ComponentType<Record<string, unknown>>, displayName: "LOV Select", category: "form" },
};
