import { apiClient } from "./client";
import type { Layout } from "../render-engine/theme/tokenTypes";

export interface LayoutListResponse {
  layouts: Layout[];
  total: number;
}

export const layoutsApi = {
  list: (params?: { offset?: number; limit?: number }) =>
    apiClient.get<LayoutListResponse>("/layouts", { params: params as Record<string, string> }),

  get: (id: string) => apiClient.get<Layout>(`/layouts/${id}`),

  create: (layout: Omit<Layout, "id">) =>
    apiClient.post<Layout>("/layouts", layout),

  update: (id: string, layout: Partial<Layout>) =>
    apiClient.put<Layout>(`/layouts/${id}`, layout),

  delete: (id: string) =>
    apiClient.delete<void>(`/layouts/${id}`),

  validate: (layout: Layout) =>
    apiClient.post<{ valid: boolean; errors: string[] }>("/layouts/validate", layout),
};
