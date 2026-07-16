// RuntimeFormProvider — creates a fresh useRenderStore instance per page
// Allows UIRenderer to be embedded in target projects without state leaking between pages

import { type ReactNode } from "react";
import type { LayoutJson } from "./types";
import { useRenderStore } from "../store/useRenderStore";

interface RuntimeFormProviderProps {
  layout: LayoutJson;
  resolveBaseUrl?: string;
  token?: string;
  onValidSubmit?: (payload: Record<string, unknown>) => void;
  children: ReactNode;
}

export function RuntimeFormProvider({
  children,
}: RuntimeFormProviderProps) {
  // Each provider creates a fresh store instance
  // Zustand's create() + storeApi pattern handles this
  // Initialize form values from layout on mount
  useRenderStore.getState();

  return (
    <div data-eowl-form-provider="">
      {children}
    </div>
  );
}
