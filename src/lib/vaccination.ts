// src/lib/vaccination.ts
// Logica de negocio de turnos de vacunacion (US-3.6). Sin dependencias de Next,
// igual que stock.ts, para poder usarla desde Server Actions y desde scripts.

import type { Prisma } from "@/generated/prisma/client";
import { isTransactionConflict, prisma } from "@/lib/db";
import type { FieldErrors } from "@/lib/forms";
import {
  MovementType,
  VaccinationAppointmentState,
  Weekday,
} from "@/generated/prisma/enums";

/**
 * Error de regla de negocio, mismo patron que StockRuleError: las claves de
 * `fields` coinciden con los campos del formulario; "form" es un error general.
 */
export class VaccinationRuleError extends Error {
  constructor(readonly fields: FieldErrors) {
    super("regla de turno de vacunacion");
  }
}

const ACTIVE_STATUSES: VaccinationAppointmentState[] = [
  VaccinationAppointmentState.PENDIENTE,
  VaccinationAppointmentState.APROBADO,
];

// ---------------------------------------------------------------------------
// Fechas: el vacunatorio trabaja en hora de Argentina (UTC-3, sin horario de verano)
// ---------------------------------------------------------------------------

const CLINIC_TZ = "-03:00";
const CLINIC_OFFSET_MS = -3 * 60 * 60 * 1000;

// Indice = Date.getUTCDay() (0 = domingo)
const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.DOMINGO,
  Weekday.LUNES,
  Weekday.MARTES,
  Weekday.MIERCOLES,
  Weekday.JUEVES,
  Weekday.VIERNES,
  Weekday.SABADO,
];

function isDateOnly(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha));
}

/** "2026-10-06" + 545 min -> Date de 2026-10-06 09:05 hora Argentina */
function clinicDateTime(fecha: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return new Date(`${fecha}T${hh}:${mm}:00${CLINIC_TZ}`);
}

/** Date -> "YYYY-MM-DD" en hora Argentina */
function toClinicDateString(d: Date): string {
  return new Date(d.getTime() + CLINIC_OFFSET_MS).toISOString().slice(0, 10);
}

/** Hoy en hora Argentina, "AAAA-MM-DD". Para el min del input de fecha. */
export function clinicToday(): string {
  return toClinicDateString(new Date());
}

/** Para comparar contra columnas @db.Date (fecha_vencimiento): medianoche UTC */
function dateOnlyValue(fecha: string): Date {
  return new Date(`${fecha}T00:00:00Z`);
}

function clinicWeekday(fecha: string): Weekday {
  // Mediodia en Argentina = 15:00 UTC, siempre el mismo dia calendario
  return WEEKDAY_BY_JS_DAY[new Date(`${fecha}T12:00:00${CLINIC_TZ}`).getUTCDay()];
}

