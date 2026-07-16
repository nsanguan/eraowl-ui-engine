// Shared types for eraowl-ui-engine
// Used by both Render Engine and Designer

// ─── Layout Types ────────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Styles {
  fontSize?: string;
  fontColor?: string;
}

export interface DataSource {
  dataSourceRef: string;
  dataSourceType: "REGISTERED_QUERY";
  params?: Record<string, unknown>;
}

export interface Validation {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  customResolver?: string;
}

export interface FormBinding {
  field?: string;
  subscribesToForm?: boolean;
}

export interface Component {
  id: string;
  type: "Region" | "Lov" | "LovSelect";
  position: Position;
  styleRef?: string;
  templateOptions?: Record<string, string | boolean | number>;
  styles?: Styles;
  depends_on?: string[];
  dataSource?: DataSource;
  validation?: Validation;
  formBinding?: FormBinding;
}

export interface Region {
  id: string;
  title: string;
  components: Component[];
}

export interface LayoutJson {
  schemaVersion: "1.0.0";
  styleRef?: string;
  regions: Region[];
}

// ─── Component Props ─────────────────────────────────────────────

export interface ComponentProps {
  layout: LayoutJson;
  component: Component;
  onValidSubmit?: (payload: Record<string, unknown>) => void;
  resolveBaseUrl?: string;
  token?: string;
}

// ─── Form State Types ────────────────────────────────────────────

export type SubmitState = "idle" | "validating" | "ready" | "submitting" | "error";

export interface FormStatus {
  isValid: boolean;
  canSubmit: boolean;
  errors: Record<string, string[]>;
  submitState: SubmitState;
}

// ─── Theme Types ─────────────────────────────────────────────────

export interface ThemeTokens {
  color: {
    bg: string;
    fg: string;
    accent: string;
    muted: string;
    success: string;
    danger: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    density: "compact" | "cozy" | "comfortable";
    unit: number;
  };
  typography: {
    fontFamily: string;
    fontSizeBase: string;
    fontWeightBody: string | number;
    fontWeightHead: string | number;
  };
  shadow?: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface TemplateOptionDef {
  type: "string" | "boolean" | "number";
  enum?: string[];
  default: string | boolean | number | null;
  appliesClass: string;
}

export interface ThemeStyle {
  styleKey: string;
  displayName: string;
  delta: Partial<ThemeTokens>;
  isDefault?: boolean;
}

export interface ThemeBundle {
  themeId: string;
  displayName?: string;
  tokens: ThemeTokens;
  templateOptions: Record<string, Record<string, TemplateOptionDef>>;
  styles?: ThemeStyle[];
}

export type Token = string | number | boolean;

// ─── Codegen Types ───────────────────────────────────────────────

export interface CodegenTarget {
  id: string;
  pageId: string;
  projectRoot: string;
  targetSubpath: string;
  allowedWriteGlobs: string[];
  frameworkDetected?: string;
  lastScannedAt?: string;
  lastGeneratedAt?: string;
  lastCommitSha?: string;
}

export interface CodegenRun {
  id: string;
  codegenTargetId: string;
  dryRun: boolean;
  diffSummary?: string;
  filesChanged?: string[];
  approvedBy?: string;
  status: "pending" | "approved" | "applied" | "rejected";
}
