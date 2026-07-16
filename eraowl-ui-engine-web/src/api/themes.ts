import { apiClient } from "./client";
import type { ThemeStyle, Tokens } from "../render-engine/theme/tokenTypes";

export interface ThemeStyleListResponse {
  styles: ThemeStyle[];
  total: number;
}

export interface ThemeStyleCreateRequest {
  name: string;
  displayName: string;
  baseStyle: string;
  overrides?: Tokens;
  componentOverrides?: Record<string, Tokens>;
}

export const themesApi = {
  listStyles: () =>
    apiClient.get<ThemeStyleListResponse>("/themes/styles"),

  getStyle: (name: string) =>
    apiClient.get<ThemeStyle>(`/themes/styles/${name}`),

  createStyle: (style: ThemeStyleCreateRequest) =>
    apiClient.post<ThemeStyle>("/themes/styles", style),

  updateStyle: (name: string, style: Partial<ThemeStyle>) =>
    apiClient.put<ThemeStyle>(`/themes/styles/${name}`, style),

  deleteStyle: (name: string) =>
    apiClient.delete<void>(`/themes/styles/${name}`),

  previewTokens: (styleName: string, overrides?: Tokens) =>
    apiClient.post<Tokens>("/themes/preview", { styleName, overrides }),
};
