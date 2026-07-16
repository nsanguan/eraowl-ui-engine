import { create } from "zustand";

interface ThemeRollerState {
  draftTokens: Record<string, string | number>;
  setDraftToken: (key: string, value: string | number) => void;
  resetDraft: () => void;
  applyDraft: () => void;
}

export const useThemeRollerStore = create<ThemeRollerState>((set, get) => ({
  draftTokens: {},

  setDraftToken: (key, value) =>
    set((state) => ({
      draftTokens: { ...state.draftTokens, [key]: value },
    })),

  resetDraft: () => set({ draftTokens: {} }),

  applyDraft: () => {
    const { draftTokens } = get();
    // TODO: merge draftTokens into current theme style and persist
    console.log("Applying draft tokens:", draftTokens);
    set({ draftTokens: {} });
  },
}));
