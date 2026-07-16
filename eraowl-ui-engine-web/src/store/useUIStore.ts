import { create } from 'zustand'
import { temporal } from 'zundo'

interface UIState {
  selectedComponentId: string | null
  canvasZoom: number
  showGrid: boolean
  setSelectedComponent: (id: string | null) => void
  setCanvasZoom: (zoom: number) => void
  toggleGrid: () => void
}

export const useUIStore = create<UIState>()(
  temporal(
    (set) => ({
      selectedComponentId: null,
      canvasZoom: 1,
      showGrid: true,
      setSelectedComponent: (id) => set({ selectedComponentId: id }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    }),
    { limit: 50 }
  )
)
