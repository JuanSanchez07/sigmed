// app/lib/turnos-estados.ts
// Constantes puras: sin imports de runtime de Prisma para poder usarse desde componentes de cliente.
import type { AppointmentState } from "@/generated/prisma/client";

export const ESTADOS: AppointmentState[] = ["RESERVADO", "ATENDIDO", "AUSENTE", "CANCELADO"];

export const ETIQUETAS_ESTADO: Record<AppointmentState, string> = {
    RESERVADO: "Reservado",
    ATENDIDO: "Atendido",
    AUSENTE: "Ausente",
    CANCELADO: "Cancelado",
};