import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  AlertStatus,
  AppointmentState,
  MovementType,
  ReceiptType,
  UserRole,
  VaccinationAppointmentState,
  Weekday,
} from "../src/generated/prisma/enums";
import {
  StockRuleError,
  createVaccineWithInitialLot,
  registerStockMovement,
} from "../src/lib/stock";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

let failures = 0;

async function expectError(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    failures += 1;
    console.log(`FALLA  ${label}: debio rechazarse y NO lo hizo`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.split("\n").filter(Boolean).at(-1)
        : String(error);
    console.log(`OK     ${label}: ${message?.slice(0, 100)}`);
  }
}

async function expectOk(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`OK     ${label}`);
  } catch (error) {
    failures += 1;
    const message = error instanceof Error ? error.message.split("\n").at(-1) : String(error);
    console.log(`FALLA  ${label}: ${message?.slice(0, 100)}`);
  }
}

async function expectAppError(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    failures += 1;
    console.log(`FALLA  ${label}: debio rechazarse (regla de stock) y NO lo hizo`);
  } catch (error) {
    if (error instanceof StockRuleError) {
      console.log(`OK     ${label}: ${Object.values(error.fields)[0]}`);
    } else {
      failures += 1;
      const message =
        error instanceof Error ? error.message.split("\n").at(-1) : String(error);
      console.log(`FALLA  ${label}: error inesperado: ${message?.slice(0, 100)}`);
    }
  }
}

const futuro = (dias: number, minutos = 0) =>
  new Date(
    new Date(Date.now() + dias * 86_400_000).setUTCHours(14, 0, 0, 0) + minutos * 60_000,
  );

const lot = await prisma.vaccineLot.findFirstOrThrow({
  include: { vaccine: true },
});
const movement = await prisma.stockMovement.findFirstOrThrow();
const patient = await prisma.patient.findFirstOrThrow();
const doctor = await prisma.doctor.findFirstOrThrow();
const enfermera = await prisma.userProfile.findFirstOrThrow({
  where: { role: UserRole.ENFERMERA },
});

console.log("--- usuario: rol inmutable (fn_usuario_rol_inmutable) ---");
await expectError("cambiar el rol de un usuario", () =>
  prisma.userProfile.update({
    where: { id: enfermera.id },
    data: { role: UserRole.ADMINISTRADOR },
  }),
);

console.log("--- append-only: movimiento_stock (Ley 26.529) ---");
await expectError("UPDATE de un movimiento", () =>
  prisma.stockMovement.update({ where: { id: movement.id }, data: { quantity: 99 } }),
);
await expectError("DELETE de un movimiento", () =>
  prisma.stockMovement.delete({ where: { id: movement.id } }),
);

console.log("--- turno: reglas de fn_turno_reglas ---");
await expectError("reservar en fecha pasada", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      startsAt: new Date("2020-01-01T10:00:00Z"),
      endsAt: new Date("2020-01-01T10:30:00Z"),
      status: AppointmentState.RESERVADO,
      reservedById: enfermera.id,
    },
  }),
);
await expectError("fin de turno que no respeta duracion_consulta", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      startsAt: futuro(30),
      endsAt: futuro(30, 23),
      status: AppointmentState.RESERVADO,
      reservedById: enfermera.id,
    },
  }),
);

const turnoReservado = await prisma.appointment.findFirstOrThrow({
  where: { status: AppointmentState.RESERVADO },
  include: { patient: true, doctor: true },
});
await expectError("mover un turno ya reservado", () =>
  prisma.appointment.update({
    where: { id: turnoReservado.id },
    data: { startsAt: futuro(45) },
  }),
);
await expectError("turno del mismo medico en el mismo intervalo", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: turnoReservado.doctorId,
      startsAt: turnoReservado.startsAt,
      endsAt: turnoReservado.endsAt,
      status: AppointmentState.RESERVADO,
      reservedById: enfermera.id,
    },
  }),
);

const turnoAtendido = await prisma.appointment.findFirstOrThrow({
  where: { status: AppointmentState.ATENDIDO },
});
await expectError("reabrir un turno terminal (atendido -> reservado)", () =>
  prisma.appointment.update({
    where: { id: turnoAtendido.id },
    data: { status: AppointmentState.RESERVADO },
  }),
);

const medicoPerfil = await prisma.userProfile.findFirstOrThrow({
  where: { role: UserRole.MEDICO },
});
await expectError("cancelar sin motivo con rol medico", () =>
  prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      startsAt: futuro(60),
      endsAt: futuro(60, doctor.consultDuration),
      status: AppointmentState.CANCELADO,
      reservedById: enfermera.id,
      cancelledById: medicoPerfil.id,
      cancellationReason: null,
    },
  }),
);

