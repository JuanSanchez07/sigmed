import { prisma } from "@/lib/db";
import { MovementForm } from "./movement-form";

export const metadata = {
  title: "Actualizacion de stock | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function InventarioPage() {
  const [vaccines, movements] = await Promise.all([
    prisma.vaccine.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        lot: {
          select: { lotNumber: true, vaccine: { select: { name: true } } },
        },
        actor: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Actualización de Stock
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Registra ingresos y ajustes de dosis. Cada movimiento queda trazado
          con su responsable.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Registro de Movimiento
        </h2>
        <MovementForm vaccines={vaccines} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Historial de Movimientos Recientes
        </h2>

        {movements.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Todavia no hay movimientos.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Fecha/hora</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Lote</th>
                  <th scope="col" className="px-4 py-3 font-medium">Movimiento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {movements.map((movement) => {
                  const isIncome = movement.quantity > 0;

                  return (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {movement.lot.vaccine.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.lot.lotNumber}
                      </td>
                      <td
                        className={
                          isIncome
                            ? "px-4 py-3 font-medium text-emerald-700"
                            : "px-4 py-3 font-medium text-red-700"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {Math.abs(movement.quantity)}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          ({movement.type.toLowerCase()})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.actor.firstName} {movement.actor.lastName}
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