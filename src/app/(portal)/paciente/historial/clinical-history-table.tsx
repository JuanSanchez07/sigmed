"use client";

import { Fragment, useMemo, useState, type FormEvent } from "react";

export type ClinicalHistoryEntry = {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  diagnosis: string;
  treatment: string | null;
  indications: string | null;
};

type HistoryFilter = "all" | "treatment" | "indications";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const pageSize = 5;

export default function ClinicalHistoryTable({
  records,
}: {
  records: ClinicalHistoryEntry[];
}) {
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const matches = records.filter((record) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "treatment" && Boolean(record.treatment)) ||
        (filter === "indications" && Boolean(record.indications));
      const searchableText = [
        record.doctor,
        record.specialty,
        record.diagnosis,
        record.treatment,
        record.indications,
        dateFormatter.format(new Date(record.date)),
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("es-AR");

      return matchesFilter && searchableText.includes(searchTerm);
    });

    return matches.sort((a, b) => {
      const difference = new Date(a.date).getTime() - new Date(b.date).getTime();
      return order === "newest" ? -difference : difference;
    });
  }, [filter, order, records, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pageRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);
  const firstResult = filteredRecords.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, filteredRecords.length);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchTerm(searchInput.trim().toLocaleLowerCase("es-AR"));
    setPage(1);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3 sm:px-6">
        <label htmlFor="history-order" className="text-xs font-medium text-zinc-600">
          Ordenar por
        </label>
        <select
          id="history-order"
          value={order}
          onChange={(event) => {
            setOrder(event.target.value as "newest" | "oldest");
            setPage(1);
          }}
          className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-800 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
        >
          <option value="newest">Más recientes primero</option>
          <option value="oldest">Más antiguas primero</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <legend className="sr-only">Filtrar atenciones</legend>
          <span className="text-sm font-medium text-zinc-700">Filtros:</span>
          {(
            [
              ["all", "Todas"],
              ["treatment", "Con tratamiento"],
              ["indications", "Con indicaciones"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-zinc-700">
              <input
                type="radio"
                name="history-filter"
                value={value}
                checked={filter === value}
                onChange={() => {
                  setFilter(value);
                  setPage(1);
                }}
                className="size-4 accent-teal-700"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <form onSubmit={submitSearch} className="flex w-full gap-2 lg:max-w-sm">
          <label htmlFor="history-search" className="sr-only">
            Buscar por fecha, profesional o contenido clínico
          </label>
          <input
            id="history-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar..."
            className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
          />
          <button
            type="submit"
            className="h-9 shrink-0 rounded-md bg-zinc-800 px-3 text-sm font-medium text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Buscar
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[26%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead className="border-b border-zinc-200 bg-white text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium sm:px-4">Fecha</th>
              <th scope="col" className="px-3 py-3 font-medium sm:px-4">Profesional</th>
              <th scope="col" className="px-3 py-3 font-medium sm:px-4">Diagnóstico</th>
              <th scope="col" className="px-3 py-3 font-medium sm:px-4">Tratamiento</th>
              <th scope="col" className="px-3 py-3 text-center font-medium sm:px-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pageRecords.map((record) => {
              const isExpanded = expandedRecord === record.id;
              const detailsId = `clinical-record-${record.id}`;

              return (
                <Fragment key={record.id}>
                  <tr className="align-top hover:bg-zinc-50/70">
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-700 sm:px-4">
                      <time dateTime={record.date}>
                        {dateFormatter.format(new Date(record.date))}
                      </time>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <p className="font-medium text-zinc-900">{record.doctor}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{record.specialty}</p>
                    </td>
                    <td className="whitespace-pre-wrap break-words px-3 py-3 leading-5 text-zinc-800 sm:px-4">
                      {record.diagnosis}
                    </td>
                    <td className="whitespace-pre-wrap break-words px-3 py-3 leading-5 text-zinc-700 sm:px-4">
                      {record.treatment || <span className="text-zinc-400">Sin tratamiento</span>}
                    </td>
                    <td className="px-3 py-3 text-center sm:px-4">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                      >
                        {isExpanded ? "Cerrar" : "Detalle"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr id={detailsId} className="bg-zinc-50">
                      <td colSpan={5} className="px-4 py-4 sm:px-6">
                        <dl>
                          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Indicaciones
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                            {record.indications || "No se registraron indicaciones."}
                          </dd>
                        </dl>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {pageRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-500">
                  {records.length === 0
                    ? "Todavía no hay atenciones registradas."
                    : "No se encontraron atenciones con esos filtros."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 sm:px-6">
        <p aria-live="polite">
          {filteredRecords.length === 0
            ? "0 resultados"
            : `${firstResult}-${lastResult} de ${filteredRecords.length} resultados`}
        </p>
        <nav aria-label="Paginación del historial" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="min-w-16 text-center text-xs text-zinc-500">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount}
            className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      </footer>
    </>
  );
}
