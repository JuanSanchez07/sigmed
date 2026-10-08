"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  DEV_ACTOR_COOKIE,
  isDevActorEnabled,
} from "@/lib/dev-actor";

export type ActorState = {
  error?: string;
  selectedId?: string;
};

export async function setDevActor(
  _prev: ActorState,
  formData: FormData,
): Promise<ActorState> {
  if (!isDevActorEnabled()) {
    return { error: "El actor de desarrollo esta deshabilitado." };
  }

  const id = formData.get("actorId");

  if (typeof id !== "string" || id.length === 0) {
    return { error: "Selecciona un perfil." };
  }

  const profile = await prisma.userProfile.findFirst({
    where: { id },
    select: { id: true },
  });

  if (!profile) {
    return { error: "El perfil ya no existe." };
  }

  const store = await cookies();
  store.set(DEV_ACTOR_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");

  return { selectedId: profile.id };
}

export async function clearDevActor(): Promise<void> {
  if (!isDevActorEnabled()) return;

  const store = await cookies();
  store.delete(DEV_ACTOR_COOKIE);

  revalidatePath("/", "layout");
}