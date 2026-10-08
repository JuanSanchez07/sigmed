import { prisma } from "@/lib/db";
import { Specialty } from "@/generated/prisma/client";
import { getCurrentActor } from "@/lib/dev-actor";
import { HorariosForm } from "./horarios-form";

export default async function HorariosPage() {
  const actor = await getCurrentActor();
  const canEditSchedules = actor?.role === "ADMINISTRADOR";

  // 1. Obtenemos los médicos para poblar el selector
  const medicos = await prisma.doctor.findMany({
    orderBy: [{ specialty: "asc" }, { licenseNumber: "asc" }],
    select: {
      id: true,
      specialty: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  const especialidades: Record<Specialty, string> = {
    [Specialty.CLINICO]: "Medicina General",
    [Specialty.PEDIATRA]: "Pediatría",
    [Specialty.TRAUMATOLOGO]: "Traumatología",
  };

  // 2. Obtenemos la agenda real desde la base de datos
  const horariosGuardados = await prisma.doctorSchedule.findMany({
    include: {
      doctor: {
        include: { profile: true } // Incluimos el perfil para acceder al nombre y la duración
      }
    },
    orderBy: [
      { doctor: { profile: { lastName: 'asc' } } },
      { weekday: 'asc' },
      { startTime: 'asc' }
    ]
  });

  // PostgreSQL TIME is returned as a UTC-based Date; format its stored clock time
  // directly so the server's local timezone does not shift the displayed value.
  const formatTime = (date: Date) => {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold mb-6 border-b pb-4 text-slate-800">
        Modificación de Horarios
      </h1>

      {canEditSchedules ? (
        <HorariosForm
          doctors={medicos.map((medico) => ({
            id: medico.id,
            label: `${medico.profile.lastName}, ${medico.profile.firstName} - ${especialidades[medico.specialty]}`,
          }))}
        />
      ) : (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          Solo un usuario con rol Administrador puede modificar los horarios.
        </p>
      )}

      {/* Agenda Actual del Profesional */}
      <div className="mt-12">
        <h2 className="font-bold text-slate-700 mb-4">Agenda Actual Registrada</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm">
                <th className="p-3 font-semibold">PROFESIONAL</th>
                <th className="p-3 font-semibold">DÍA</th>
                <th className="p-3 font-semibold">FRANJA HORARIA</th>
                <th className="p-3 font-semibold">DURACIÓN</th>
                <th className="p-3 font-semibold">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {horariosGuardados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No hay horarios registrados aún en la base de datos.
                  </td>
                </tr>
              ) : (
                horariosGuardados.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-800 font-medium">
                      {item.doctor.profile.lastName}, {item.doctor.profile.firstName}
                    </td>
                    <td className="p-3 text-slate-800 capitalize">{item.weekday.toLowerCase()}</td>
                    <td className="p-3 text-slate-800">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </td>
                    <td className="p-3 text-slate-800">{item.doctor.consultDuration} min</td>
                    <td className="p-3">
                      <button className="text-sm text-blue-600 hover:underline">Eliminar/Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}