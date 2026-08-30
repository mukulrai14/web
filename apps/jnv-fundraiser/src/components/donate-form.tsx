"use client";

import { useActionState, useState } from "react";
import { donate } from "@/lib/actions";
import { IDLE } from "@/lib/action-state";
import { FormResult, SubmitButton } from "@/components/form-result";
import { Field, inputClass, Notice } from "@/components/ui";
import { PAN_REQUIRED_ABOVE } from "@/lib/jnv";
import { money } from "@/lib/format";

const QUICK_AMOUNTS = [1000, 2500, 5000, 11000];

export function DonateForm({ campaignId, remaining }: { campaignId: string; remaining: number }) {
  const [state, formAction] = useActionState(donate, IDLE);
  const [amount, setAmount] = useState(2500);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />

      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(value)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              amount === value
                ? "border-brand bg-brand-soft text-brand"
                : "border-line bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {money(value)}
          </button>
        ))}
      </div>

      <Field label="Amount (₹)" hint={`${money(remaining)} still needed.`}>
        <input
          name="amount"
          type="number"
          min={100}
          step={100}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Payment method">
        <select name="method" className={inputClass} defaultValue="upi">
          <option value="upi">UPI</option>
          <option value="netbanking">Net banking</option>
          <option value="card">Card</option>
          <option value="cheque">Cheque to the trust</option>
        </select>
      </Field>

      {amount > PAN_REQUIRED_ABOVE ? (
        <Field label="PAN" hint="Required above ₹2,000 so your 80G receipt is valid.">
          <input name="pan" className={inputClass} placeholder="ABCDE1234F" required />
        </Field>
      ) : null}

      <Field label="Message to the family (optional)">
        <input
          name="message"
          className={inputClass}
          maxLength={200}
          placeholder="Batch of 2015 is with you."
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="anonymous" />
        Hide my name on the public ledger (the committee still sees it)
      </label>

      <Notice tone="neutral">
        Money goes into the trust&rsquo;s nodal account, not to the organiser. Cash is never
        accepted, and foreign-currency contributions are blocked without FCRA clearance.
      </Notice>

      <FormResult state={state} />
      <SubmitButton pendingLabel="Recording…">Contribute</SubmitButton>
    </form>
  );
}
