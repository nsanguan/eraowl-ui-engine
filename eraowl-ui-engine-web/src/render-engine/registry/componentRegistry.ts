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
// APEX UT Layout
import { Standard } from "../components/Standard";
import { ContentBlock } from "../components/ContentBlock";
import { ContentRow } from "../components/ContentRow";
import { FlexboxContainer } from "../components/FlexboxContainer";
import { Hero } from "../components/Hero";
import { Image } from "../components/Image";
import { HelpText } from "../components/HelpText";
import { Collapsible } from "../components/Collapsible";
import { InlineDialog } from "../components/InlineDialog";
import { ButtonContainer } from "../components/ButtonContainer";
import { TitleBar } from "../components/TitleBar";
import { TabsContainer } from "../components/TabsContainer";
import { RegionDisplaySelector } from "../components/RegionDisplaySelector";
import { StaticContent } from "../components/StaticContent";
import { PlasqlDynamicContent } from "../components/PlasqlDynamicContent";
// APEX UT Feedback
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { BadgesList } from "../components/BadgesList";
// APEX UT Navigation
import { Breadcrumb } from "../components/Breadcrumb";
import { LinksList } from "../components/LinksList";
import { ListView } from "../components/ListView";
import { MediaList } from "../components/MediaList";
import { MenuBar } from "../components/MenuBar";
import { MenuPopup } from "../components/MenuPopup";
import { NavigationBar } from "../components/NavigationBar";
import { Tree } from "../components/Tree";
import { Wizard } from "../components/Wizard";
// APEX UT Data
import { ClassicReport } from "../components/ClassicReport";
import { InteractiveReport } from "../components/InteractiveReport";
import { InteractiveGrid } from "../components/InteractiveGrid";
import { ColumnToggleReport } from "../components/ColumnToggleReport";
import { ReflowReport } from "../components/ReflowReport";
import { ContextualInfo } from "../components/ContextualInfo";
import { ValueAttributePairs } from "../components/ValueAttributePairs";
import { Calendar } from "../components/Calendar";
import { Carousel } from "../components/Carousel";
import { Charts } from "../components/Charts";
import { CardTemplates } from "../components/CardTemplates";
import { Comments } from "../components/Comments";
import { MetricCard } from "../components/MetricCard";
import { Timeline } from "../components/Timeline";
// APEX UT Partials
import { Avatar } from "../components/Avatar";
import { ButtonGroup } from "../components/ButtonGroup";
import { FormField } from "../components/FormField";
// Utility
import { ScrollBar } from "../components/ScrollBar";

export interface ComponentEntry {
  type: ComponentType<Record<string, unknown>>;
  displayName: string;
  category: "layout" | "form" | "data" | "navigation" | "action";
}

// Canonical lowercase keys for runtime lookup.
// PascalCase variants (e.g. "Region", "InputText") are supported via
// the normalizeType() helper below, ensuring compatibility between the
// JSON Schema enum (PascalCase) and the render engine registry (lowercase).
const registryMap: Record<string, ComponentType<any>> = {
  region: Region,
  standard: Standard,
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
  classicreport: ClassicReport,
  card: Card,
  cardregions: Card,
  button: Button,
  iconbutton: IconButton,
  link: Link,
  // APEX UT Layout
  contentblock: ContentBlock,
  contentrow: ContentRow,
  flexboxcontainer: FlexboxContainer,
  hero: Hero,
  image: Image,
  helptext: HelpText,
  collapsible: Collapsible,
  inlinedialog: InlineDialog,
  buttoncontainer: ButtonContainer,
  titlebar: TitleBar,
  tabscontainer: TabsContainer,
  regiondisplayselector: RegionDisplaySelector,
  staticcontent: StaticContent,
  plasqldynamiccontent: PlasqlDynamicContent,
  // APEX UT Feedback
  alert: Alert,
  badge: Badge,
  badgeslist: BadgesList,
  // APEX UT Navigation
  breadcrumb: Breadcrumb,
  linkslist: LinksList,
  listview: ListView,
  medialist: MediaList,
  menubar: MenuBar,
  menupopup: MenuPopup,
  navigationbar: NavigationBar,
  tree: Tree,
  wizard: Wizard,
  // APEX UT Data
  interactivereport: InteractiveReport,
  interactivegrid: InteractiveGrid,
  columntogglereport: ColumnToggleReport,
  reflowreport: ReflowReport,
  contextualinfo: ContextualInfo,
  valueattributepairs: ValueAttributePairs,
  calendar: Calendar,
  carousel: Carousel,
  charts: Charts,
  cardtemplates: CardTemplates,
  comments: Comments,
  metriccard: MetricCard,
  timeline: Timeline,
  // APEX UT Partials
  avatar: Avatar,
  buttongroup: ButtonGroup,
  formfield: FormField,
  // Utility
  scrollbar: ScrollBar,
};

