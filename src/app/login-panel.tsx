"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  clearDevActor,
  setDevActor,
  type ActorState,
} from "@/lib/dev-actor-actions";
import type { DevActorCandidate } from "@/lib/dev-actor";

const initialState: ActorState = {};

const HOME_PER_ROLE: Record<string, string> = {
  ENFERMERA: "/enfermera/vacunas",
  ADMINISTRADOR: "/admin/horarios",
  MEDICO: "/medico/agenda",
  PACIENTE: "/paciente/historial",
};

const controlClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export function LoginPanel({
  candidates,
  current,
}: {
  candidates: DevActorCandidate[];
  current: DevActorCandidate | null;
}) {
  const [state, formAction, isPending] = useActionState(setDevActor, initialState);

  if (current) {
    const home = HOME_PER_ROLE[current.role] ?? "/enfermera/vacunas";

    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">Sesión iniciada</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {current.firstName} {current.lastName} ·{" "}
          <span className="font-medium uppercase text-zinc-800">
            {current.role}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={home}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Ir al portal
          </Link>
          <form action={clearDevActor}>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Salir
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-900">Iniciar sesión</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Elegí un perfil para operar el sistema. Sin sesión, las acciones que
        escriben en el catálogo o en stock se rechazan.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-start gap-3">
        <select
          name="actorId"
          defaultValue=""
          aria-label="Perfil para iniciar sesión"
          className={`w-72 ${controlClass}`}
        >
          <option value="">Seleccionar...</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.firstName} {candidate.lastName} · {candidate.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || candidates.length === 0}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isPending ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
      {state.error ? (
        <p role="status" className="mt-3 text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </section>
  );
}