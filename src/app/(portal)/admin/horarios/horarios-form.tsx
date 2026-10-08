"use client";

import { useActionState, useState } from "react";
import { modificarHorarios, type HorariosFormState } from "./actions";

type DoctorOption = {
  id: string;
  label: string;
};

const initialState: HorariosFormState = { status: "idle", message: "" };
const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export function HorariosForm({ doctors }: { doctors: DoctorOption[] }) {
  const [state, formAction, pending] = useActionState(
    modificarHorarios,
    initialState,
  );
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  function toggleDay(day: string, checked: boolean) {
    setSelectedDays((current) =>
      checked ? [...current, day] : current.filter((selected) => selected !== day),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center space-x-4 rounded-md bg-slate-50 p-4">
        <label
          htmlFor="doctorId"
          className="min-w-[200px] font-semibold text-slate-700"
        >
          Seleccionar Profesional
        </label>
        <select
          name="doctorId"
          id="doctorId"
          className="flex-1 rounded-md border border-slate-300 p-2 focus:ring-blue-500"
          required
        >
          <option value="">[Lista de Profesionales - Especialidad]</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-slate-700">
          Configuración de Disponibilidad
        </h2>

        <div className="flex space-x-6">
          {weekdays.map((day) => {
            const checked = selectedDays.includes(day);
            return (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="dias"
                  value={day}
                  checked={checked}
                  disabled={!checked && selectedDays.length >= 2}
                  onChange={(event) => toggleDay(day, event.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{day}</span>
              </label>
            );
          })}
        </div>
        <p className="text-sm text-slate-500">
          Cada profesional puede atender como máximo dos días distintos por semana.
        </p>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <label htmlFor="horaInicio" className="text-sm font-semibold">
              Hora Inicio
            </label>
            <input
              type="time"
              name="horaInicio"
              id="horaInicio"
              className="rounded-md border p-2"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="horaFin" className="text-sm font-semibold">
              Hora Fin
            </label>
            <input
              type="time"
              name="horaFin"
              id="horaFin"
              className="rounded-md border p-2"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="duracion" className="text-sm font-semibold">
              Duración Turno
            </label>
            <select
              name="duracion"
              id="duracion"
              className="rounded-md border p-2"
              required
            >
              <option value="">XX min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </div>
        </div>
      </div>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end space-x-4 border-t pt-4">
        <button
          type="reset"
          onClick={() => setSelectedDays([])}
          className="rounded-md border px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
