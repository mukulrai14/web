"use client";

import { useActionState, useState } from "react";
import { applyMembership } from "@/lib/actions";
import { IDLE } from "@/lib/action-state";
import { FormResult, SubmitButton } from "@/components/form-result";
import { Card, Field, inputClass, Notice } from "@/components/ui";
import { ACCEPTED_PROOFS, RELATION_LABELS, SCHOOLS } from "@/lib/jnv";
import type { MemberRelation } from "@/lib/types";

const PROOF_KINDS = [
  { value: "transfer-certificate", label: "Transfer certificate (TC)" },
  { value: "marksheet", label: "Class 10 / 12 marksheet" },
  { value: "id-card", label: "Vidyalaya ID card" },
  { value: "appointment-letter", label: "NVS appointment letter" },
];

export function VerifyForm() {
  const [state, formAction] = useActionState(applyMembership, IDLE);
  const [relation, setRelation] = useState<MemberRelation>("alumni");

  return (
    <form action={formAction} className="space-y-5">
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name (as on the TC)">
            <input name="fullName" className={inputClass} placeholder="Ramesh Yadav" required />
          </Field>

          <Field label="Your connection to JNV">
            <select
              name="relation"
              value={relation}
              onChange={(event) => setRelation(event.target.value as MemberRelation)}
              className={inputClass}
            >
              {Object.entries(RELATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Vidyalaya">
            <select name="schoolCode" className={inputClass} defaultValue="" required>
              <option value="" disabled>
                Select your JNV
              </option>
              {SCHOOLS.map((school) => (
                <option key={school.code} value={school.code}>
                  JNV {school.district}, {school.state}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Roll / employee number">
            <input name="rollNumber" className={inputClass} placeholder="GAY/2017/098" required />
          </Field>

          <Field label="Year of admission" hint="Usually the year you joined class 6.">
            <input
              name="admissionYear"
              type="number"
              min={1985}
              max={2035}
              className={inputClass}
              placeholder="2010"
              required
            />
          </Field>

          <Field label="Batch year (class 12)">
            <input
              name="batchYear"
              type="number"
              min={1985}
              max={2035}
              className={inputClass}
              placeholder="2017"
              required
            />
          </Field>

          <Field label="Email">
            <input
              name="email"
              type="email"
              className={inputClass}
              placeholder="you@example.in"
              required
            />
          </Field>

          <Field label="Mobile number" hint="An OTP goes here in the live app.">
            <input name="phone" className={inputClass} placeholder="9876543210" required />
          </Field>

          <Field label="Current city">
            <input name="city" className={inputClass} placeholder="Gaya" required />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <Notice tone="neutral" title={`Accepted proof for ${RELATION_LABELS[relation]}`}>
          <ul className="list-disc space-y-1 pl-5">
            {ACCEPTED_PROOFS[relation].map((proof) => (
              <li key={proof}>{proof}</li>
            ))}
          </ul>
        </Notice>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document type">
            <select name="proofKind" className={inputClass} defaultValue="transfer-certificate">
              {PROOF_KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Document reference"
            hint="Demo build: describe the document instead of uploading a file."
          >
            <input
              name="proofLabel"
              className={inputClass}
              placeholder="TC — JNV Gaya, 2017, serial 4471"
              required
            />
          </Field>
        </div>

        <label className="flex gap-3 rounded-lg border border-line bg-surface-2 p-3 text-sm">
          <input type="checkbox" name="consent" className="mt-0.5" required />
          <span>
            I declare that these details are true, that I am connected to this vidyalaya, and I
            consent to the committee verifying them with NVS records and with alumni of my batch.
            Filing a false claim ends the membership and the matter is reported.
          </span>
        </label>
      </Card>

      <FormResult state={state} />
      <SubmitButton pendingLabel="Filing…">File application</SubmitButton>
    </form>
  );
}
