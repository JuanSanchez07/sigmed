// app/ui/medico/filtros.tsx
'use client';
import { ESTADOS, ETIQUETAS_ESTADO } from "@/lib/turnos-estados";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSearch } from "react-icons/hi";

interface FiltrosProps {
    fecha: string;
}

const FILTROS = [{ valor: "", texto: "Todos" },
                ...ESTADOS.map((e) => ({ valor: e, texto: ETIQUETAS_ESTADO[e]}))];

function moverDia(fecha: string, dias: number) {
    const d = new Date(`${fecha}T12:00:00`);
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString("en-CA");
}

export default function Filtros({ fecha }: FiltrosProps) {
    const router = useRouter();
    const pathName = usePathname();
    const params = useSearchParams();

    function actualizar(clave: string, valor:string) {
        const nuevos = new URLSearchParams(params.toString());
        if (valor)
            nuevos.set(clave, valor);
        else nuevos.delete(clave);
        router.replace(`${pathName}?${nuevos.toString()}`);
    }

    return(
        <div className="flex flex-col">
            {/* Selector de fecha */}
            <div className="flex flex-row justify-center border-y border-gray-300 p-4 gap-3">
                <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2"
                        onClick={() => actualizar("fecha", moverDia(fecha, -1))}>
                    <HiOutlineChevronLeft /> Anterior
                </button>
                <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => actualizar("fecha", e.target.value)}
                    className="border border-gray-300 rounded-md text-black p-0.5"
                />
                <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2"
                        onClick={() => actualizar("fecha", moverDia(fecha, 1))}>
                    Siguiente <HiOutlineChevronRight />
                    </button>
            </div>
            {/* Opciones de filtros y busqueda */}
            <div className="flex justify-around rounded-sm bg-gray-200 m-2 p-2">
                <div className="flex flex-row text-black gap-2">
                    Filtros:
                    {/* Ajustar según la cantidad de filtros y como se obtienen */}
                    {FILTROS.map((opcion) => (
                        <label key={opcion.valor}>
                            <input
                                type="radio"
                                name="filtro"
                                value={opcion.valor}
                                checked={(params.get('filtro') ?? '') === opcion.valor}
                                onChange={() => actualizar("filtro", opcion.valor)}
                            />
                            {opcion.texto}
                        </label>
                    ))}
                </div>
                <div>
                    <div className="flex flex-row items-center border-2 border-gray-300 rounded-xl bg-white px-2">
                        <HiOutlineSearch className="text-gray-400 text-lg mr-4" />
                        <input
                            className="text-base text-gray-400 placeholder-gray-400 focus:outline-none rounded-xl"
                            type="search"
                            placeholder="Buscar..."
                            defaultValue={params.get('busqueda') ?? ''}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    actualizar("busqueda", e.currentTarget.value);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}