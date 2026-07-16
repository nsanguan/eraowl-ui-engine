import { create } from 'zustand'
import { temporal } from 'zundo'

interface ThemeRollerState {
  draftTokens: Record<string, unknown>
  setDraftToken: (path: string, value: unknown) => void
  resetDraft: () => void
}

export const useThemeRollerStore = create<ThemeRollerState>()(
  temporal(
    (set) => ({
      draftTokens: {},
      setDraftToken: (path, value) =>
        set((s) => ({ draftTokens: { ...s.draftTokens, [path]: value } })),
      resetDraft: () => set({ draftTokens: {} }),
    }),
    { limit: 30 }
  )
)
