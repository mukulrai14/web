"use client";

import { useActionState, useState } from "react";
import { createCampaign } from "@/lib/actions";
import { IDLE } from "@/lib/action-state";
import { FormResult, SubmitButton } from "@/components/form-result";
import { Card, Field, inputClass, Notice } from "@/components/ui";
import { CATEGORY_LABELS, MAX_GOAL_WITHOUT_TRUST, SCHOOLS } from "@/lib/jnv";
import { money } from "@/lib/format";

const BENEFICIARY_KINDS = [
  { value: "self", label: "Myself" },
  { value: "member", label: "Another Navodayan" },
  { value: "family", label: "A Navodayan's family" },
  { value: "school", label: "A vidyalaya or its students" },
];

const PROOF_KINDS = [
  { value: "hospital-estimate", label: "Hospital estimate / diagnosis report" },
  { value: "fee-receipt", label: "Fee structure or admission letter" },
  { value: "fir-copy", label: "FIR or district damage assessment" },
  { value: "bank-passbook", label: "Bank passbook of the beneficiary" },
];

export function RaiseForm({ defaultSchool }: { defaultSchool: string }) {
  const [state, formAction] = useActionState(createCampaign, IDLE);
  const [goal, setGoal] = useState(100000);
  const [tranches, setTranches] = useState([60000, 40000, 0]);

  const trancheTotal = tranches.reduce((sum, value) => sum + (value || 0), 0);
  const balanced = trancheTotal === goal;

  function setTranche(index: number, value: number) {
    setTranches((current) => current.map((row, i) => (i === index ? value : row)));
  }

  return (
    <form action={formAction} className="space-y-5">
      <Card className="space-y-4">
        <Field label="Title of the request">
          <input
            name="title"
            className={inputClass}
            placeholder="Kidney transplant for Sanjay Kumar (JNV Gaya, 2013)"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select name="category" className={inputClass} defaultValue="medical">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Who is the money for?">
            <select name="beneficiaryKind" className={inputClass} defaultValue="self">
              {BENEFICIARY_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Beneficiary name">
            <input
              name="beneficiaryName"
              className={inputClass}
              placeholder="Sanjay Kumar"
              required
            />
          </Field>

          <Field label="Vidyalaya this case belongs to">
            <select name="schoolCode" className={inputClass} defaultValue={defaultSchool} required>
              {SCHOOLS.map((school) => (
                <option key={school.code} value={school.code}>
                  JNV {school.district}, {school.state}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Amount needed (₹)"
            hint={`Anything above ${money(MAX_GOAL_WITHOUT_TRUST)} must go through the registered trust.`}
          >
            <input
              name="goalAmount"
              type="number"
              min={5000}
              step={1000}
              value={goal}
              onChange={(event) => setGoal(Number(event.target.value))}
              className={inputClass}
              required
            />
          </Field>

          <Field label="Days to collect" hint="Between 7 and 120 days.">
            <input
              name="deadlineDays"
              type="number"
              min={7}
              max={120}
              defaultValue={45}
              className={inputClass}
              required
            />
          </Field>
        </div>

        <Field label="One-line summary">
          <input
            name="summary"
            className={inputClass}
            placeholder="What is needed, by when, and how much the family has already arranged."
            required
          />
        </Field>

        <Field label="Full story" hint="Facts the committee can verify: hospital, dates, amounts.">
          <textarea name="story" rows={7} className={inputClass} required />
        </Field>
      </Card>

      <Card className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Supporting document</h3>
          <p className="mt-1 text-sm text-ink-muted">
            No request goes live without at least one verifiable document. The committee calls the
            hospital, institute or office named on it.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document type">
            <select name="proofKind" className={inputClass} defaultValue="hospital-estimate">
              {PROOF_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Document reference">
            <input
              name="proofLabel"
              className={inputClass}
              placeholder="AIIMS Patna estimate #EST-2291, ₹6,10,000"
              required
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Release plan (tranches)</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Money is released in stages against bills, never as one lump sum. The tranches must add
            up to the amount you asked for.
          </p>
        </div>

        {[0, 1, 2].map((index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <Field label={`Tranche ${index + 1}${index === 0 ? "" : " (optional)"}`}>
              <input
                name={`m${index + 1}Title`}
                className={inputClass}
                placeholder={
                  index === 0
                    ? "Pre-operative workup"
                    : index === 1
                      ? "Surgery and ICU"
                      : "Post-treatment medication"
                }
                required={index === 0}
              />
            </Field>
            <Field label="Amount (₹)">
              <input
                name={`m${index + 1}Amount`}
                type="number"
                min={0}
                step={1000}
                value={tranches[index]}
                onChange={(event) => setTranche(index, Number(event.target.value))}
                className={inputClass}
              />
            </Field>
          </div>
        ))}

        <Notice tone={balanced ? "brand" : "accent"}>
          Tranches total <strong>{money(trancheTotal)}</strong> against a goal of{" "}
          <strong>{money(goal)}</strong>
          {balanced ? " — balanced." : ` — off by ${money(Math.abs(goal - trancheTotal))}.`}
        </Notice>

        <label className="flex gap-3 rounded-lg border border-line bg-surface-2 p-3 text-sm">
          <input type="checkbox" name="declaration" className="mt-0.5" required />
          <span>
            I confirm the documents are genuine, the beneficiary has consented, and unused funds go
            back to the community corpus. I will file bills for every released tranche.
          </span>
        </label>
      </Card>

      <FormResult state={state} />
      <SubmitButton pendingLabel="Filing…">Submit for committee review</SubmitButton>
    </form>
  );
}
