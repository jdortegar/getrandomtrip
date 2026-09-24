"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
interface ValidationIssue {
  path: string;
  code: string;
}
interface ValidationContext {
  errors: readonly ValidationIssue[];
  messages: Record<string, string> & { invalid: string };
}
const Context = createContext<ValidationContext | null>(null);
/** Opt-in, path-based validation; ordinary shared controls retain their existing behavior. */
export function FormValidationScope({
  children,
  errors,
  focusRequest = 0,
  messages,
}: ValidationContext & {
  children: ReactNode;
  focusRequest?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusRequest)
      ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);
  return (
    <Context.Provider value={{ errors, messages }}>
      <div className="contents" ref={ref}>
        {children}
      </div>
    </Context.Provider>
  );
}
export function useFieldValidation(
  name: string | undefined,
  id: string,
  describedBy?: string,
) {
  const context = useContext(Context);
  const issue = context?.errors.find((error) => error.path === name);
  const error =
    issue && context
      ? Object.hasOwn(context.messages, issue.code)
        ? context.messages[issue.code]
        : context.messages.invalid
      : undefined;
  return {
    error,
    errorId: `${id}-error`,
    attributes: {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby":
        [describedBy, error && `${id}-error`].filter(Boolean).join(" ") ||
        undefined,
    },
  };
}
