import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import {
  AppointmentState,
  BlockReason,
  CoverageStatus,
  MovementType,
  ReceiptType,
  Specialty,
  UserRole,
  VaccinationAppointmentState,
  Weekday,
} from "../src/generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const TABLES = [
  "comprobante",
  "pago",
  "registro_clinico",
  "movimiento_stock",
  "turno_vacunacion",
  "alerta_stock",
  "lote",
  "vacuna",
  "horario_vacunacion",
  "horario_atencion",
  "bloqueo_agenda",
  "turno",
  "medico",
  "paciente",
  "obra_social",
  "usuario",
];

function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}Z`);
}

function dateOnly(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const WEEKDAY_NUM: Record<Weekday, number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 7,
};

/** Proxima ocurrencia futura de un dia de la semana, a una hora fija. */
function nextDay(target: Weekday, weekOffset: number, hour: number, minute = 0) {
  const date = new Date();
  date.setUTCHours(hour, minute, 0, 0);
  const delta = (WEEKDAY_NUM[target] - date.getUTCDay() + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + delta + weekOffset * 7);
  return date;
}

function plusMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

async function main() {
  console.log("Limpiando datos previos...");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(", ")} CASCADE`);

  console.log("Creando obras sociales...");
  const pampora = await prisma.insuranceProvider.create({
    data: { id: crypto.randomUUID(), name: "Pampora Salud", accepted: true },
  });
  await prisma.insuranceProvider.create({
    data: { id: crypto.randomUUID(), name: "Obra Social del Este", accepted: false },
  });

  console.log("Creando usuarios...");
  const usuarios = [
    { nombre: "Ana", apellido: "Ríos", dni: "30111222", email: "admin@sigmed.dev", rol: UserRole.ADMINISTRADOR },
    { nombre: "Lucía", apellido: "Ferreyra", dni: "30222333", email: "enfermera@sigmed.dev", rol: UserRole.ENFERMERA },
    { nombre: "Martín", apellido: "Gómez", dni: "30333444", email: "medico1@sigmed.dev", rol: UserRole.MEDICO },
    { nombre: "Sofía", apellido: "Duarte", dni: "30444555", email: "medico2@sigmed.dev", rol: UserRole.MEDICO },
    { nombre: "Juan", apellido: "Pérez", dni: "30555666", email: "paciente1@sigmed.dev", rol: UserRole.PACIENTE },
    { nombre: "Marta", apellido: "López", dni: "30666777", email: "paciente2@sigmed.dev", rol: UserRole.PACIENTE },
    { nombre: "Diego", apellido: "Sosa", dni: "30777888", email: "paciente3@sigmed.dev", rol: UserRole.PACIENTE },
  ];

  const user = new Map<string, string>();
  for (const u of usuarios) {
    const created = await prisma.userProfile.create({
      data: {
        id: crypto.randomUUID(),
        firstName: u.nombre,
        lastName: u.apellido,
        dni: u.dni,
        email: u.email,
        role: u.rol,
        clerkUserId: `seed_${u.nombre.toLowerCase()}_${u.apellido.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")}`,
      },
    });
    user.set(u.email, created.id);
  }

  const admin = user.get("admin@sigmed.dev")!;
  const enfermera = user.get("enfermera@sigmed.dev")!;
  const juan = user.get("paciente1@sigmed.dev")!;
  const marta = user.get("paciente2@sigmed.dev")!;
  const diego = user.get("paciente3@sigmed.dev")!;

  console.log("Creando medicos...");
  const martin = await prisma.doctor.create({
    data: {
      id: user.get("medico1@sigmed.dev")!,
      licenseNumber: "MP-1001",
      specialty: Specialty.CLINICO,
      consultDuration: 30,
      consultFee: 45000,
    },
  });
  const sofia = await prisma.doctor.create({
    data: {
      id: user.get("medico2@sigmed.dev")!,
      licenseNumber: "MP-1002",
      specialty: Specialty.PEDIATRA,
      consultDuration: 30,
      consultFee: 42000,
    },
  });

  console.log("Creando pacientes...");
  const pacJuan = await prisma.patient.create({
    data: {
      id: juan,
      insuranceId: pampora.id,
      memberNumber: "PAMP-88213",
      plan: "Plan 3",
      coverageStatus: CoverageStatus.VALIDADA,
    },
  });
  const pacMarta = await prisma.patient.create({ data: { id: marta } });
  const pacDiego = await prisma.patient.create({
    data: {
      id: diego,
      insuranceId: pampora.id,
      memberNumber: "PAMP-90744",
      plan: "Plan 1",
      coverageStatus: CoverageStatus.PENDIENTE,
    },
  });

  console.log("Creando horarios de atencion...");
  const horarios = [
    { doctorId: martin.id, weekday: Weekday.LUNES, inicio: "09:00", fin: "13:00" },
    { doctorId: martin.id, weekday: Weekday.MIERCOLES, inicio: "09:00", fin: "13:00" },
    { doctorId: sofia.id, weekday: Weekday.MARTES, inicio: "10:00", fin: "14:00" },
    { doctorId: sofia.id, weekday: Weekday.JUEVES, inicio: "10:00", fin: "14:00" },
  ];
  for (const h of horarios) {
    await prisma.doctorSchedule.create({
      data: {
        id: crypto.randomUUID(),
        doctorId: h.doctorId,
        weekday: h.weekday,
        startTime: timeOnly(h.inicio),
        endTime: timeOnly(h.fin),
        modifiedById: admin,
        modifiedAt: new Date(),
      },
    });
  }

  console.log("Creando bloqueo de agenda...");
  await prisma.scheduleBlock.create({
    data: {
      id: crypto.randomUUID(),
      doctorId: martin.id,
      startsAt: nextDay(Weekday.LUNES, 4, 9),
      endsAt: nextDay(Weekday.LUNES, 4, 13),
      reason: BlockReason.LICENCIA,
      description: "Licencia médica programada",
      registeredById: admin,
    },
  });

  console.log("Creando vacunas, lotes e ingresos...");
  const vacunas = [
    { nombre: "Sarampión-Rubéola-Parotiditis", nivel_critico: 20, laboratory: "Instituto Biológico Argentino" },
    { nombre: "Hepatitis B", nivel_critico: 30, laboratory: "Sinopharm" },
    { nombre: "Influenza", nivel_critico: 15, laboratory: "Sanofi Pasteur" },
  ].map((v) =>
    prisma.vaccine.create({
      data: {
        id: crypto.randomUUID(),
        name: v.nombre,
        laboratory: v.laboratory,
        criticalLevel: v.nivel_critico,
        createdById: enfermera,
      },
    }),
  );
  const [srp, hep, flu] = await Promise.all(vacunas);

  // lote, dias de vencimiento, cantidad de ingreso
  const lotes: { vacuna: { id: string }; numero: string; vence: number; ingreso: number }[] = [
    { vacuna: srp, numero: "SRP-2026-A", vence: 300, ingreso: 40 },
    { vacuna: srp, numero: "SRP-2026-B", vence: 180, ingreso: 30 },
    { vacuna: hep, numero: "HEP-2026-A", vence: 250, ingreso: 25 },
    { vacuna: flu, numero: "FLU-2025-A", vence: 30, ingreso: 10 },
  ];

  const lotByNumber = new Map<string, string>();
  for (const { vacuna, numero, vence, ingreso } of lotes) {
    const lote = await prisma.vaccineLot.create({
      data: {
        id: crypto.randomUUID(),
        vaccineId: vacuna.id,
        lotNumber: numero,
        expiresAt: dateOnly(vence),
        registeredById: enfermera,
      },
    });
    lotByNumber.set(numero, lote.id);
    await prisma.stockMovement.create({
      data: {
        id: crypto.randomUUID(),
        lotId: lote.id,
        type: MovementType.INGRESO,
        quantity: ingreso,
        actorId: enfermera,
      },
    });
  }

  console.log("Creando horarios de vacunacion...");
  for (const h of [
    { weekday: Weekday.LUNES, inicio: "09:00", fin: "12:00" },
    { weekday: Weekday.MIERCOLES, inicio: "09:00", fin: "12:00" },
  ]) {
    await prisma.vaccinationSchedule.create({
      data: {
        id: crypto.randomUUID(),
        weekday: h.weekday,
        startTime: timeOnly(h.inicio),
        endTime: timeOnly(h.fin),
        slotDuration: 10,
        registeredById: enfermera,
      },
    });
  }

  console.log("Creando turnos medicos...");
  const turnoReservado = await prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacJuan.id,
      doctorId: martin.id,
      startsAt: nextDay(Weekday.LUNES, 0, 9),
      endsAt: nextDay(Weekday.LUNES, 0, 9, 30),
      status: AppointmentState.RESERVADO,
      reservedById: juan,
    },
  });

  await prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacDiego.id,
      doctorId: martin.id,
      startsAt: nextDay(Weekday.LUNES, 0, 11),
      endsAt: nextDay(Weekday.LUNES, 0, 11, 30),
      status: AppointmentState.RESERVADO,
      reservedById: admin,
    },
  });

  await prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacMarta.id,
      doctorId: sofia.id,
      startsAt: nextDay(Weekday.MARTES, 0, 10),
      endsAt: nextDay(Weekday.MARTES, 0, 10, 30),
      status: AppointmentState.RESERVADO,
      reservedById: marta,
    },
  });

  // Un turno no puede nacer 'atendido': se reserva y recien ahi se cierra.
  const turnoAtendido = await prisma.appointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacJuan.id,
      doctorId: martin.id,
      startsAt: nextDay(Weekday.MIERCOLES, 1, 10),
      endsAt: nextDay(Weekday.MIERCOLES, 1, 10, 30),
      status: AppointmentState.RESERVADO,
      reservedById: admin,
    },
  });
  const cerrado = await prisma.appointment.update({
    where: { id: turnoAtendido.id },
    data: {
      status: AppointmentState.ATENDIDO,
      attendanceAt: plusMinutes(nextDay(Weekday.MIERCOLES, 1, 10), 30),
    },
  });

  console.log("Creando pagos y comprobantes...");
  const pago = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      appointmentId: turnoReservado.id,
      amount: martin.consultFee,
      paymentMethod: "transferencia",
      transactionCode: "TX-0001",
      registeredById: juan,
    },
  });
  await prisma.receipt.create({
    data: {
      id: crypto.randomUUID(),
      paymentId: pago.id,
      number: "0001-00000001",
      type: ReceiptType.A,
      totalAmount: pago.amount,
      file: "/comprobantes/0001-00000001.pdf",
    },
  });

  const pago2 = await prisma.payment.create({
    data: {
      id: crypto.randomUUID(),
      appointmentId: cerrado.id,
      amount: martin.consultFee,
      paymentMethod: "tarjeta",
      transactionCode: "TX-0002",
      registeredById: admin,
    },
  });
  await prisma.receipt.create({
    data: {
      id: crypto.randomUUID(),
      paymentId: pago2.id,
      number: "0001-00000002",
      type: ReceiptType.B,
      totalAmount: pago2.amount,
      file: "/comprobantes/0001-00000002.pdf",
    },
  });

  console.log("Creando registro clinico...");
  await prisma.clinicalRecord.create({
    data: {
      id: crypto.randomUUID(),
      appointmentId: cerrado.id,
      diagnosis: "Infección respiratoria alta",
      indications: "Reposo y líquidos. Control en 7 días.",
      treatment: "Paracetamol 500 mg cada 8 horas si hay fiebre.",
    },
  });

  console.log("Creando turnos de vacunacion...");

  // 1. Aprobada y aplicada. FEFO toma el lote que vence antes: SRP-2026-B.
  const vaccJuan = await prisma.vaccinationAppointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacJuan.id,
      vaccineId: srp.id,
      scheduledAt: nextDay(Weekday.LUNES, 1, 9),
      status: VaccinationAppointmentState.PENDIENTE,
      registeredById: enfermera,
    },
  });
  await prisma.vaccinationAppointment.update({
    where: { id: vaccJuan.id },
    data: {
      status: VaccinationAppointmentState.APROBADO,
      lotId: lotByNumber.get("SRP-2026-B")!,
      resolvedById: enfermera,
      resolvedAt: new Date(),
    },
  });
  await prisma.stockMovement.create({
    data: {
      id: crypto.randomUUID(),
      lotId: lotByNumber.get("SRP-2026-B")!,
      type: MovementType.ASIGNACION_TURNO,
      quantity: -1,
      vaccinationAppointmentId: vaccJuan.id,
      actorId: enfermera,
    },
  });
  await prisma.vaccinationAppointment.update({
    where: { id: vaccJuan.id },
    data: {
      status: VaccinationAppointmentState.APLICADO,
      appliedAt: nextDay(Weekday.LUNES, 1, 9, 20),
      appliedById: enfermera,
    },
  });

  // 2. Aprobada y cancelada: el stock vuelve al mismo lote.
  const vaccMarta = await prisma.vaccinationAppointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacMarta.id,
      vaccineId: hep.id,
      scheduledAt: nextDay(Weekday.MIERCOLES, 1, 10),
      status: VaccinationAppointmentState.PENDIENTE,
      registeredById: enfermera,
    },
  });
  await prisma.vaccinationAppointment.update({
    where: { id: vaccMarta.id },
    data: {
      status: VaccinationAppointmentState.APROBADO,
      lotId: lotByNumber.get("HEP-2026-A")!,
      resolvedById: enfermera,
      resolvedAt: new Date(),
    },
  });
  await prisma.stockMovement.create({
    data: {
      id: crypto.randomUUID(),
      lotId: lotByNumber.get("HEP-2026-A")!,
      type: MovementType.ASIGNACION_TURNO,
      quantity: -1,
      vaccinationAppointmentId: vaccMarta.id,
      actorId: enfermera,
    },
  });
  await prisma.vaccinationAppointment.update({
    where: { id: vaccMarta.id },
    data: {
      status: VaccinationAppointmentState.CANCELADO,
      cancellationReason: "La paciente no se presentó con la ficha de vacunación.",
      cancelledAt: new Date(),
    },
  });
  await prisma.stockMovement.create({
    data: {
      id: crypto.randomUUID(),
      lotId: lotByNumber.get("HEP-2026-A")!,
      type: MovementType.DEVOLUCION_TURNO,
      quantity: 1,
      vaccinationAppointmentId: vaccMarta.id,
      actorId: enfermera,
    },
  });

  // 3. Rechazada. docs/BD.md exige lote en todo estado distinto de 'pendiente',
  // asi que la solicitud se lotea antes del dictamen y el rechazo no genera
  // movimiento de stock.
  const vaccDiego = await prisma.vaccinationAppointment.create({
    data: {
      id: crypto.randomUUID(),
      patientId: pacDiego.id,
      vaccineId: flu.id,
      lotId: lotByNumber.get("FLU-2025-A")!,
      scheduledAt: nextDay(Weekday.LUNES, 2, 11),
      status: VaccinationAppointmentState.PENDIENTE,
      registeredById: enfermera,
    },
  });
  await prisma.vaccinationAppointment.update({
    where: { id: vaccDiego.id },
    data: {
      status: VaccinationAppointmentState.RECHAZADO,
      resolvedById: enfermera,
      resolvedAt: new Date(),
      rejectionReason: "Cobertura contraindicada: sin application's previa en el historial.",
    },
  });

  console.log("\n--- Resultado ---");
  console.log(`  usuario:              ${await prisma.userProfile.count()}`);
  console.log(`  obra_social:          ${await prisma.insuranceProvider.count()}`);
  console.log(`  paciente:             ${await prisma.patient.count()}`);
  console.log(`  medico:               ${await prisma.doctor.count()}`);
  console.log(`  horario_atencion:     ${await prisma.doctorSchedule.count()}`);
  console.log(`  bloqueo_agenda:       ${await prisma.scheduleBlock.count()}`);
  console.log(`  turno:                ${await prisma.appointment.count()}`);
  console.log(`  vacuna:               ${await prisma.vaccine.count()}`);
  console.log(`  lote:                 ${await prisma.vaccineLot.count()}`);
  console.log(`  movimiento_stock:     ${await prisma.stockMovement.count()}`);
  console.log(`  alerta_stock:         ${await prisma.stockAlert.count()}`);
  console.log(`  horario_vacunacion:   ${await prisma.vaccinationSchedule.count()}`);
  console.log(`  turno_vacunacion:     ${await prisma.vaccinationAppointment.count()}`);
  console.log(`  pago:                 ${await prisma.payment.count()}`);
  console.log(`  comprobante:          ${await prisma.receipt.count()}`);
  console.log(`  registro_clinico:     ${await prisma.clinicalRecord.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());