// Bidirectional alias map: PascalCase → lowercase for schema compliance
function _buildAliasMap(): Record<string, string> {
  const pascalToLower: Record<string, string> = {};
  for (const [lower, pascal] of Object.entries({
    region: "Region",
    standard: "Standard",
    lov: "Lov",
    lov_select: "LovSelect",
    gridrow: "GridRow",
    gridcolumn: "GridColumn",
    inputtext: "InputText",
    textarea: "Textarea",
    select: "Select",
    checkbox: "Checkbox",
    radiogroup: "RadioGroup",
    datepicker: "DatePicker",
    numberinput: "NumberInput",
    table: "Table",
    classicreport: "ClassicReport",
    card: "Card",
    cardregions: "CardRegions",
    button: "Button",
    iconbutton: "IconButton",
    link: "Link",
    contentblock: "ContentBlock",
    contentrow: "ContentRow",
    flexboxcontainer: "FlexboxContainer",
    hero: "Hero",
    image: "Image",
    helptext: "HelpText",
    collapsible: "Collapsible",
    inlinedialog: "InlineDialog",
    buttoncontainer: "ButtonContainer",
    titlebar: "TitleBar",
    tabscontainer: "TabsContainer",
    regiondisplayselector: "RegionDisplaySelector",
    staticcontent: "StaticContent",
    plasqldynamiccontent: "PlasqlDynamicContent",
    alert: "Alert",
    badge: "Badge",
    badgeslist: "BadgesList",
    breadcrumb: "Breadcrumb",
    linkslist: "LinksList",
    listview: "ListView",
    medialist: "MediaList",
    menubar: "MenuBar",
    menupopup: "MenuPopup",
    navigationbar: "NavigationBar",
    tree: "Tree",
    wizard: "Wizard",
    interactivereport: "InteractiveReport",
    interactivegrid: "InteractiveGrid",
    columntogglereport: "ColumnToggleReport",
    reflowreport: "ReflowReport",
    contextualinfo: "ContextualInfo",
    valueattributepairs: "ValueAttributePairs",
    calendar: "Calendar",
    carousel: "Carousel",
    charts: "Charts",
    cardtemplates: "CardTemplates",
    comments: "Comments",
    metriccard: "MetricCard",
    timeline: "Timeline",
    avatar: "Avatar",
    buttongroup: "ButtonGroup",
    formfield: "FormField",
    scrollbar: "ScrollBar",
  })) {
    pascalToLower[pascal] = lower;
  }
  return pascalToLower;
}

const _pascalToLower = _buildAliasMap();

/** Normalize a component type string to its lowercase canonical form.
 *  Accepts both "InputText" (PascalCase, from schema/DB) and "inputtext"
 *  (lowercase, the internal key). Returns the canonical lowercase key or
 *  the input lowercased as fallback.
 */
export function normalizeType(type: string): string {
  const lower = _pascalToLower[type];
  return lower ?? String(type).toLowerCase();
}

export const componentRegistry: Record<string, ComponentType<any>> = registryMap;

export function getComponent(type: string): ComponentType<any> | undefined {
  return registryMap[normalizeType(type)];
}

