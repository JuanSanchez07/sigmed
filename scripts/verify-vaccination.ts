// scripts/verify-vaccination.ts
// Pruebas de US-3.6 contra la base real, llamando a las funciones de
// src/lib/vaccination.ts (no a una copia). Uso: npm run test:vaccination
//
// ⚠️ Escribe en la base de DATABASE_URL y no puede limpiar del todo:
// movimiento_stock es append-only. Crea vacunas "PRUEBA US-3.6 ..." propias
// y al final cancela los turnos que creo. Correrlo contra una rama de
// desarrollo de Neon, nunca contra la base compartida del equipo.

import "dotenv/config";
import { prisma } from "../src/lib/db";
import { createVaccineWithInitialLot, registerStockMovement } from "../src/lib/stock";
import {
  VaccinationRuleError,
  assignVaccinationAppointment,
  cancelVaccinationAppointment,
  clinicToday,
  getFreeSlots,
  getVaccinesWithStock,
  type Slot,
} from "../src/lib/vaccination";
import {
  MovementType,
  UserRole,
  VaccinationAppointmentState,
} from "../src/generated/prisma/enums";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let failures = 0;
const createdAppointments: string[] = [];

function describe(error: unknown): string {
  if (error instanceof VaccinationRuleError) return JSON.stringify(error.fields);
  if (error instanceof Error) {
    return error.message.split("\n").filter(Boolean).at(-1)?.slice(0, 140) ?? "";
  }
  return String(error);
}

function check(label: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`OK     ${label}`);
  } else {
    failures += 1;
    console.log(`FALLA  ${label}${detail ? `: ${detail}` : ""}`);
  }
}

/** Espera un VaccinationRuleError con un error en el campo indicado. */
async function expectRule(label: string, field: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    failures += 1;
    console.log(`FALLA  ${label}: debio rechazarse y NO lo hizo`);
  } catch (error) {
    if (error instanceof VaccinationRuleError && field in error.fields) {
      console.log(`OK     ${label}: ${error.fields[field]}`);
    } else {
      failures += 1;
      console.log(`FALLA  ${label}: error inesperado -> ${describe(error)}`);
    }
  }
}

