import { apiClient } from "./client";

export interface CodegenTarget {
  id: string;
  name: string;
  framework: string;
  outputPath: string;
}

export interface CodegenRequest {
  layoutId: string;
  targetId: string;
  options?: Record<string, unknown>;
}

export interface CodegenResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  files: Array<{
    filePath: string;
    originalContent?: string;
    generatedContent: string;
  }>;
}

export const codegenTargetsApi = {
  listTargets: () =>
    apiClient.get<CodegenTarget[]>("/codegen/targets"),

  generate: (request: CodegenRequest) =>
    apiClient.post<CodegenResponse>("/codegen/generate", request),

  getStatus: (jobId: string) =>
    apiClient.get<CodegenResponse>(`/codegen/jobs/${jobId}`),

  approve: (jobId: string, filePaths: string[]) =>
    apiClient.post<void>(`/codegen/jobs/${jobId}/approve`, { filePaths }),
};
