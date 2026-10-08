"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateVaccine, type VaccineFormState } from "./actions";
import { LABORATORIOS_SUGERIDOS } from "@/lib/laboratorios";

const initialState: VaccineFormState = {};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

function VaccineEditForm({
  vaccine,
  onClose,
}: {
  vaccine: {
    id: string;
    name: string;
    laboratory: string;
    criticalLevel: number | null;
  };
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(updateVaccine, initialState);
  const errors = state.errors ?? {};
  const listId = `laboratorios-${vaccine.id}`;

  useEffect(() => {
    if (state.message && Object.keys(state.errors ?? {}).length === 0) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="vaccineId" value={vaccine.id} />

      <div className="grid gap-2">
        <label htmlFor={`${vaccine.id}-name`} className="block text-xs font-medium text-zinc-700">
          Nombre de la Vacuna
        </label>
        <input
          id={`${vaccine.id}-name`}
          name="name"
          defaultValue={vaccine.name}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
        />
        {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}

        <label htmlFor={`${vaccine.id}-laboratory`} className="block text-xs font-medium text-zinc-700">
          Laboratorio / Origen
        </label>
        <input
          id={`${vaccine.id}-laboratory`}
          name="laboratory"
          list={listId}
          defaultValue={vaccine.laboratory}
          aria-invalid={Boolean(errors.laboratory)}
          className={inputClass}
        />
        <datalist id={listId}>
          {LABORATORIOS_SUGERIDOS.map((laboratorio) => (
            <option key={laboratorio} value={laboratorio} />
          ))}
        </datalist>
        {errors.laboratory ? (
          <p className="text-xs text-red-600">{errors.laboratory}</p>
        ) : null}

        <label htmlFor={`${vaccine.id}-criticalLevel`} className="block text-xs font-medium text-zinc-700">
          Umbral crítico
        </label>
        <input
          id={`${vaccine.id}-criticalLevel`}
          name="criticalLevel"
          type="number"
          min={0}
          step={1}
          defaultValue={vaccine.criticalLevel ?? ""}
          aria-invalid={Boolean(errors.criticalLevel)}
          className={inputClass}
        />
        {errors.criticalLevel ? (
          <p className="text-xs text-red-600">{errors.criticalLevel}</p>
        ) : null}
      </div>

      {state.message && !errors.vaccineId ? (
        <p
          role="status"
          className={
            Object.keys(errors).length > 0
              ? "text-xs text-red-600"
              : "text-xs text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <SaveButton />
      </div>
    </form>
  );
}

export function EditVaccineRow({
  vaccine,
}: {
  vaccine: {
    id: string;
    name: string;
    laboratory: string;
    criticalLevel: number | null;
  };
}) {
  const [editing, setEditing] = useState(false);
  const close = () => setEditing(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
      >
        Editar
      </button>
    );
  }

  return <VaccineEditForm vaccine={vaccine} onClose={close} />;
}