export const componentMeta: Record<string, ComponentEntry> = {
  region: { type: Region as ComponentType<any>, displayName: "Region", category: "layout" },
  standard: { type: Standard as ComponentType<any>, displayName: "Standard", category: "layout" },
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
  table: { type: Table as ComponentType<any>, displayName: "Classic Report", category: "data" },
  classicreport: { type: ClassicReport as ComponentType<any>, displayName: "Classic Report", category: "data" },
  card: { type: Card as ComponentType<any>, displayName: "Card", category: "data" },
  cardregions: { type: Card as ComponentType<any>, displayName: "Card Regions", category: "data" },
  button: { type: Button as ComponentType<any>, displayName: "Button", category: "action" },
  iconbutton: { type: IconButton as ComponentType<any>, displayName: "Icon Button", category: "action" },
  link: { type: Link as ComponentType<any>, displayName: "Link", category: "navigation" },
  // APEX UT Layout
  contentblock: { type: ContentBlock as ComponentType<any>, displayName: "Content Block", category: "layout" },
  contentrow: { type: ContentRow as ComponentType<any>, displayName: "Content Row", category: "layout" },
  flexboxcontainer: { type: FlexboxContainer as ComponentType<any>, displayName: "Flexbox Container", category: "layout" },
  hero: { type: Hero as ComponentType<any>, displayName: "Hero", category: "layout" },
  image: { type: Image as ComponentType<any>, displayName: "Image", category: "layout" },
  helptext: { type: HelpText as ComponentType<any>, displayName: "Help Text", category: "layout" },
  collapsible: { type: Collapsible as ComponentType<any>, displayName: "Collapsible", category: "layout" },
  inlinedialog: { type: InlineDialog as ComponentType<any>, displayName: "Inline Dialog", category: "layout" },
  buttoncontainer: { type: ButtonContainer as ComponentType<any>, displayName: "Button Container", category: "layout" },
  titlebar: { type: TitleBar as ComponentType<any>, displayName: "Title Bar", category: "layout" },
  tabscontainer: { type: TabsContainer as ComponentType<any>, displayName: "Tabs Container", category: "layout" },
  regiondisplayselector: { type: RegionDisplaySelector as ComponentType<any>, displayName: "Region Display Selector", category: "layout" },
  staticcontent: { type: StaticContent as ComponentType<any>, displayName: "Static Content", category: "layout" },
  plasqldynamiccontent: { type: PlasqlDynamicContent as ComponentType<any>, displayName: "PL/SQL Dynamic Content", category: "layout" },
  // APEX UT Feedback
  alert: { type: Alert as ComponentType<any>, displayName: "Alert", category: "data" },
  badge: { type: Badge as ComponentType<any>, displayName: "Badge", category: "data" },
  badgeslist: { type: BadgesList as ComponentType<any>, displayName: "Badges List", category: "data" },
  // APEX UT Navigation
  breadcrumb: { type: Breadcrumb as ComponentType<any>, displayName: "Breadcrumb", category: "navigation" },
  linkslist: { type: LinksList as ComponentType<any>, displayName: "Links List", category: "navigation" },
  listview: { type: ListView as ComponentType<any>, displayName: "List View", category: "navigation" },
  medialist: { type: MediaList as ComponentType<any>, displayName: "Media List", category: "navigation" },
  menubar: { type: MenuBar as ComponentType<any>, displayName: "Menu Bar", category: "navigation" },
  menupopup: { type: MenuPopup as ComponentType<any>, displayName: "Menu Popup", category: "navigation" },
  navigationbar: { type: NavigationBar as ComponentType<any>, displayName: "Navigation Bar", category: "navigation" },
  tree: { type: Tree as ComponentType<any>, displayName: "Tree", category: "data" },
  wizard: { type: Wizard as ComponentType<any>, displayName: "Wizard", category: "data" },
  // APEX UT Data
  interactivereport: { type: InteractiveReport as ComponentType<any>, displayName: "Interactive Report", category: "data" },
  interactivegrid: { type: InteractiveGrid as ComponentType<any>, displayName: "Interactive Grid", category: "data" },
  columntogglereport: { type: ColumnToggleReport as ComponentType<any>, displayName: "Column Toggle Report", category: "data" },
  reflowreport: { type: ReflowReport as ComponentType<any>, displayName: "Reflow Report", category: "data" },
  contextualinfo: { type: ContextualInfo as ComponentType<any>, displayName: "Contextual Info", category: "data" },
  valueattributepairs: { type: ValueAttributePairs as ComponentType<any>, displayName: "Value Attribute Pairs", category: "data" },
  calendar: { type: Calendar as ComponentType<any>, displayName: "Calendar", category: "data" },
  carousel: { type: Carousel as ComponentType<any>, displayName: "Carousel", category: "data" },
  charts: { type: Charts as ComponentType<any>, displayName: "Charts", category: "data" },
  cardtemplates: { type: CardTemplates as ComponentType<any>, displayName: "Card Templates", category: "data" },
  comments: { type: Comments as ComponentType<any>, displayName: "Comments", category: "data" },
  metriccard: { type: MetricCard as ComponentType<any>, displayName: "Metric Card", category: "data" },
  timeline: { type: Timeline as ComponentType<any>, displayName: "Timeline", category: "data" },
  // APEX UT Partials
  avatar: { type: Avatar as ComponentType<any>, displayName: "Avatar", category: "data" },
  buttongroup: { type: ButtonGroup as ComponentType<any>, displayName: "Button Group", category: "action" },
  formfield: { type: FormField as ComponentType<any>, displayName: "Form Field", category: "form" },
  // Utility
  scrollbar: { type: ScrollBar as ComponentType<any>, displayName: "Scroll Bar", category: "layout" },
};