console.log("--- movimiento_stock: signos y motivos por tipo ---");
await expectError("asignacion_turno con cantidad distinta de -1", async () => {
  const turnoVacunacion = await prisma.vaccinationAppointment.findFirstOrThrow();
  return prisma.stockMovement.create({
    data: {
      lotId: lot.id,
      type: MovementType.ASIGNACION_TURNO,
      quantity: -2,
      vaccinationAppointmentId: turnoVacunacion.id,
      actorId: enfermera.id,
    },
  });
});
await expectError("devolucion_turno sin turno de vacunacion", () =>
  prisma.stockMovement.create({
    data: {
      lotId: lot.id,
      type: MovementType.DEVOLUCION_TURNO,
      quantity: 1,
      actorId: enfermera.id,
    },
  }),
);
await expectError("ajuste sin motivo", () =>
  prisma.stockMovement.create({
    data: {
      lotId: lot.id,
      type: MovementType.AJUSTE,
      quantity: 5,
      reason: null,
      actorId: enfermera.id,
    },
  }),
);

console.log("--- stock: validaciones de la app (src/lib/stock.ts) ---");
await expectAppError("ingreso de cantidad cero", () =>
  registerStockMovement({
    vaccineId: lot.vaccineId,
    lotNumber: "PRUEBA-0",
    expiresAt: futuro(30),
    quantity: 0,
    movementType: MovementType.INGRESO,
    reason: null,
    actorId: enfermera.id,
  }),
);
await expectAppError("ajuste sin motivo", () =>
  registerStockMovement({
    vaccineId: lot.vaccineId,
    lotNumber: "NO-EXISTE",
    expiresAt: null,
    quantity: -3,
    movementType: MovementType.AJUSTE,
    reason: "",
    actorId: enfermera.id,
  }),
);
await expectAppError("ingreso a un lote ya vencido", () =>
  registerStockMovement({
    vaccineId: lot.vaccineId,
    lotNumber: "VENCIDO-2020",
    expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    quantity: 5,
    movementType: MovementType.INGRESO,
    reason: null,
    actorId: enfermera.id,
  }),
);
await expectAppError("alta de un lote con vencimiento pasado", () =>
  createVaccineWithInitialLot({
    name: `PRUEBA-VENCIDA-${Date.now()}`,
    laboratory: "Laboratorio de prueba",
    criticalLevel: null,
    lotNumber: "L-2020",
    expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    quantity: 5,
    actorId: enfermera.id,
  }),
);

console.log("--- stock materializado: trigger fn_stock_movimiento_post ---");
const stockAntes = lot.quantityAvailable;
await expectError("ingreso que dejaria el lote en negativo", () =>
  prisma.stockMovement.create({
    data: {
      lotId: lot.id,
      type: MovementType.AJUSTE,
      quantity: -(stockAntes + 1),
      reason: "Prueba de stock negativo",
      actorId: enfermera.id,
    },
  }),
);
const stockDespues = await prisma.vaccineLot.findUniqueOrThrow({
  where: { id: lot.id },
});
if (stockDespues.quantityAvailable !== stockAntes) {
  failures += 1;
  console.log(`FALLA  el stock no quedo intacto: ${stockAntes} -> ${stockDespues.quantityAvailable}`);
} else {
  console.log(`OK     el stock del lote quedo en ${stockAntes} tras el rechazo`);
}

await expectOk("ajuste con motivo recalcula el stock (transaccion revertida)", async () => {
  const lote = await prisma.vaccineLot.findFirstOrThrow();
  const antes = lote.quantityAvailable;
  let stockOk = false;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          lotId: lote.id,
          type: MovementType.AJUSTE,
          quantity: 7,
          reason: "Verificacion de ajuste",
          actorId: enfermera.id,
        },
      });

      const despues = await tx.vaccineLot.findUniqueOrThrow({
        where: { id: lote.id },
      });

      if (despues.quantityAvailable !== antes + 7) {
        throw new Error(
          `el stock no se recalculo: ${antes} -> ${despues.quantityAvailable}`,
        );
      }

      stockOk = true;
      throw new Error("ROLLBACK_PRUEBA_AJUSTE");
    });
  } catch (error) {
    if (!(error instanceof Error && error.message === "ROLLBACK_PRUEBA_AJUSTE")) {
      throw error;
    }
  }

  const final = await prisma.vaccineLot.findUniqueOrThrow({ where: { id: lote.id } });

  if (!stockOk || final.quantityAvailable !== antes) {
    throw new Error(
      `el lote quedo modificado tras el rollback: ${antes} -> ${final.quantityAvailable}`,
    );
  }
});

