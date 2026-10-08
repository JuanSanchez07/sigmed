import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  getCurrentActor,
  isDevActorEnabled,
  listDevActorCandidates,
} from "@/lib/dev-actor";
import { LoginPanel } from "./login-panel";

export const dynamic = "force-dynamic";

type ConnectionState =
  | { status: "connected"; counts: Record<string, number> }
  | { status: "error"; message: string };

async function checkConnection(): Promise<ConnectionState> {
  try {
    const [
      usuarios,
      obrasSociales,
      medicos,
      pacientes,
      horariosAtencion,
      bloqueos,
      turnos,
      vacunas,
      lotes,
      turnosVacunacion,
      movimientos,
      alertas,
      horariosVacunacion,
      pagos,
      comprobantes,
      registrosClinicos,
    ] = await Promise.all([
      prisma.userProfile.count(),
      prisma.insuranceProvider.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.doctorSchedule.count(),
      prisma.scheduleBlock.count(),
      prisma.appointment.count(),
      prisma.vaccine.count(),
      prisma.vaccineLot.count(),
      prisma.vaccinationAppointment.count(),
      prisma.stockMovement.count(),
      prisma.stockAlert.count(),
      prisma.vaccinationSchedule.count(),
      prisma.payment.count(),
      prisma.receipt.count(),
      prisma.clinicalRecord.count(),
    ]);

    return {
      status: "connected",
      counts: {
        usuario: usuarios,
        obra_social: obrasSociales,
        medico: medicos,
        paciente: pacientes,
        horario_atencion: horariosAtencion,
        bloqueo_agenda: bloqueos,
        turno: turnos,
        vacuna: vacunas,
        lote: lotes,
        turno_vacunacion: turnosVacunacion,
        movimiento_stock: movimientos,
        alerta_stock: alertas,
        horario_vacunacion: horariosVacunacion,
        pago: pagos,
        comprobante: comprobantes,
        registro_clinico: registrosClinicos,
      },
    };
  } catch (error) {
    console.error("[home] fallo al consultar la base:", error);

    return {
      status: "error",
      message: "No se pudo consultar la base de datos. Revisar DATABASE_URL.",
    };
  }
}

export default async function Home() {
  const devEnabled = isDevActorEnabled();
  const [actor, candidates] = devEnabled
    ? await Promise.all([getCurrentActor(), listDevActorCandidates()])
    : [null, []];
  const connection = await checkConnection();

  const current = actor
    ? {
        id: actor.id,
        firstName: actor.firstName,
        lastName: actor.lastName,
        email: actor.email,
        role: actor.role,
      }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SigMed</h1>
        <p className="text-zinc-600">
          Sistema de agenda, vacunas e historial clinico para la sala medica.
        </p>
      </header>

      {devEnabled ? (
        <LoginPanel candidates={candidates} current={current} />
      ) : (
        <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          Sesion sin autenticar
        </span>
      )}

      <section className="rounded-lg border border-zinc-200 p-6">
        <h2 className="mb-4 text-lg font-medium">Estado de la base de datos</h2>

        {connection.status === "error" ? (
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              Sin conexion
            </span>
            <p className="text-sm text-zinc-600">{connection.message}</p>
            <p className="text-sm text-zinc-500">
              Revisa <code className="font-mono">DATABASE_URL</code> en las variables de entorno.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              Conectado a Neon
            </span>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {Object.entries(connection.counts).map(([tabla, count]) => (
                <div key={tabla} className="flex items-baseline justify-between gap-2 border-b border-zinc-100 pb-1">
                  <dt className="font-mono text-xs text-zinc-500">{tabla}</dt>
                  <dd className="text-sm font-medium tabular-nums">{count}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <footer className="text-sm text-zinc-500">
        Health check en <Link className="underline" href="/api/health">/api/health</Link>
      </footer>
    </main>
  );
}