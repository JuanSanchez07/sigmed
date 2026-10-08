// app/lib/turnos.ts
import { prisma } from "@/lib/db";
import type { AppointmentState, Prisma } from "@/generated/prisma/client";

export { ESTADOS, ETIQUETAS_ESTADO } from "@/lib/turnos-estados";

export async function obtenerTurnos(opts: {
  doctorId: string;
  fecha: string;
  estado?: string;
  busqueda?: string;
}) {
  const where: Prisma.AppointmentWhereInput = {
    doctorId: opts.doctorId,
    startsAt: {
      gte: new Date(`${opts.fecha}T00:00:00-03:00`),
      lte: new Date(`${opts.fecha}T23:59:59.999-03:00`),
    },
  };

  if (opts.estado) where.status = opts.estado as AppointmentState;

  const q = opts.busqueda?.trim();
  if (q) {
    where.patient = {
      profile: {
        OR: [
          { lastName: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { dni: { contains: q } },
        ],
      },
    };
  }

  return prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      status: true,
      patient: {
        select: { profile: { select: { firstName: true, lastName: true, dni: true } } },
      },
    },
  });
}