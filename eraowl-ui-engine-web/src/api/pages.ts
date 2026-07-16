import { apiClient } from "./client";
import type { Page } from "../render-engine/theme/tokenTypes";

export interface PageListResponse {
  pages: Page[];
  total: number;
}

export const pagesApi = {
  list: (params?: { offset?: number; limit?: number }) =>
    apiClient.get<PageListResponse>("/pages", { params: params as Record<string, string> }),

  get: (id: string) => apiClient.get<Page>(`/pages/${id}`),

  create: (page: Omit<Page, "id">) =>
    apiClient.post<Page>("/pages", page),

  update: (id: string, page: Partial<Page>) =>
    apiClient.put<Page>(`/pages/${id}`, page),

  delete: (id: string) =>
    apiClient.delete<void>(`/pages/${id}`),
};