console.log("--- alerta_stock: una sola activa por vacuna ---");
const alertaActiva = await prisma.stockAlert.findFirstOrThrow({
  where: { status: AlertStatus.ACTIVA },
});
await expectError("una segunda alerta activa para la misma vacuna", () =>
  prisma.stockAlert.create({
    data: {
      vaccineId: alertaActiva.vaccineId,
      stockWhenGenerated: 3,
      criticalLevelWhenGenerated: 7,
      status: AlertStatus.ACTIVA,
    },
  }),
);

console.log("--- turno_vacunacion: lote coherente y no vencido ---");
// lote.id pertenece a lot.vaccineId, asi que asignarlo a otra vacuna debe fallar
const vacunaAjena = await prisma.vaccine.findFirstOrThrow({
  where: { id: { not: lot.vaccineId } },
});
await expectError("lote que no corresponde a la vacuna", () =>
  prisma.vaccinationAppointment.create({
    data: {
      patientId: patient.id,
      vaccineId: vacunaAjena.id,
      lotId: lot.id,
      scheduledAt: futuro(10),
      status: VaccinationAppointmentState.PENDIENTE,
      registeredById: enfermera.id,
    },
  }),
);

console.log("--- comprobante: monto identico al pago ---");
const pago = await prisma.payment.findFirstOrThrow();
await expectError("comprobante con monto distinto al pago", () =>
  prisma.receipt.create({
    data: {
      paymentId: pago.id,
      number: `PRUEBA-${Date.now()}`,
      type: ReceiptType.B,
      totalAmount: Number(pago.amount) + 1,
      file: "prueba.pdf",
    },
  }),
);

console.log("--- registro_clinico: solo sobre turno atendido ---");
await expectError("historia clinica sobre turno reservado", () =>
  prisma.clinicalRecord.create({
    data: { appointmentId: turnoReservado.id, diagnosis: "Diagnostico de prueba" },
  }),
);

console.log("--- horario_atencion: maximo dos dias por medico ---");
const horariosMedico = await prisma.doctorSchedule.findMany({
  where: { doctorId: doctor.id },
  orderBy: { weekday: "asc" },
});
const diasUsados = new Set(horariosMedico.map((h) => h.weekday));
const diaLibre = Object.values(Weekday).find((d) => !diasUsados.has(d));
if (!diaLibre) {
  console.log(`SALTA  el medico ya attendia ${diasUsados.size} dias, no hay dia libre para la prueba positiva`);
} else {
  await expectOk(`una franja en ${diaLibre} se acepta`, () =>
    prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        weekday: diaLibre,
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T12:00:00Z"),
        modifiedById: enfermera.id,
        modifiedAt: new Date(),
      },
    }),
  );
  await expectError("un tercer dia distinto para el mismo medico", () =>
    prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        weekday: Object.values(Weekday).find(
          (d) => d !== diaLibre && !diasUsados.has(d),
        )!,
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T12:00:00Z"),
      },
    }),
  );
  // deja el medico como estaba
  await prisma.doctorSchedule.deleteMany({
    where: { doctorId: doctor.id, weekday: diaLibre },
  });
}

const horarioExistente = horariosMedico[0];
await expectError("franja que se superpone con una existente", () =>
  prisma.doctorSchedule.create({
    data: {
      doctorId: horarioExistente.doctorId,
      weekday: horarioExistente.weekday,
      startTime: new Date("1970-01-01T10:00:00Z"),
      endTime: new Date("1970-01-01T11:00:00Z"),
    },
  }),
);

console.log("--- Estado final por tabla ---");
const tablas = {
  usuario: await prisma.userProfile.count(),
  obra_social: await prisma.insuranceProvider.count(),
  paciente: await prisma.patient.count(),
  medico: await prisma.doctor.count(),
  horario_atencion: await prisma.doctorSchedule.count(),
  bloqueo_agenda: await prisma.scheduleBlock.count(),
  turno: await prisma.appointment.count(),
  vacuna: await prisma.vaccine.count(),
  lote: await prisma.vaccineLot.count(),
  turno_vacunacion: await prisma.vaccinationAppointment.count(),
  movimiento_stock: await prisma.stockMovement.count(),
  alerta_stock: await prisma.stockAlert.count(),
  horario_vacunacion: await prisma.vaccinationSchedule.count(),
  pago: await prisma.payment.count(),
  comprobante: await prisma.receipt.count(),
  registro_clinico: await prisma.clinicalRecord.count(),
};
console.log(JSON.stringify(tablas, null, 2));
console.log(Object.keys(tablas).length === 16 ? "OK     16 tablas mapeadas" : "FALLA  faltan tablas");

if (failures > 0) {
  console.log(`\n${failures} verificacion(es) fallaron.`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log("\nTodas las verificaciones pasaron.");
await prisma.$disconnect();