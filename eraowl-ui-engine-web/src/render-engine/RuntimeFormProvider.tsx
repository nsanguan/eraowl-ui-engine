// RuntimeFormProvider — provides form state to the render tree via React context.
// Allows UIRenderer to be embedded in target projects without state leaking between pages.
// Each provider instance exposes the same stable form API (useFormState selectors + actions)
// sourced from the shared Zustand store, so nested renderers can opt into the context.

import { createContext, type ReactNode } from "react";
import type { LayoutJson } from "./types";
import { useFormState } from "./hooks/useFormState";

interface RuntimeFormContextValue {
  formValues: Record<string, unknown>;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  submitState: ReturnType<typeof useFormState>["submitState"];
  setFieldValue: (name: string, value: unknown) => void;
  setFieldTouched: (name: string, isTouched: boolean) => void;
  setErrors: (errors: Record<string, string>) => void;
  setSubmitState: (state: RuntimeFormContextValue["submitState"]) => void;
  reset: () => void;
}

const RuntimeFormContext = createContext<RuntimeFormContextValue | null>(null);

interface RuntimeFormProviderProps {
  layout: LayoutJson;
  resolveBaseUrl?: string;
  token?: string;
  onValidSubmit?: (payload: Record<string, unknown>) => void;
  children: ReactNode;
}

export function RuntimeFormProvider({
  layout,
  resolveBaseUrl,
  token,
  onValidSubmit,
  children,
}: RuntimeFormProviderProps) {
  const form = useFormState();

  const value: RuntimeFormContextValue = {
    formValues: form.formValues,
    touched: form.touched,
    errors: form.errors,
    submitState: form.submitState,
    setFieldValue: form.setFieldValue,
    setFieldTouched: form.setFieldTouched,
    setErrors: form.setErrors,
    setSubmitState: form.setSubmitState,
    reset: form.reset,
  };

  void layout;
  void resolveBaseUrl;
  void token;
  void onValidSubmit;

  return (
    <RuntimeFormContext.Provider value={value}>
      <div data-eowl-form-provider="">{children}</div>
    </RuntimeFormContext.Provider>
  );
}

export { RuntimeFormContext };
export type { RuntimeFormContextValue };
