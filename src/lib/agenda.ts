import { prisma } from "@/lib/db";
import { Weekday } from '@/generated/prisma/client';

export class AgendaRuleError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'AgendaRuleError';
    Object.setPrototypeOf(this, AgendaRuleError.prototype);
  }
}

interface HorarioData {
  doctorId: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  duracion: number;
}

const mapDiaToWeekday = (dia: string): Weekday => {
  const mapeo: Record<string, Weekday> = {
    'Lunes': 'LUNES',
    'Martes': 'MARTES',
    'Miércoles': 'MIERCOLES',
    'Jueves': 'JUEVES',
    'Viernes': 'VIERNES',
    'Sábado': 'SABADO',
    'Domingo': 'DOMINGO'
  };
  const weekday = mapeo[dia];
  if (!weekday) {
    throw new AgendaRuleError(`El día seleccionado no es válido: ${dia}.`);
  }
  return weekday;
};

// SOLUCIÓN 1: Obligar a que la fecha sea estrictamente UTC para que Prisma
// extraiga la hora exacta sin sumarle el offset de +3 horas de Argentina.
const parseTime = (timeStr: string): Date => {
  return new Date(`1970-01-01T${timeStr}:00.000Z`);
};

export async function actualizarHorarioMedico(actorId: string, data: HorarioData) {
  const actorProfile = await prisma.userProfile.findUnique({
    where: { id: actorId }
  });

  if (!actorProfile) {
    throw new AgendaRuleError('No autorizado. El perfil del usuario no existe.');
  }
  if (actorProfile.role !== 'ADMINISTRADOR') {
    throw new AgendaRuleError('No autorizado. Solo un administrador puede modificar los horarios.');
  }

  const doctorProfile = await prisma.doctor.findUnique({
    where: { id: data.doctorId }
  });

  if (!doctorProfile) {
    throw new AgendaRuleError('El profesional seleccionado no existe en la base de datos.');
  }

  const diasEnum = data.dias.map(mapDiaToWeekday);
  if (new Set(diasEnum).size > 2) {
    throw new AgendaRuleError('Cada profesional puede atender como máximo dos días distintos por semana.');
  }
  if (new Set(diasEnum).size !== diasEnum.length) {
    throw new AgendaRuleError('No se puede repetir un día de atención.');
  }

  const fechaInicio = parseTime(data.horaInicio);
  const fechaFin = parseTime(data.horaFin);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.doctor.update({
        where: { id: data.doctorId },
        data: { consultDuration: data.duracion }
      });

      await tx.doctorSchedule.deleteMany({
        where: { doctorId: data.doctorId }
      });

      const nuevosHorarios = diasEnum.map(dia => ({
        doctorId: data.doctorId,
        weekday: dia,
        startTime: fechaInicio,
        endTime: fechaFin,
        modifiedById: actorId,
        modifiedAt: new Date()
      }));

      await tx.doctorSchedule.createMany({
        data: nuevosHorarios
      });
    });
  } catch (error: unknown) {
    console.error("Error transaccional detallado:", error);

    // SOLUCIÓN 2: Burbujear el mensaje real de Prisma hacia la pantalla
    // en lugar de ocultarlo. Si falla de nuevo, veremos exactamente por qué.
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new AgendaRuleError(`Rechazo de base de datos: ${errorMessage}`);
  }
}