function addDays(fecha: string, days: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dateValue = (fecha: string) => new Date(`${fecha}T00:00:00Z`);

async function stockOf(lotId: string) {
  const lot = await prisma.vaccineLot.findUniqueOrThrow({
    where: { id: lotId },
    select: { quantityAvailable: true },
  });
  return lot.quantityAvailable;
}

// ---------------------------------------------------------------------------
// Preparacion
// ---------------------------------------------------------------------------

const stamp = Date.now().toString(36).toUpperCase();
const today = clinicToday();

const enfermera = await prisma.userProfile.findFirstOrThrow({
  where: { role: UserRole.ENFERMERA },
});
const patient = await prisma.patient.findFirstOrThrow();

async function assign(vaccineId: string, slot: Slot) {
  const appointment = await assignVaccinationAppointment({
    patientId: patient.id,
    vaccineId,
    scheduledAt: slot.startsAt,
    actorId: enfermera.id,
  });
  createdAppointments.push(appointment.id);
  return appointment;
}

// Una fecha lejana con al menos 6 horarios libres, para no chocar con datos reales
let fecha: string | null = null;
let slots: Slot[] = [];
for (let offset = 20; offset <= 120 && !fecha; offset++) {
  const candidate = addDays(today, offset);
  const free = await getFreeSlots(candidate);
  if (free.length >= 6) {
    fecha = candidate;
    slots = free;
  }
}

if (!fecha) {
  console.log("FALLA  no hay ninguna fecha con 6 horarios libres en horario_vacunacion");
  await prisma.$disconnect();
  process.exit(1);
}

const [s1, s2, s3, s4, s5, s6] = slots;
console.log(`Fecha de prueba: ${fecha} (${slots.length} horarios libres)\n`);

// Vacuna A con tres lotes:
//   LEJOS: vence lejos, 3 dosis
//   CERCA: vence despues del turno pero antes que LEJOS, 1 dosis -> FEFO la elige
//   ANTES: vence manana, antes del turno, 5 dosis -> NO se puede usar
const nameA = `PRUEBA US-3.6 A ${stamp}`;
await createVaccineWithInitialLot({
  name: nameA,
  laboratory: "Laboratorio de prueba",
  criticalLevel: null,
  lotNumber: `LEJOS-${stamp}`,
  expiresAt: dateValue(addDays(fecha, 400)),
  quantity: 3,
  actorId: enfermera.id,
});
const vacA = await prisma.vaccine.findUniqueOrThrow({ where: { name: nameA } });

for (const [prefix, expires, quantity] of [
  ["CERCA", addDays(fecha, 60), 1],
  ["ANTES", addDays(today, 1), 5],
] as const) {
  await registerStockMovement({
    vaccineId: vacA.id,
    lotNumber: `${prefix}-${stamp}`,
    expiresAt: dateValue(expires),
    quantity,
    movementType: MovementType.INGRESO,
    reason: "Prueba US-3.6",
    actorId: enfermera.id,
  });
}

const lotsA = await prisma.vaccineLot.findMany({ where: { vaccineId: vacA.id } });
const lotA = (prefix: string) => lotsA.find((l) => l.lotNumber.startsWith(prefix))!;
const lejos = lotA("LEJOS");
const cerca = lotA("CERCA");
const antes = lotA("ANTES");

// Vacuna B con un solo lote de 1 dosis, para la carrera por la ultima dosis
const nameB = `PRUEBA US-3.6 B ${stamp}`;
await createVaccineWithInitialLot({
  name: nameB,
  laboratory: "Laboratorio de prueba",
  criticalLevel: null,
  lotNumber: `UNICO-${stamp}`,
  expiresAt: dateValue(addDays(fecha, 400)),
  quantity: 1,
  actorId: enfermera.id,
});
const vacB = await prisma.vaccine.findUniqueOrThrow({ where: { name: nameB } });
const lotB = await prisma.vaccineLot.findFirstOrThrow({ where: { vaccineId: vacB.id } });

// ---------------------------------------------------------------------------
// Pruebas
// ---------------------------------------------------------------------------

try {
  console.log("--- 3.6.2 vacunas con stock ---");
  {
    const list = await getVaccinesWithStock();
    const a = list.find((v) => v.id === vacA.id);
    check("la vacuna A aparece con 9 dosis (3 + 1 + 5)", a?.availableDoses === 9, `vino ${a?.availableDoses}`);
  }

  console.log("--- 3.6.4 + CA2: asignar descuenta 1 dosis del lote FEFO ---");
  const a1 = await assign(vacA.id, s1);
  check("el turno queda APROBADO", a1.status === VaccinationAppointmentState.APROBADO);
  check("el turno registra quien lo resolvio", a1.resolvedById === enfermera.id && a1.resolvedAt !== null);
  check(
    "usa el lote CERCA (vence primero) y no ANTES (vence antes del turno)",
    a1.lotId === cerca.id,
    `uso ${lotsA.find((l) => l.id === a1.lotId)?.lotNumber}`,
  );
  check("CERCA paso de 1 a 0", (await stockOf(cerca.id)) === 0);
  check("ANTES quedo intacto en 5", (await stockOf(antes.id)) === 5);
  {
    const movement = await prisma.stockMovement.findFirst({
      where: {
        vaccinationAppointmentId: a1.id,
        type: MovementType.ASIGNACION_TURNO,
        quantity: -1,
        lotId: cerca.id,
      },
    });
    check("existe el movimiento asignacion_turno de -1 ligado al turno", movement !== null);
  }

  console.log("--- horario ocupado ---");
  await expectRule("no se puede volver a asignar el mismo horario", "scheduledAt", () =>
    assign(vacA.id, s1),
  );
  {
    const free = await getFreeSlots(fecha);
    check(
      "el horario ocupado ya no aparece como libre",
      !free.some((s) => s.startsAt.getTime() === s1.startsAt.getTime()),
    );
  }

  console.log("--- FEFO pasa al siguiente lote cuando el primero se agota ---");
  const a2 = await assign(vacA.id, s2);
  check("el segundo turno usa LEJOS", a2.lotId === lejos.id);
  check("LEJOS paso de 3 a 2", (await stockOf(lejos.id)) === 2);

  console.log("--- cancelar devuelve la dosis al mismo lote ---");
  await cancelVaccinationAppointment({ appointmentId: a1.id, actorId: enfermera.id });
  {
    const after = await prisma.vaccinationAppointment.findUniqueOrThrow({ where: { id: a1.id } });
    check("el turno queda CANCELADO con fecha", after.status === VaccinationAppointmentState.CANCELADO && after.cancelledAt !== null);
    check("CERCA volvio a 1", (await stockOf(cerca.id)) === 1);
    const movement = await prisma.stockMovement.findFirst({
      where: {
        vaccinationAppointmentId: a1.id,
        type: MovementType.DEVOLUCION_TURNO,
        quantity: 1,
        lotId: cerca.id,
      },
    });
    check("existe el movimiento devolucion_turno de +1 sobre el mismo lote", movement !== null);
    const free = await getFreeSlots(fecha);
    check(
      "el horario cancelado vuelve a estar libre",
      free.some((s) => s.startsAt.getTime() === s1.startsAt.getTime()),
    );
  }
  await expectRule("cancelar dos veces el mismo turno se rechaza", "form", () =>
    cancelVaccinationAppointment({ appointmentId: a1.id, actorId: enfermera.id }),
  );
  check("la dosis no se devolvio dos veces (CERCA sigue en 1)", (await stockOf(cerca.id)) === 1);

  console.log("--- dos asignaciones simultaneas al mismo horario ---");
  {
    const results = await Promise.allSettled([assign(vacA.id, s6), assign(vacA.id, s6)]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    check("entra una sola", ok === 1, `entraron ${ok}`);
    check(
      "la otra recibe 'horario ocupado'",
      rejected?.reason instanceof VaccinationRuleError && "scheduledAt" in rejected.reason.fields,
      describe(rejected?.reason),
    );
  }

  console.log("--- dos asignaciones simultaneas por la ultima dosis ---");
  {
    const results = await Promise.allSettled([assign(vacB.id, s3), assign(vacB.id, s4)]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    check("entra una sola", ok === 1, `entraron ${ok}`);
    check(
      "la otra recibe un error de stock claro (no un error crudo del trigger)",
      rejected?.reason instanceof VaccinationRuleError && "vaccineId" in rejected.reason.fields,
      describe(rejected?.reason),
    );
    check("el lote de B quedo en 0, nunca negativo", (await stockOf(lotB.id)) === 0);
  }

  console.log("--- CA1: con stock 0 no se puede asignar ---");
  await expectRule("asignar la vacuna B sin stock se rechaza", "vaccineId", () =>
    assign(vacB.id, s5),
  );
  check("el lote de B sigue en 0", (await stockOf(lotB.id)) === 0);
  {
    const list = await getVaccinesWithStock();
    check("la vacuna B ya no aparece en la lista", !list.some((v) => v.id === vacB.id));
  }

  console.log("--- horarios invalidos ---");
  await expectRule("un horario fuera de la grilla se rechaza", "scheduledAt", () =>
    assignVaccinationAppointment({
      patientId: patient.id,
      vaccineId: vacA.id,
      scheduledAt: new Date(s1.startsAt.getTime() + 60_000),
      actorId: enfermera.id,
    }),
  );
  await expectRule("un horario pasado se rechaza", "scheduledAt", () =>
    assignVaccinationAppointment({
      patientId: patient.id,
      vaccineId: vacA.id,
      scheduledAt: new Date(Date.now() - 86_400_000),
      actorId: enfermera.id,
    }),
  );

  console.log("--- invariante: stock del lote = suma de sus movimientos ---");
  {
    const lotIds = [...lotsA.map((l) => l.id), lotB.id];
    const sums = await prisma.stockMovement.groupBy({
      by: ["lotId"],
      where: { lotId: { in: lotIds } },
      _sum: { quantity: true },
    });
    for (const id of lotIds) {
      const stock = await stockOf(id);
      const sum = sums.find((s) => s.lotId === id)?._sum.quantity ?? 0;
      const name = [...lotsA, lotB].find((l) => l.id === id)?.lotNumber;
      check(`${name}: stock ${stock} = movimientos ${sum}`, stock === sum);
    }
  }
} catch (error) {
  failures += 1;
  console.log(`FALLA  error inesperado: ${describe(error)}`);
} finally {
  // Liberar los horarios: cancelar lo que siga activo (devuelve las dosis)
  for (const id of createdAppointments) {
    try {
      await cancelVaccinationAppointment({ appointmentId: id, actorId: enfermera.id });
    } catch {
      // ya estaba cancelado
    }
  }
}

if (failures > 0) {
  console.log(`\n${failures} verificacion(es) fallaron.`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log("\nTodas las verificaciones de US-3.6 pasaron.");
await prisma.$disconnect();