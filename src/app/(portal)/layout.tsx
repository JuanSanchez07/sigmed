import Link from "next/link";
import { getCurrentActor, isDevActorEnabled, listDevActorCandidates } from "@/lib/dev-actor";
import DevActorPicker from "./dev-actor-picker";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const devEnabled = isDevActorEnabled();
  const [actor, candidates] = devEnabled
    ? await Promise.all([getCurrentActor(), listDevActorCandidates()])
    : [null, []];

  const current = actor
    ? {
        id: actor.id,
        firstName: actor.firstName,
        lastName: actor.lastName,
        email: actor.email,
        role: actor.role,
      }
    : null;

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-slate-600">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            SigMed
          </Link>

          {devEnabled ? (
            <DevActorPicker candidates={candidates} current={current} />
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Sesion sin autenticar
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full bg-gray-300 max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
