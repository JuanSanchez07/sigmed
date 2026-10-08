// app/(portal)/medico/agenda/page.tsx
import Filtros from "@/app/ui/medico/filtros";
import TablaTrabajo from "@/app/ui/medico/tabla-trabajo";
import { Suspense } from "react";

type SearchParams = {
    fecha?: string;
    filtro?: string;
    busqueda?: string;
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<SearchParams>}) {
  const resolvedParams = await searchParams;

  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const params = {
    fecha: resolvedParams.fecha || hoy,
    filtro: resolvedParams.filtro || '',
    busqueda: resolvedParams.busqueda || '',
  };

  return (
  <section className="flex flex-col gap-2 p-2 bg-white border border-gray-500 rounded-md shadow-md">
    <span className="text-lg font-bold text-black m-2 p-2">
      Tabla de Trabajo Diario
    </span>
    <Filtros fecha={ params.fecha }/>
    <Suspense key={JSON.stringify(params)} fallback={<p className="text-gray-500 italic">Cargando turnos...</p>}>
      <TablaTrabajo props={ params } />
    </Suspense>
  </section>
  );
}