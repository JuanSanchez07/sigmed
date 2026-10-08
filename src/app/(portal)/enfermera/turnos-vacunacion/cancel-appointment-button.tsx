"use client";

import { useActionState } from "react";
import { cancelVaccinationAppointment, type CancelState } from "./actions";

const initialState: CancelState = {};

export function CancelAppointmentButton({
  appointmentId,
  description,
}: {
  appointmentId: string;
  description: string;
}) {
  const [state, formAction, pending] = useActionState(
    cancelVaccinationAppointment,
    initialState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `¿Cancelar el turno de ${description}? Si estaba confirmado, la dosis vuelve al stock.`,
        );
        if (!ok) event.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
      {state.error ? (
        <p role="alert" className="max-w-48 text-right text-xs text-red-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}