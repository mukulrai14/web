import Link from "next/link";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { currentMember } from "@/lib/session";
import { schoolName } from "@/lib/jnv";

const NAV = [
  { href: "/campaigns", label: "Requests" },
  { href: "/raise", label: "Raise funds" },
  { href: "/verify", label: "Verification" },
  { href: "/ledger", label: "Ledger" },
  { href: "/admin", label: "Committee" },
  { href: "/legal", label: "Legal" },
];

export async function SiteHeader() {
  const member = await currentMember();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-ink">
            नव
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">Navodaya Sahyog</span>
            <span className="block text-[11px] text-ink-muted">JNV community fund · demo</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted md:order-none md:w-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex w-full items-center gap-3 sm:w-auto">
          <div className="hidden text-right text-xs leading-tight sm:block">
            {member ? (
              <>
                <div className="font-medium">{member.fullName}</div>
                <div className="text-ink-muted">
                  {schoolName(member.schoolCode)} · {member.batchYear}
                </div>
              </>
            ) : (
              <div className="text-ink-muted">Not signed in</div>
            )}
          </div>
          <PersonaSwitcher current={member?.id ?? "guest"} />
        </div>
      </div>
    </header>
  );
}