/** Columnas @db.Time llegan como Date 1970-01-01THH:MM:00Z */
function timeToMinutes(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------------------------------------------------------------------------
// 3.6.2 Vacunas con stock
// ---------------------------------------------------------------------------

export type VaccineWithStock = { id: string; name: string; availableDoses: number };

/** Vacunas cuya suma de lotes no vencidos (a la fecha `at`) es mayor a 0. */
export async function getVaccinesWithStock(at: Date = new Date()): Promise<VaccineWithStock[]> {
  const totals = await prisma.vaccineLot.groupBy({
    by: ["vaccineId"],
    where: {
      quantityAvailable: { gt: 0 },
      expiresAt: { gte: dateOnlyValue(toClinicDateString(at)) },
    },
    _sum: { quantityAvailable: true },
  });

  const doses = new Map(
    totals
      .map((t) => [t.vaccineId, t._sum.quantityAvailable ?? 0] as const)
      .filter(([, total]) => total > 0),
  );
  if (doses.size === 0) return [];

  const vaccines = await prisma.vaccine.findMany({
    where: { id: { in: [...doses.keys()] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return vaccines.map((v) => ({ ...v, availableDoses: doses.get(v.id) ?? 0 }));
}

// ---------------------------------------------------------------------------
// 3.6.3 Horarios libres
// ---------------------------------------------------------------------------

export type Slot = { time: string; startsAt: Date };

type ScheduleRow = { startTime: Date; endTime: Date; slotDuration: number };

/** Parte las franjas del dia segun duracion_turno. */
function buildSlots(fecha: string, schedules: ScheduleRow[]): Slot[] {
  const slots: Slot[] = [];
  for (const s of schedules) {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    if (s.slotDuration <= 0) continue;
    // El turno tiene que terminar dentro de la franja
    for (let m = start; m + s.slotDuration <= end; m += s.slotDuration) {
      slots.push({ time: formatMinutes(m), startsAt: clinicDateTime(fecha, m) });
    }
  }
  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function scheduleQuery(fecha: string) {
  return {
    where: { weekday: clinicWeekday(fecha) },
    select: { startTime: true, endTime: true, slotDuration: true },
  } as const;
}

function dayRange(fecha: string) {
  return { gte: clinicDateTime(fecha, 0), lt: clinicDateTime(fecha, 24 * 60) };
}

/** Horarios libres de una fecha ("YYYY-MM-DD"): en franja, sin turno activo y futuros. */
export async function getFreeSlots(fecha: string, now: Date = new Date()): Promise<Slot[]> {
  if (!isDateOnly(fecha)) {
    throw new VaccinationRuleError({ date: "La fecha no es valida." });
  }

  const [schedules, taken] = await Promise.all([
    prisma.vaccinationSchedule.findMany(scheduleQuery(fecha)),
    prisma.vaccinationAppointment.findMany({
      where: { status: { in: ACTIVE_STATUSES }, scheduledAt: dayRange(fecha) },
      select: { scheduledAt: true },
    }),
  ]);

  const takenTimes = new Set(taken.map((t) => t.scheduledAt.getTime()));
  return buildSlots(fecha, schedules).filter(
    (s) => s.startsAt.getTime() > now.getTime() && !takenTimes.has(s.startsAt.getTime()),
  );
}

// ---------------------------------------------------------------------------
// Tabla de turnos programados
// ---------------------------------------------------------------------------

export type UpcomingAppointment = {
  id: string;
  scheduledAt: Date;
  status: VaccinationAppointmentState;
  patientName: string;
  patientDni: string;
  vaccineName: string;
  lotNumber: string | null;
};

/** Turnos pendientes y aprobados desde el inicio de hoy (hora Argentina). */
export async function getUpcomingAppointments(
  now: Date = new Date(),
): Promise<UpcomingAppointment[]> {
  const rows = await prisma.vaccinationAppointment.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      scheduledAt: { gte: clinicDateTime(toClinicDateString(now), 0) },
    },
    orderBy: { scheduledAt: "asc" },
    take: 200,
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      patient: {
        select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
      },
      vaccine: { select: { name: true } },
      lot: { select: { lotNumber: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    scheduledAt: r.scheduledAt,
    status: r.status,
    patientName: `${r.patient.profile.lastName}, ${r.patient.profile.firstName}`,
    patientDni: r.patient.profile.dni,
    vaccineName: r.vaccine.name,
    lotNumber: r.lot?.lotNumber ?? null,
  }));
}

// ---------------------------------------------------------------------------
// 3.6.4 + CA1 + CA2 Asignar turno
// ---------------------------------------------------------------------------

export type AssignVaccinationInput = {
  patientId: string;
  vaccineId: string;
  scheduledAt: Date;
  actorId: string;
};

const MAX_ATTEMPTS = 3;

/** El lote elegido se quedo sin stock entre que lo leimos y lo bloqueamos. */
class LotTakenError extends Error {}

/**
 * Crea el turno ya aprobado y reserva una dosis del lote que vence primero
 * (FEFO). El stock del lote no se escribe: lo descuenta el trigger
 * fn_stock_movimiento_post, que ademas rechaza si quedaria negativo.
 */
export async function assignVaccinationAppointment(input: AssignVaccinationInput) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction((tx) => assignInTx(tx, input));
    } catch (error) {
      if (error instanceof VaccinationRuleError) throw error;

      const retryable =
        error instanceof LotTakenError ||
        isTransactionConflict(error) ||
        isStockTriggerError(error);

      if (!retryable) throw error;
      // Otra persona se llevo la dosis de ese lote: reintentar con el proximo lote FEFO
    }
  }

  throw new VaccinationRuleError({
    vaccineId: "La ultima dosis disponible acaba de ser reservada por otra persona.",
  });
}

async function assignInTx(
  tx: Prisma.TransactionClient,
  { patientId, vaccineId, scheduledAt, actorId }: AssignVaccinationInput,
) {
  // 0. Serializa asignaciones al mismo horario. No hay indice unico sobre
  //    fecha_hora, asi que sin este lock dos enfermeras podrian tomarlo a la vez.
  const slotKey = Math.floor(scheduledAt.getTime() / 60_000);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(3601, ${slotKey}::int)`;

  // 1. Paciente y vacuna existen
  const [patient, vaccine] = await Promise.all([
    tx.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
    tx.vaccine.findUnique({ where: { id: vaccineId }, select: { id: true } }),
  ]);
  if (!patient) throw new VaccinationRuleError({ patientId: "El paciente no existe." });
  if (!vaccine) throw new VaccinationRuleError({ vaccineId: "La vacuna no existe." });

  // 2. El horario tiene que estar en la grilla, ser futuro y estar libre
  if (scheduledAt.getTime() <= Date.now()) {
    throw new VaccinationRuleError({ scheduledAt: "No se puede asignar un horario pasado." });
  }
  const fecha = toClinicDateString(scheduledAt);
  const schedules = await tx.vaccinationSchedule.findMany(scheduleQuery(fecha));
  const inGrid = buildSlots(fecha, schedules).some(
    (s) => s.startsAt.getTime() === scheduledAt.getTime(),
  );
  if (!inGrid) {
    throw new VaccinationRuleError({
      scheduledAt: "El horario esta fuera de las franjas del vacunatorio.",
    });
  }
  const taken = await tx.vaccinationAppointment.findFirst({
    where: { scheduledAt, status: { in: ACTIVE_STATUSES } },
    select: { id: true },
  });
  if (taken) {
    throw new VaccinationRuleError({ scheduledAt: "Ese horario ya fue asignado." });
  }

  // 3. Lote FEFO: con stock y que no venza antes del dia del turno (CA1)
  const lot = await tx.vaccineLot.findFirst({
    where: {
      vaccineId,
      quantityAvailable: { gt: 0 },
      expiresAt: { gte: dateOnlyValue(fecha) },
    },
    orderBy: [{ expiresAt: "asc" }, { registeredAt: "asc" }],
    select: { id: true },
  });
  if (!lot) {
    throw new VaccinationRuleError({ vaccineId: "No hay dosis disponibles para esta vacuna." });
  }

  // 3b. Bloquear el lote ANTES de insertar el turno. Si no, las dos
  //     transacciones toman un lock compartido por la FK id_lote y despues
  //     chocan en el UPDATE del trigger (deadlock). Con FOR UPDATE la segunda
  //     espera aca y vuelve a leer el stock ya descontado.
  //     SQL crudo: usa los nombres fisicos de la tabla y las columnas.
  const [locked] = await tx.$queryRaw<{ quantity_available: number }[]>`
    SELECT quantity_available FROM lote WHERE id_lote = ${lot.id}::uuid FOR UPDATE
  `;
  if (!locked || locked.quantity_available <= 0) {
    throw new LotTakenError();
  }

  // 4. Turno ya aprobado: lo registra y lo resuelve la misma enfermera
  const now = new Date();
  const appointment = await tx.vaccinationAppointment.create({
    data: {
      patientId,
      vaccineId,
      scheduledAt,
      status: VaccinationAppointmentState.APROBADO,
      lotId: lot.id,
      registeredById: actorId,
      resolvedById: actorId,
      resolvedAt: now,
    },
  });

  // 5. Reserva de 1 dosis (CA2)
  await tx.stockMovement.create({
    data: {
      lotId: lot.id,
      type: MovementType.ASIGNACION_TURNO,
      quantity: -1,
      vaccinationAppointmentId: appointment.id,
      reason: "Asignacion de turno de vacunacion",
      actorId,
    },
  });

  return appointment;
}

// ---------------------------------------------------------------------------
// Cancelar turno
// ---------------------------------------------------------------------------

export type CancelVaccinationInput = {
  appointmentId: string;
  actorId: string;
  reason?: string | null;
};

export async function cancelVaccinationAppointment({
  appointmentId,
  actorId,
  reason = null,
}: CancelVaccinationInput) {
  await prisma.$transaction(async (tx) => {
    const appointment = await tx.vaccinationAppointment.findUnique({
      where: { id: appointmentId },
      select: { status: true, lotId: true },
    });
    if (!appointment) {
      throw new VaccinationRuleError({ form: "El turno no existe." });
    }
    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw new VaccinationRuleError({
        form: "Solo se pueden cancelar turnos pendientes o confirmados.",
      });
    }

    // Update condicional: si dos personas cancelan a la vez, solo una gana
    // y la dosis se devuelve una sola vez.
    const { count } = await tx.vaccinationAppointment.updateMany({
      where: { id: appointmentId, status: appointment.status },
      data: {
        status: VaccinationAppointmentState.CANCELADO,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
    if (count === 0) {
      throw new VaccinationRuleError({ form: "El turno cambio de estado. Recarga la pagina." });
    }

    if (appointment.status === VaccinationAppointmentState.APROBADO && appointment.lotId) {
      await tx.stockMovement.create({
        data: {
          lotId: appointment.lotId, // vuelve al mismo lote
          type: MovementType.DEVOLUCION_TURNO,
          quantity: 1,
          vaccinationAppointmentId: appointmentId,
          reason: "Cancelacion de turno de vacunacion",
          actorId,
        },
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ultima red: detecta el rechazo del trigger fn_stock_movimiento_post por
 * stock insuficiente. Con el FOR UPDATE del paso 3b no deberia dispararse,
 * pero si pasa, se reintenta en lugar de devolver un 500.
 * TODO: ajustar al texto real del RAISE EXCEPTION del trigger.
 */
function isStockTriggerError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  return msg.includes("stock") && (msg.includes("negativo") || msg.includes("insuficiente"));
}