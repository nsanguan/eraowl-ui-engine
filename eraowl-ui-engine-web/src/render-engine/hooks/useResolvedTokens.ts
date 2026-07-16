import { useQuery } from "@tanstack/react-query";
import { resolveTokens } from "../theme/tokenResolver";
import type { Tokens } from "../theme/tokenTypes";

export function useResolvedTokens(themeStyleName: string): Tokens {
  const { data: baseTokens } = useQuery({
    queryKey: ["base-tokens"],
    queryFn: async (): Promise<Tokens> => {
      const response = await import("../../themes/eut/tokens.base.json");
      return response.default ?? response;
    },
    staleTime: Infinity,
  });

  const { data: themeStyle } = useQuery({
    queryKey: ["theme-style", themeStyleName],
    queryFn: async () => {
      const response = await import(`../../themes/eut/styles/${themeStyleName}.json`);
      return response.default ?? response;
    },
    staleTime: Infinity,
    enabled: !!themeStyleName,
  });

  return resolveTokens(baseTokens ?? {}, themeStyle);
}
