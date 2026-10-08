import { getCurrentActor } from "@/lib/dev-actor";
import { prisma } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";

export type ActorGuardResult =
  | { actor: { id: string } }
  | { error: string };

export async function requireEnfermeraOAdministrador(): Promise<ActorGuardResult> {
  const actor = await getCurrentActor();

  if (actor) {
    if (actor.role !== UserRole.ENFERMERA && actor.role !== UserRole.ADMINISTRADOR) {
      return {
        error:
          "Solo las enfermeras y los administradores pueden modificar el catálogo y el stock.",
      };
    }

    return { actor: { id: actor.id } };
  }

  const fallback = await prisma.userProfile.findFirst({
    where: { role: { in: [UserRole.ENFERMERA, UserRole.ADMINISTRADOR] } },
    orderBy: { firstName: "asc" },
    select: { id: true },
  });

  if (!fallback) {
    return {
      error: "No hay usuarios con rol de enfermera o administrador cargados.",
    };
  }

  return { actor: { id: fallback.id } };
}