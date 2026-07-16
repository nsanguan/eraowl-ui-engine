/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from "react";
import { Region } from "../components/Region";
import { Lov } from "../components/Lov";
import { LovSelect } from "../components/LovSelect";
import { GridRow } from "../components/GridRow";
import { GridColumn } from "../components/GridColumn";
import { InputText } from "../components/InputText";
import { Textarea } from "../components/Textarea";
import { Select } from "../components/Select";
import { Checkbox } from "../components/Checkbox";
import { RadioGroup } from "../components/RadioGroup";
import { DatePicker } from "../components/DatePicker";
import { NumberInput } from "../components/NumberInput";
import { Table } from "../components/Table";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { IconButton } from "../components/IconButton";
import { Link } from "../components/Link";

export interface ComponentEntry {
  type: ComponentType<Record<string, unknown>>;
  displayName: string;
  category: "layout" | "form" | "data" | "navigation" | "action";
}

const registryMap: Record<string, ComponentType<any>> = {
  region: Region,
  lov: Lov,
  lov_select: LovSelect,
  gridrow: GridRow,
  gridcolumn: GridColumn,
  inputtext: InputText,
  textarea: Textarea,
  select: Select,
  checkbox: Checkbox,
  radiogroup: RadioGroup,
  datepicker: DatePicker,
  numberinput: NumberInput,
  table: Table,
  card: Card,
  button: Button,
  iconbutton: IconButton,
  link: Link,
};

export const componentRegistry: Record<string, ComponentType<any>> = registryMap;

export function getComponent(type: string): ComponentType<any> | undefined {
  return registryMap[String(type).toLowerCase()];
}

export const componentMeta: Record<string, ComponentEntry> = {
  region: { type: Region as ComponentType<any>, displayName: "Region", category: "layout" },
  lov: { type: Lov as ComponentType<any>, displayName: "LOV", category: "data" },
  lov_select: { type: LovSelect as ComponentType<any>, displayName: "LOV Select", category: "form" },
  gridrow: { type: GridRow as ComponentType<any>, displayName: "Grid Row", category: "layout" },
  gridcolumn: { type: GridColumn as ComponentType<any>, displayName: "Grid Column", category: "layout" },
  inputtext: { type: InputText as ComponentType<any>, displayName: "Input Text", category: "form" },
  textarea: { type: Textarea as ComponentType<any>, displayName: "Textarea", category: "form" },
  select: { type: Select as ComponentType<any>, displayName: "Select", category: "form" },
  checkbox: { type: Checkbox as ComponentType<any>, displayName: "Checkbox", category: "form" },
  radiogroup: { type: RadioGroup as ComponentType<any>, displayName: "Radio Group", category: "form" },
  datepicker: { type: DatePicker as ComponentType<any>, displayName: "Date Picker", category: "form" },
  numberinput: { type: NumberInput as ComponentType<any>, displayName: "Number Input", category: "form" },
  table: { type: Table as ComponentType<any>, displayName: "Table", category: "data" },
  card: { type: Card as ComponentType<any>, displayName: "Card", category: "data" },
  button: { type: Button as ComponentType<any>, displayName: "Button", category: "action" },
  iconbutton: { type: IconButton as ComponentType<any>, displayName: "Icon Button", category: "action" },
  link: { type: Link as ComponentType<any>, displayName: "Link", category: "navigation" },
};
