import { create } from "zustand";
import type { Layout } from "../render-engine/theme/tokenTypes";

interface UIState {
  currentLayout: Layout | null;
  selectedComponentId: string | null;
  isDragging: boolean;
  history: Layout[];
  historyIndex: number;

  setCurrentLayout: (layout: Layout) => void;
  selectComponent: (id: string | null) => void;
  setDragging: (isDragging: boolean) => void;
  updateComponentOptions: (componentId: string, options: Record<string, string | boolean>) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  currentLayout: null,
  selectedComponentId: null,
  isDragging: false,
  history: [],
  historyIndex: -1,

  setCurrentLayout: (layout) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(layout);
    set({
      currentLayout: layout,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  selectComponent: (id) => set({ selectedComponentId: id }),

  setDragging: (isDragging) => set({ isDragging }),

  updateComponentOptions: (componentId, options) => {
    const { currentLayout, history, historyIndex } = get();
    if (!currentLayout) return;

    const newLayout = {
      ...currentLayout,
      components: currentLayout.components.map((comp) => {
        if (comp.id !== componentId) return comp;
        return {
          ...comp,
          templateOptions: { ...comp.templateOptions, ...options },
        };
      }),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newLayout);

    set({
      currentLayout: newLayout,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({
      currentLayout: history[newIndex],
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({
      currentLayout: history[newIndex],
      historyIndex: newIndex,
    });
  },

  pushHistory: () => {
    const { currentLayout, history, historyIndex } = get();
    if (!currentLayout) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...currentLayout });
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
}));
