import { create } from "zustand";

interface CodegenPreview {
  filePath: string;
  originalContent: string;
  generatedContent: string;
}

interface CodegenState {
  isGenerating: boolean;
  previews: CodegenPreview[];
  approvedFiles: Set<string>;
  error: string | null;

  setGenerating: (generating: boolean) => void;
  setPreviews: (previews: CodegenPreview[]) => void;
  approveFile: (filePath: string) => void;
  approveAll: () => void;
  rejectFile: (filePath: string) => void;
  rejectAll: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCodegenStore = create<CodegenState>((set) => ({
  isGenerating: false,
  previews: [],
  approvedFiles: new Set<string>(),
  error: null,

  setGenerating: (isGenerating) => set({ isGenerating }),

  setPreviews: (previews) => set({ previews, approvedFiles: new Set() }),

  approveFile: (filePath) =>
    set((state) => {
      const newSet = new Set(state.approvedFiles);
      newSet.add(filePath);
      return { approvedFiles: newSet };
    }),

  approveAll: () =>
    set((state) => ({
      approvedFiles: new Set(state.previews.map((p) => p.filePath)),
    })),

  rejectFile: (filePath) =>
    set((state) => {
      const newSet = new Set(state.approvedFiles);
      newSet.delete(filePath);
      return { approvedFiles: newSet };
    }),

  rejectAll: () => set({ approvedFiles: new Set() }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      isGenerating: false,
      previews: [],
      approvedFiles: new Set(),
      error: null,
    }),
}));
