import { prisma } from "@/lib/db";
import { VaccineForm } from "./vaccine-form";
import { EditVaccineRow } from "./edit-vaccine-row";

export const metadata = {
  title: "Alta de vacunas | SigMed",
};

export default async function VacunasPage() {
  const vaccines = await prisma.vaccine.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      laboratory: true,
      criticalLevel: true,
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Alta de Nueva Vacuna
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Carga la vacuna en el catálogo junto con su primer lote.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VaccineForm />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Catálogo Actual de Vacunas
        </h2>

        {vaccines.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">
            Todavia no hay vacunas cargadas.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Laboratorio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Umbral crítico</th>
                  <th scope="col" className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {vaccines.map((vaccine) => (
                  <tr key={vaccine.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {vaccine.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {vaccine.laboratory}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">
                      {vaccine.criticalLevel ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <EditVaccineRow vaccine={vaccine} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}