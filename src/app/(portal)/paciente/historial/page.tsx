import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/dev-actor";
import ClinicalHistoryTable, {
  type ClinicalHistoryEntry,
} from "./clinical-history-table";

export const metadata = {
  title: "Mi historial clínico | SigMed",
};

const specialtyNames: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

export default async function HistorialPage() {
  const actor = await getCurrentActor();

  if (!actor || actor.role !== "PACIENTE") {
    return (
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
        <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Mi historial clínico
          </h1>
        </header>
        <p className="px-5 py-8 text-center text-sm text-zinc-600 sm:px-6">
          {!actor
            ? "No hay una sesión de paciente activa."
            : "No tenés acceso a esta sección."}
        </p>
      </div>
    );
  }

  const records = await prisma.clinicalRecord.findMany({
    where: { appointment: { patientId: actor.id } },
    orderBy: { appointment: { startsAt: "desc" } },
    select: {
      id: true,
      diagnosis: true,
      treatment: true,
      indications: true,
      appointment: {
        select: {
          startsAt: true,
          attendanceAt: true,
          doctor: {
            select: {
              specialty: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  const entries: ClinicalHistoryEntry[] = records.map((record) => ({
    id: record.id,
    date: (record.appointment.attendanceAt ?? record.appointment.startsAt).toISOString(),
    doctor: `${record.appointment.doctor.profile.lastName}, ${record.appointment.doctor.profile.firstName}`,
    specialty: specialtyNames[record.appointment.doctor.specialty],
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    indications: record.indications,
  }));

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Mi historial clínico
        </h1>
      </header>
      <ClinicalHistoryTable records={entries} />
    </section>
  );
}
