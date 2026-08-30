"use client";

import { useFormStatus } from "react-dom";
import { Button, Notice } from "@/components/ui";
import type { ActionState } from "@/lib/action-state";

export function FormResult({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;

  return (
    <div className="space-y-2">
      <Notice tone={state.status === "ok" ? "brand" : "danger"} title={state.message}>
        {state.errors?.length ? (
          <ul className="list-disc space-y-1 pl-5">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}
        {state.status === "ok" && !state.errors?.length ? (
          <span>Keep an eye on this page for the next step.</span>
        ) : null}
      </Notice>

      {state.flags?.length ? (
        <Notice tone="accent" title="Flagged for the review committee">
          <ul className="list-disc space-y-1 pl-5">
            {state.flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
