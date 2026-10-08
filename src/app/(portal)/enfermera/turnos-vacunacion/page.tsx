import { VaccinationAppointmentState } from "@/generated/prisma/enums";
import {
  clinicToday,
  getUpcomingAppointments,
  getVaccinesWithStock,
} from "@/lib/vaccination";
import { AssignmentForm } from "./assignment-form";
import { CancelAppointmentButton } from "./cancel-appointment-button";

export const metadata = {
  title: "Turnos de vacunacion | SigMed",
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_BADGE: Partial<
  Record<VaccinationAppointmentState, { label: string; className: string }>
> = {
  [VaccinationAppointmentState.APROBADO]: {
    label: "Confirmado",
    className: "bg-emerald-100 text-emerald-800",
  },
  [VaccinationAppointmentState.PENDIENTE]: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800",
  },
};

export default async function TurnosVacunacionPage() {
  const [vaccines, appointments] = await Promise.all([
    getVaccinesWithStock(),
    getUpcomingAppointments(),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Turnos de vacunación
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Asigná un turno y reservá una dosis del lote que vence primero.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">Asignar turno</h2>
        <AssignmentForm vaccines={vaccines} minDate={clinicToday()} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Turnos de vacunación programados
        </h2>

        {appointments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No hay turnos programados.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Fecha y hora</th>
                  <th scope="col" className="px-4 py-3 font-medium">Paciente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {appointments.map((appointment) => {
                  const badge = STATUS_BADGE[appointment.status];
                  const when = dateTimeFormatter.format(appointment.scheduledAt);

                  return (
                    <tr key={appointment.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{when}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-zinc-900">
                          {appointment.patientName}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          DNI {appointment.patientDni}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-zinc-900">{appointment.vaccineName}</span>
                        {appointment.lotNumber ? (
                          <span className="block text-xs text-zinc-500">
                            Lote {appointment.lotNumber}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {badge ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">{appointment.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <CancelAppointmentButton
                          appointmentId={appointment.id}
                          description={`${appointment.patientName} del ${when}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}