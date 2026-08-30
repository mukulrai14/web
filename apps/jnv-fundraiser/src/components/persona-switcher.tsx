"use client";

import { useRef } from "react";
import { switchPersona } from "@/lib/actions";
import { PERSONAS } from "@/lib/personas";

/**
 * Demo-only identity switcher. It stands in for the OTP login a real
 * deployment would use, so a reviewer can see the app as a verified member, a
 * committee reviewer, a pending applicant and an outsider without signing up.
 */
export function PersonaSwitcher({ current }: { current: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchPersona} className="flex items-center gap-2">
      <label className="sr-only" htmlFor="persona">
        Demo identity
      </label>
      <select
        id="persona"
        name="memberId"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="max-w-[15rem] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-muted outline-none focus:border-brand"
      >
        {PERSONAS.map((persona) => (
          <option key={persona.id} value={persona.id}>
            {persona.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-xs underline">
          Switch
        </button>
      </noscript>
    </form>
  );
}
