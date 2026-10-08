"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/dev-actor";
import { type FieldErrors, hasErrors, isUuid, requiredText } from "@/lib/forms";
import {
  VaccinationRuleError,
  assignVaccinationAppointment,
  cancelVaccinationAppointment as cancelAppointment,
  getFreeSlots,
} from "@/lib/vaccination";

export type VaccinationFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

export type CancelState = {
  error?: string;
  message?: string;
};

export type PatientOption = { id: string; fullName: string; dni: string };

export type SlotOption = { time: string; value: string };

const PAGE_PATH = "/enfermera/turnos-vacunacion";
const INVENTORY_PATH = "/enfermera/inventario";

const NO_ACTOR =
  "No hay actor definido, asi que el turno no se puede atribuir. Selecciona uno en la barra superior.";

const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  dateStyle: "short",
  timeStyle: "short",
});

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function firstError(error: VaccinationRuleError, fallback: string) {
  return Object.values(error.fields)[0] ?? fallback;
}

/** "Confirmar turno": crea el turno aprobado y reserva una dosis (3.6.4, CA1, CA2). */
export async function createVaccinationAppointment(
  _previous: VaccinationFormState,
  formData: FormData,
): Promise<VaccinationFormState> {
  const errors: FieldErrors = {};

  const patientId = requiredText(
    formData.get("patientId"),
    "patientId",
    errors,
    "El paciente",
  );
  const vaccineId = requiredText(
    formData.get("vaccineId"),
    "vaccineId",
    errors,
    "La vacuna",
  );
  const date = requiredText(formData.get("date"), "date", errors, "La fecha");
  const scheduledAtRaw = requiredText(
    formData.get("scheduledAt"),
    "scheduledAt",
    errors,
    "El horario",
  );

  if (patientId && !isUuid(patientId)) {
    errors.patientId = "El paciente seleccionado no es valido.";
  }

  if (vaccineId && !isUuid(vaccineId)) {
    errors.vaccineId = "La vacuna seleccionada no es valida.";
  }

  let scheduledAt: Date | null = null;
  if (scheduledAtRaw) {
    const parsed = new Date(scheduledAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      errors.scheduledAt = "El horario seleccionado no es valido.";
    } else {
      scheduledAt = parsed;
    }
  }

  // patientLabel es un input oculto con el texto del paciente elegido, para
  // volver a mostrarlo en el buscador si el envio falla.
  const values = {
    patientId,
    patientLabel: rawValue(formData, "patientLabel"),
    vaccineId,
    date,
    scheduledAt: scheduledAtRaw,
  };

  if (hasErrors(errors) || !scheduledAt) {
    return { errors, values };
  }

  const actor = await getCurrentActor();

  if (!actor) {
    return { message: NO_ACTOR, values };
  }

  try {
    await assignVaccinationAppointment({
      patientId,
      vaccineId,
      scheduledAt,
      actorId: actor.id,
    });
  } catch (error) {
    if (error instanceof VaccinationRuleError) {
      return { errors: error.fields, values };
    }

    throw error;
  }

  revalidatePath(PAGE_PATH);
  revalidatePath(INVENTORY_PATH); // el stock del lote cambio

  return {
    message: `Turno confirmado para el ${dateTimeFormat.format(scheduledAt)}. Se reservo una dosis.`,
  };
}

/** Boton "Cancelar" de cada fila de la tabla de turnos programados. */
export async function cancelVaccinationAppointment(
  _previous: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const appointmentId = rawValue(formData, "appointmentId");

  if (!isUuid(appointmentId)) {
    return { error: "El turno no es valido." };
  }

  const actor = await getCurrentActor();

  if (!actor) {
    return { error: NO_ACTOR };
  }

  try {
    await cancelAppointment({
      appointmentId,
      actorId: actor.id,
      reason: rawValue(formData, "reason") || null,
    });
  } catch (error) {
    if (error instanceof VaccinationRuleError) {
      return { error: firstError(error, "No se pudo cancelar el turno.") };
    }

    throw error;
  }

  revalidatePath(PAGE_PATH);
  revalidatePath(INVENTORY_PATH);

  return { message: "Turno cancelado." };
}

/**
 * Buscador de pacientes por DNI (prefijo) o por nombre/apellido.
 * Se llama desde el cliente mientras la enfermera escribe. Una Server Action
 * es un endpoint publico, asi que exige actor y valida el tipo del argumento.
 */
export async function searchPatients(query: unknown): Promise<PatientOption[]> {
  if (typeof query !== "string") return [];

  const q = query.trim();
  if (q.length < 2 || q.length > 50) return [];

  const actor = await getCurrentActor();
  if (!actor) return [];

  const patients = await prisma.patient.findMany({
    where: {
      profile: {
        OR: [
          { dni: { startsWith: q } },
          { lastName: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true, dni: true } },
    },
    orderBy: [{ profile: { lastName: "asc" } }, { profile: { firstName: "asc" } }],
    take: 10,
  });

  return patients.map((p) => ({
    id: p.id,
    dni: p.profile.dni,
    fullName: `${p.profile.lastName}, ${p.profile.firstName}`,
  }));
}

/** Horarios libres de una fecha "AAAA-MM-DD" para llenar el select (3.6.3). */
export async function getAvailableSlots(
  date: unknown,
): Promise<{ slots: SlotOption[]; error?: string }> {
  if (typeof date !== "string") {
    return { slots: [], error: "La fecha no es valida." };
  }

  try {
    const slots = await getFreeSlots(date);
    return {
      slots: slots.map((s) => ({ time: s.time, value: s.startsAt.toISOString() })),
    };
  } catch (error) {
    if (error instanceof VaccinationRuleError) {
      return { slots: [], error: firstError(error, "La fecha no es valida.") };
    }

    throw error;
  }
}