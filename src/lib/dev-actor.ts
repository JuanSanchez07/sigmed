import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { UserProfile } from "@/generated/prisma/client";

export const DEV_ACTOR_COOKIE = "sigmed_actor";

export type DevActorCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export function isDevActorEnabled() {
  return (
    process.env.SIGMED_DEV_ACTOR === "1" || process.env.NODE_ENV !== "production"
  );
}

export async function getCurrentActor(): Promise<UserProfile | null> {
  if (!isDevActorEnabled()) return null;

  const store = await cookies();
  const id = store.get(DEV_ACTOR_COOKIE)?.value;

  if (!id) return null;

  return prisma.userProfile.findFirst({
    where: { id },
  });
}

export async function listDevActorCandidates(): Promise<DevActorCandidate[]> {
  if (!isDevActorEnabled()) return [];

  return prisma.userProfile.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  });
}
