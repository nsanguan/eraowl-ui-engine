import { create } from "zustand";
import { temporal } from "zundo";

export interface DesignComponent {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
}

interface UIState {
  pageTitle: string;
  selectedComponentId: string | null;
  canvasZoom: number;
  showGrid: boolean;
  components: DesignComponent[];

  setPageTitle: (title: string) => void;
  setSelectedComponent: (id: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  toggleGrid: () => void;
  addComponent: (type: string, defaultProps: Record<string, unknown>, name?: string) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DesignComponent>) => void;
  saveLayout: () => void;
}

let nextId = 1;

export const useUIStore = create<UIState>()(
  temporal(
    (set, get) => ({
      pageTitle: "Untitled Page",
      selectedComponentId: null,
      canvasZoom: 1,
      showGrid: true,
      components: [],

      setPageTitle: (title) => set({ pageTitle: title }),
      setSelectedComponent: (id) => set({ selectedComponentId: id }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

      addComponent: (type, defaultProps, name) => {
        const id = `comp_${Date.now()}_${nextId++}`;
        set((s) => ({
          components: [
            ...s.components,
            {
              id,
              type,
              name: name ?? `${type}_${s.components.length + 1}`,
              props: { ...defaultProps },
            },
          ],
          selectedComponentId: id,
        }));
      },

      removeComponent: (id) =>
        set((s) => ({
          components: s.components.filter((c) => c.id !== id),
          selectedComponentId:
            s.selectedComponentId === id ? null : s.selectedComponentId,
        })),

      updateComponent: (id, updates) =>
        set((s) => ({
          components: s.components.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      saveLayout: () => {
        const { components, pageTitle } = get();
        const layout = {
          version: "1.0",
          pageTitle,
          components,
        };
        localStorage.setItem("eraowl-layout", JSON.stringify(layout));
      },
    }),
    { limit: 50 },
  ),
);
