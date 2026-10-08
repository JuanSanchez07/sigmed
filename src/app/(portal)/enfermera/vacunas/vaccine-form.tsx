"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createVaccine, type VaccineFormState } from "./actions";
import { LABORATORIOS_SUGERIDOS } from "@/lib/laboratorios";

const initialState: VaccineFormState = {};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Guardando..." : "Guardar en Catálogo"}
    </button>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">
      {children}
    </h3>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export function VaccineForm() {
  const [state, formAction] = useActionState(createVaccine, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <p
          role="status"
          className={
            Object.keys(errors).length > 0
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <SectionTitle>Datos del Biológico a Incorporar</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Nombre de la Vacuna" error={errors.name}>
            <input
              id="name"
              name="name"
              defaultValue={state.values?.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={controlClass}
              placeholder="Triple viral"
            />
          </Field>

          <Field
            id="laboratory"
            label="Laboratorio / Origen"
            error={errors.laboratory}
          >
            <input
              id="laboratory"
              name="laboratory"
              list="laboratorios-sugeridos"
              defaultValue={state.values?.laboratory}
              aria-invalid={Boolean(errors.laboratory)}
              aria-describedby={
                errors.laboratory ? "laboratory-error" : undefined
              }
              className={controlClass}
              placeholder="Seleccionar opción o escribir..."
            />
            <datalist id="laboratorios-sugeridos">
              {LABORATORIOS_SUGERIDOS.map((laboratorio) => (
                <option key={laboratorio} value={laboratorio} />
              ))}
            </datalist>
          </Field>
        </div>
      </div>

      <div>
        <SectionTitle>Configuración de Inventario Inicial</SectionTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="lotNumber" label="Lote Inicial" error={errors.lotNumber}>
            <input
              id="lotNumber"
              name="lotNumber"
              defaultValue={state.values?.lotNumber}
              aria-invalid={Boolean(errors.lotNumber)}
              aria-describedby={errors.lotNumber ? "lotNumber-error" : undefined}
              className={controlClass}
              placeholder="L-2026-001"
            />
          </Field>

          <Field id="expiresAt" label="Fecha de Vencimiento" error={errors.expiresAt}>
            <input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={state.values?.expiresAt}
              aria-invalid={Boolean(errors.expiresAt)}
              aria-describedby={errors.expiresAt ? "expiresAt-error" : undefined}
              className={controlClass}
            />
          </Field>

          <Field id="quantity" label="Cantidad Ingresada" error={errors.quantity}>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              defaultValue={state.values?.quantity}
              aria-invalid={Boolean(errors.quantity)}
              aria-describedby={errors.quantity ? "quantity-error" : undefined}
              className={controlClass}
              placeholder="120"
            />
          </Field>

          <Field
            id="criticalLevel"
            label="Nivel Stock Crítico"
            hint="Opcional. El sistema avisa cuando el stock total cae por debajo de este número."
            error={errors.criticalLevel}
          >
            <input
              id="criticalLevel"
              name="criticalLevel"
              type="number"
              min={0}
              step={1}
              defaultValue={state.values?.criticalLevel}
              aria-invalid={Boolean(errors.criticalLevel)}
              aria-describedby={
                errors.criticalLevel ? "criticalLevel-error" : undefined
              }
              className={controlClass}
              placeholder="20"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="reset"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <SaveButton />
      </div>
    </form>
  );
}