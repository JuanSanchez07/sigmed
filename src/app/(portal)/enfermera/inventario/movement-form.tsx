"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { createStockMovement, type MovementFormState } from "./actions";

const initialState: MovementFormState = {};

export type VaccineOption = {
  id: string;
  name: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Registrando..." : "Registrar Movimiento"}
    </button>
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

export function MovementForm({ vaccines }: { vaccines: VaccineOption[] }) {
  const [state, formAction] = useActionState(createStockMovement, initialState);
  const [type, setType] = useState(
    state.values?.movementType === "AJUSTE" ? "AJUSTE" : "INGRESO",
  );
  const errors = state.errors ?? {};
  const isAdjustment = type === "AJUSTE";

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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="vaccineId" label="Seleccionar Vacuna del Catálogo" error={errors.vaccineId}>
          <select
            id="vaccineId"
            name="vaccineId"
            defaultValue={state.values?.vaccineId ?? ""}
            aria-invalid={Boolean(errors.vaccineId)}
            aria-describedby={errors.vaccineId ? "vaccineId-error" : undefined}
            className={controlClass}
          >
            <option value="">Seleccionar...</option>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>
                {vaccine.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="movementType"
          label="Tipo de movimiento"
          hint={
            isAdjustment
              ? "Correccion tecnica: usa negativo para descontar o positivo para sumar."
              : "Las salidas por turno se generan al aprobar un turno de vacunacion."
          }
          error={errors.movementType}
        >
          <select
            id="movementType"
            name="movementType"
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-invalid={Boolean(errors.movementType)}
            aria-describedby={errors.movementType ? "movementType-error" : undefined}
            className={controlClass}
          >
            <option value="INGRESO">Ingreso</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
        </Field>

        <Field id="lotNumber" label="Lote" error={errors.lotNumber}>
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

        <Field
          id="expiresAt"
          label="Fecha de vencimiento"
          hint={
            isAdjustment
              ? "No se usa en ajustes: se aplica sobre un lote ya cargado."
              : "Solo se usa cuando el lote se carga por primera vez."
          }
          error={errors.expiresAt}
        >
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={state.values?.expiresAt}
            disabled={isAdjustment}
            aria-invalid={Boolean(errors.expiresAt)}
            aria-describedby={errors.expiresAt ? "expiresAt-error" : undefined}
            className={`${controlClass} disabled:bg-zinc-100`}
          />
        </Field>

        <Field
          id="quantity"
          label="Cantidad"
          hint={isAdjustment ? "Puede ser negativa para descontar." : undefined}
          error={errors.quantity}
        >
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={isAdjustment ? undefined : 1}
            step={1}
            defaultValue={state.values?.quantity}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
            className={controlClass}
            placeholder={isAdjustment ? "-5" : "10"}
          />
        </Field>

        <Field
          id="reason"
          label="Motivo"
          hint={isAdjustment ? "Obligatorio para ajustes." : "Opcional."}
          error={errors.reason}
        >
          <input
            id="reason"
            name="reason"
            defaultValue={state.values?.reason}
            className={controlClass}
            placeholder={isAdjustment ? "Correccion de conteo" : "Recepcion de lote"}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="reset"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}