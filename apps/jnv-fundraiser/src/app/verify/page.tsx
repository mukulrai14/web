import { MemberStatusBadge } from "@/components/badges";
import { VerifyForm } from "@/components/verify-form";
import { Button, Card, Empty, Notice, Pill, SectionTitle, inputClass } from "@/components/ui";
import { vouchForMember } from "@/lib/actions";
import { listMembers } from "@/lib/db";
import { ACCEPTED_PROOFS, REQUIRED_VOUCHES, RELATION_LABELS, schoolName } from "@/lib/jnv";
import { day, timeAgo } from "@/lib/format";
import { currentMember } from "@/lib/session";

export default async function VerifyPage() {
  const me = await currentMember();
  const members = listMembers();
  const pending = members.filter((member) => member.status === "pending");

  // A vouch only counts from a verified member of the same vidyalaya — that is
  // what makes it hard to fake your way into the circle.
  const canVouchFor =
    me?.status === "verified"
      ? pending.filter(
          (applicant) =>
            applicant.id !== me.id &&
            applicant.schoolCode === me.schoolCode &&
            !applicant.vouches.some((vouch) => vouch.byMemberId === me.id),
        )
      : [];

  return (
    <div className="space-y-10">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Membership verification</h1>
        <p className="text-sm text-ink-muted">
          Yeh circle band hai. Sirf woh log andar aa sakte hain jinka Jawahar Navodaya Vidyalaya se
          sach me rishta hai — students, alumni, teachers aur unke parivaar. Verification teen
          cheezon par tikta hai: aapke documents, aapke batch ke logon ki gawahi, aur committee ka
          final faisla.
        </p>
      </div>

      {me ? (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold tracking-tight">{me.fullName}</div>
              <div className="text-sm text-ink-muted">
                {RELATION_LABELS[me.relation]} · {schoolName(me.schoolCode)} · batch {me.batchYear}{" "}
                · roll {me.rollNumber}
              </div>
            </div>
            <MemberStatusBadge status={me.status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="text-xs text-ink-muted">Documents</div>
              <div className="mt-1 text-sm">
                {me.documents.length
                  ? me.documents.map((document) => document.label).join(", ")
                  : "None on file"}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="text-xs text-ink-muted">
                Vouches ({me.vouches.length}/{REQUIRED_VOUCHES})
              </div>
              <div className="mt-1 text-sm">
                {me.vouches.length
                  ? me.vouches.map((vouch) => `${vouch.byName} (${vouch.byBatch})`).join(", ")
                  : "Waiting for members of your batch"}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <div className="text-xs text-ink-muted">Payout KYC</div>
              <div className="mt-1 text-sm">
                {me.kycVerified ? "Cleared" : "Pending — needed only to receive funds"}
              </div>
            </div>
          </div>

          {me.status === "pending" ? (
            <Notice tone="accent" title="Application is with the committee">
              Applied {timeAgo(me.appliedAt)}. You need{" "}
              {Math.max(0, REQUIRED_VOUCHES - me.vouches.length)} more vouch(es) from verified
              members of {schoolName(me.schoolCode)}, then a committee decision. Until then you can
              browse, but not raise or contribute.
            </Notice>
          ) : me.status === "verified" ? (
            <Notice tone="brand" title="You are in">
              Verified on {me.reviewedAt ? day(me.reviewedAt) : "record"} by {me.reviewedBy}. You
              can raise requests, contribute, and vouch for people from your own vidyalaya.
            </Notice>
          ) : (
            <Notice tone="danger" title="Application rejected">
              {me.reviewNote || "The documents could not be verified."}
            </Notice>
          )}
        </Card>
      ) : (
        <Notice tone="neutral" title="You are browsing as a guest">
          Anyone can read the requests. To contribute or raise one, file the application below.
        </Notice>
      )}

      {canVouchFor.length ? (
        <section>
          <SectionTitle
            title="People from your vidyalaya waiting for a vouch"
            hint="Vouch only for people you actually know. A false vouch is traced back to you."
          />
          <div className="space-y-3">
            {canVouchFor.map((applicant) => (
              <Card key={applicant.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{applicant.fullName}</div>
                    <div className="text-sm text-ink-muted">
                      {RELATION_LABELS[applicant.relation]} · batch {applicant.batchYear} · roll{" "}
                      {applicant.rollNumber}
                    </div>
                  </div>
                  <Pill tone="accent">
                    {applicant.vouches.length}/{REQUIRED_VOUCHES} vouches
                  </Pill>
                </div>
                <form action={vouchForMember} className="flex flex-wrap gap-2">
                  <input type="hidden" name="memberId" value={applicant.id} />
                  <input
                    name="note"
                    className={`${inputClass} sm:max-w-md`}
                    placeholder="How do you know them?"
                  />
                  <Button type="submit" tone="neutral">
                    I vouch for them
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {!me || me.status === "rejected" ? (
        <section>
          <SectionTitle
            title="File a membership application"
            hint="Takes two minutes. The committee usually responds within 72 hours."
          />
          <VerifyForm />
        </section>
      ) : null}

      <section>
        <SectionTitle title="What counts as proof" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(ACCEPTED_PROOFS).map(([relation, proofs]) => (
            <Card key={relation}>
              <h3 className="text-sm font-semibold">
                {RELATION_LABELS[relation as keyof typeof RELATION_LABELS]}
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {proofs.map((proof) => (
                  <li key={proof}>{proof}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        {pending.length ? (
          <p className="mt-4 text-sm text-ink-muted">
            {pending.length} application(s) currently in the queue.
          </p>
        ) : (
          <Empty>No applications in the queue.</Empty>
        )}
      </section>
    </div>
  );
}
