import { apiClient } from "./client";

export interface CodegenTarget {
  id: string;
  page_id: string;
  project_root: string;
  target_subpath: string;
  allowed_write_globs: string[];
  framework_detected: string | null;
  last_scanned_at: string | null;
  last_generated_at: string | null;
  last_commit_sha: string | null;
  created_at: string;
}

export interface CodegenTargetCreate {
  page_id: string;
  project_root: string;
  target_subpath: string;
  allowed_write_globs?: string[];
}

export interface ScanResult {
  framework_detected: string;
  component_style: string;
}

export interface CodegenRequest {
  page_id?: string;
  layout?: Record<string, unknown>;
}

export interface CodegenResponse {
  dry_run: boolean;
  diffs: Record<string, string | null>;
  files_changed: string[];
  run_id: string | null;
}

export const codegenTargetsApi = {
  /** Create a new codegen target for a page */
  create: (payload: CodegenTargetCreate) =>
    apiClient.post<CodegenTarget>("/v1/codegen-targets", payload),

  /** List codegen targets, optionally filtered by page_id */
  list: (pageId?: string) => {
    const params: Record<string, string> = {};
    if (pageId) params.page_id = pageId;
    return apiClient.get<CodegenTarget[]>("/v1/codegen-targets", {
      params,
    });
  },

  /** Get a single codegen target by ID */
  get: (targetId: string) =>
    apiClient.get<CodegenTarget>(`/v1/codegen-targets/${targetId}`),

  /** Delete a codegen target */
  delete: (targetId: string) =>
    apiClient.delete<void>(`/v1/codegen-targets/${targetId}`),

  /** Scan a target's project root to detect framework and convention */
  scan: (targetId: string) =>
    apiClient.get<ScanResult>(`/v1/codegen-targets/${targetId}/scan`),

  /** Generate code for a target */
  generate: (targetId: string, request: CodegenRequest, dryRun = true) => {
    const params: Record<string, string> = { dry_run: String(dryRun) };
    return apiClient.post<CodegenResponse>(
      `/v1/codegen-targets/${targetId}/generate`,
      request,
      { params },
    );
  },
};
