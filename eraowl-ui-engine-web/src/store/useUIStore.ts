import { create } from "zustand";
import { temporal } from "zundo";

export interface DesignComponent {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
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
  addComponent: (type: string, defaultProps: Record<string, unknown>, name?: string, parentId?: string | null) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<DesignComponent>) => void;
  moveComponent: (id: string, newParentId: string | null, index: number) => void;
  getChildren: (parentId: string | null) => DesignComponent[];
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

      addComponent: (type, defaultProps, name, parentId = null) => {
        const id = `comp_${Date.now()}_${nextId++}`;
        set((s) => ({
          components: [
            ...s.components,
            {
              id,
              type,
              name: name ?? `${type}_${s.components.length + 1}`,
              parentId,
              props: { ...defaultProps },
            },
          ],
          selectedComponentId: id,
        }));
      },

      removeComponent: (id) =>
        set((s) => {
          const component = s.components.find((c) => c.id === id);
          if (!component) return s;

          const removeDescendants = (parentId: string): string[] => {
            const children = s.components.filter((c) => c.parentId === parentId);
            const ids = children.map((c) => c.id);
            for (const child of children) {
              ids.push(...removeDescendants(child.id));
            }
            return ids;
          };

          const idsToRemove = [id, ...removeDescendants(id)];
          return {
            components: s.components.filter((c) => !idsToRemove.includes(c.id)),
            selectedComponentId:
              s.selectedComponentId === id ? null : s.selectedComponentId,
          };
        }),

      updateComponent: (id, updates) =>
        set((s) => ({
          components: s.components.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        })),

      moveComponent: (id, newParentId, index) =>
        set((s) => {
          const component = s.components.find((c) => c.id === id);
          if (!component) return s;

          const siblings = s.components.filter(
            (c) => c.parentId === newParentId && c.id !== id,
          );
          siblings.splice(index, 0, { ...component, parentId: newParentId });

          const otherComponents = s.components.filter(
            (c) => c.parentId !== newParentId && c.id !== id,
          );

          return {
            components: [...otherComponents, ...siblings],
          };
        }),

      getChildren: (parentId) => {
        return get().components.filter((c) => c.parentId === parentId);
      },

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
