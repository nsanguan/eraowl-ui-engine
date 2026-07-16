import { useContext } from "react";
import { useFormState } from "./hooks/useFormState";
import { RuntimeFormContext } from "./RuntimeFormProvider";
import type { RuntimeFormContextValue } from "./RuntimeFormProvider";

/**
 * Access the runtime form API provided by RuntimeFormProvider.
 * Falls back to the shared store hook when no provider is present (library usage).
 */
export function useRuntimeForm(): RuntimeFormContextValue {
  const ctx = useContext(RuntimeFormContext);
  const store = useFormState();
  if (ctx) return ctx;
  return store as RuntimeFormContextValue;
}
