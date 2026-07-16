import { create } from "zustand";
import { temporal } from "zundo";
import { apiClient } from "../api/client";

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
  reorderWithinParent: (id: string, newIndex: number) => void;
  getChildren: (parentId: string | null) => DesignComponent[];
  saveLayout: () => void;
}

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
        const id = `comp_${crypto.randomUUID()}`;
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

          // Prevent moving a component into one of its own descendants
          const descendantIds = new Set<string>();
          const collect = (parentId: string) => {
            for (const c of s.components) {
              if (c.parentId === parentId) {
                descendantIds.add(c.id);
                collect(c.id);
              }
            }
          };
          collect(id);
          if (newParentId !== null && descendantIds.has(newParentId)) return s;

          const without = s.components.filter((c) => c.id !== id);
          const updated: DesignComponent = { ...component, parentId: newParentId };

          const siblings = without.filter((c) => c.parentId === newParentId);
          const others = without.filter((c) => c.parentId !== newParentId);

          const clampedIndex = Math.max(0, Math.min(index, siblings.length));
          siblings.splice(clampedIndex, 0, updated);

          return {
            components: [...others, ...siblings],
          };
        }),

      reorderWithinParent: (id, newIndex) =>
        set((s) => {
          const component = s.components.find((c) => c.id === id);
          if (!component) return s;

          const siblings = s.components.filter(
            (c) => c.parentId === component.parentId && c.id !== id,
          );
          const others = s.components.filter(
            (c) => c.parentId !== component.parentId && c.id !== id,
          );

          const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));
          siblings.splice(clampedIndex, 0, component);

          return {
            components: [...others, ...siblings],
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
        // Persist to localStorage as local backup
        localStorage.setItem("eraowl-layout", JSON.stringify(layout));

        // Build a recursive component tree from the flat `components` array.
        const buildTree = (parentId: string | null): Record<string, unknown>[] =>
          components
            .filter((c) => c.parentId === parentId)
            .map((c) => ({
              id: c.id,
              type: c.type,
              position: c.props.position ?? { x: 0, y: 0, width: 200, height: 40 },
              ...c.props,
              // Recursively include children if this component has any
              ...(components.some((child) => child.parentId === c.id)
                ? { components: buildTree(c.id) }
                : {}),
            }));

        // Persist to backend API
        const pageId = localStorage.getItem("eraowl-current-page-id");
        if (pageId) {
          apiClient
            .post("/v1/layouts", {
              page_id: pageId,
              layout_json: {
                schemaVersion: "1.0.0",
                regions: buildTree(null),
              },
            })
            .catch((err: unknown) => {
              console.error("Failed to save layout to API:", err);
            });
        }
      },
    }),
    { limit: 50 },
  ),
);
