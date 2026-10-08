"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { VaccineWithStock } from "@/lib/vaccination";
import {
  createVaccinationAppointment,
  getAvailableSlots,
  searchPatients,
  type PatientOption,
  type SlotOption,
  type VaccinationFormState,
} from "./actions";

const initialState: VaccinationFormState = {};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Confirmando..." : "Confirmar turno"}
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
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-500";

type SelectedPatient = { id: string; label: string };

export function AssignmentForm({
  vaccines,
  minDate,
}: {
  vaccines: VaccineWithStock[];
  minDate: string;
}) {
  // --- Paciente -------------------------------------------------------------
  const [query, setQuery] = useState("");
  const [patient, setPatient] = useState<SelectedPatient | null>(null);
  const [results, setResults] = useState<PatientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Contadores para descartar respuestas viejas que lleguen tarde
  const searchRequest = useRef(0);

  // --- Vacuna ---------------------------------------------------------------
  const [vaccineId, setVaccineId] = useState("");
  const selectedVaccine = vaccines.find((v) => v.id === vaccineId);

  // --- Fecha y horario ------------------------------------------------------
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const slotsRequest = useRef(0);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  async function loadSlots(value: string) {
    const request = ++slotsRequest.current;
    setScheduledAt("");

    if (!value) {
      setSlots([]);
      setSlotsError(null);
      setLoadingSlots(false);
      return;
    }

    setLoadingSlots(true);
    const result = await getAvailableSlots(value);
    if (request !== slotsRequest.current) return;

    setSlots(result.slots);
    setSlotsError(result.error ?? null);
    setLoadingSlots(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setPatient(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const request = ++searchRequest.current;

    if (value.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const found = await searchPatients(value);
      if (request !== searchRequest.current) return;
      setResults(found);
      setSearching(false);
    }, 300);
  }

  function selectPatient(option: PatientOption) {
    const label = `${option.fullName} (DNI ${option.dni})`;
    searchRequest.current++;
    setPatient({ id: option.id, label });
    setQuery(label);
    setResults([]);
    setSearching(false);
  }

  function resetForm() {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchRequest.current++;
    slotsRequest.current++;
    setQuery("");
    setPatient(null);
    setResults([]);
    setSearching(false);
    setVaccineId("");
    setDate("");
    setSlots([]);
    setSlotsError(null);
    setLoadingSlots(false);
    setScheduledAt("");
  }

  const [state, dispatch, pending] = useActionState(
    async (previous: VaccinationFormState, formData: FormData) => {
      const result = await createVaccinationAppointment(previous, formData);

      if (!result.errors && !result.values) {
        // Exito: la accion no devuelve values
        resetForm();
      } else if (result.errors?.scheduledAt) {
        // El horario se ocupo mientras tanto: refrescar la lista
        const submittedDate = formData.get("date");
        if (typeof submittedDate === "string") void loadSlots(submittedDate);
      }

      return result;
    },
    initialState,
  );

  // Se despacha a mano en vez de usar <form action>, porque con action React 19
  // resetea el form al terminar y desincroniza los campos controlados.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  const errors = state.errors ?? {};
  const isError = Object.keys(errors).length > 0 || Boolean(state.values);
  const generalError = errors.form;

  const showNoResults =
    !patient && !searching && query.trim().length >= 2 && results.length === 0;

  const slotPlaceholder = !date
    ? "Elegi una fecha primero"
    : loadingSlots
      ? "Buscando horarios..."
      : slots.length === 0
        ? "No hay horarios libres"
        : "Seleccionar...";

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {state.message || generalError ? (
        <p
          role="status"
          className={
            isError
              ? "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {state.message ?? generalError}
        </p>
      ) : null}

      {/* Fila 1: paciente, vacuna, stock */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          id="patientSearch"
          label="Buscar paciente"
          hint="DNI o apellido, minimo 2 caracteres."
          error={errors.patientId}
        >
          <div className="relative">
            <input
              id="patientSearch"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              aria-invalid={Boolean(errors.patientId)}
              aria-describedby={errors.patientId ? "patientSearch-error" : undefined}
              aria-expanded={results.length > 0}
              aria-controls="patient-results"
              className={controlClass}
              placeholder="30123456 o Gomez"
            />

            <ul
              id="patient-results"
              hidden={results.length === 0 && !searching && !showNoResults}
              className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg"
            >
              {searching ? (
                <li className="px-3 py-2 text-sm text-zinc-500">Buscando...</li>
              ) : showNoResults ? (
                <li className="px-3 py-2 text-sm text-zinc-500">Sin resultados.</li>
              ) : (
                results.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(option)}
                      className="block w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100"
                    >
                      {option.fullName}
                      <span className="ml-2 text-xs text-zinc-500">DNI {option.dni}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <input type="hidden" name="patientId" value={patient?.id ?? ""} />
          <input type="hidden" name="patientLabel" value={patient?.label ?? ""} />
        </Field>

        <Field
          id="vaccineId"
          label="Seleccionar vacuna"
          hint={vaccines.length === 0 ? "No hay vacunas con stock disponible." : undefined}
          error={errors.vaccineId}
        >
          <select
            id="vaccineId"
            name="vaccineId"
            value={vaccineId}
            onChange={(e) => setVaccineId(e.target.value)}
            disabled={vaccines.length === 0}
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

        <div>
          <span className="block text-sm font-medium text-zinc-700">Stock disponible</span>
          <p
            aria-live="polite"
            className="mt-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900"
          >
            {selectedVaccine ? `${selectedVaccine.availableDoses} dosis` : "—"}
          </p>
        </div>
      </div>

      {/* Fila 2: fecha, horario */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="date" label="Fecha de vacunacion" error={errors.date}>
          <input
            id="date"
            name="date"
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              void loadSlots(e.target.value);
            }}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "date-error" : undefined}
            className={controlClass}
          />
        </Field>

        <Field
          id="scheduledAt"
          label="Horario asignado"
          error={errors.scheduledAt ?? slotsError ?? undefined}
        >
          <select
            id="scheduledAt"
            name="scheduledAt"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={!date || loadingSlots || slots.length === 0}
            aria-invalid={Boolean(errors.scheduledAt)}
            aria-describedby={errors.scheduledAt || slotsError ? "scheduledAt-error" : undefined}
            className={controlClass}
          >
            <option value="">{slotPlaceholder}</option>
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value}>
                {slot.time}
              </option>
            ))}
          </select>
        </Field>

        {/* Observaciones: pendiente de decidir si se agrega la columna en turno_vacunacion */}
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={resetForm}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}