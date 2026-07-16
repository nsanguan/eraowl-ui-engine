import { useQuery } from "@tanstack/react-query";
import type { ThemeStyle } from "../theme/tokenTypes";

export function useThemeStyle(styleName: string) {
  return useQuery({
    queryKey: ["theme-style", styleName],
    queryFn: async (): Promise<ThemeStyle> => {
      const response = await import(`../../themes/eut/styles/${styleName}.json`);
      return response.default ?? response;
    },
    staleTime: Infinity,
    enabled: !!styleName,
  });
}
