"use client";

import { useActionState, useEffect, useState } from "react";
import { clearDevActor, setDevActor, type ActorState } from "@/lib/dev-actor-actions";
import type { DevActorCandidate } from "@/lib/dev-actor";

const initialState: ActorState = {};

export default function DevActorPicker({
  candidates,
  current,
}: {
  candidates: DevActorCandidate[];
  current: DevActorCandidate | null;
}) {
  const [state, formAction, isPending] = useActionState(setDevActor, initialState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="dev-actor-menu"
        className={
          current
            ? "rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
            : "rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
        }
      >
        {current
          ? `${current.firstName} ${current.lastName}`
          : "Sesion sin autenticar"}
      </button>

      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => setOpen(false)}
        hidden={!open}
        className="fixed inset-0 z-40 cursor-default"
      />

      <div
        id="dev-actor-menu"
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
      >
        <form action={formAction} className="flex flex-col">
          <p className="border-b border-zinc-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Elegi un usuario
          </p>

          {candidates.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-600">
              No hay usuarios disponibles.
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {candidates.map((candidate) => {
                const isCurrent = candidate.id === current?.id;

                return (
                  <li key={candidate.id}>
                    <button
                      type="submit"
                      name="actorId"
                      value={candidate.id}
                      onClick={() => setOpen(false)}
                      disabled={isPending}
                      className={
                        isCurrent
                          ? "flex w-full items-center justify-between gap-2 bg-zinc-50 px-3 py-2 text-left"
                          : "flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition hover:bg-zinc-50 disabled:opacity-50"
                      }
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900">
                          {candidate.firstName} {candidate.lastName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {candidate.email}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-600">
                        {candidate.role}
                      </span>
                      {isCurrent ? (
                        <span className="text-xs font-medium text-zinc-500">
                          Actual
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {current ? (
            <div className="border-t border-zinc-100 px-3 py-2">
              <button
                type="submit"
                formAction={clearDevActor}
                disabled={isPending}
                className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                Salir
              </button>
            </div>
          ) : (
            <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-600">
              Sin actor, las acciones que escriben en stock van a fallar.
            </p>
          )}
        </form>
      </div>

      {!open && state.error ? (
        <p className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
