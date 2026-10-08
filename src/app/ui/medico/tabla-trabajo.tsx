import { prisma } from "@/lib/db";
import { ETIQUETAS_ESTADO, obtenerTurnos } from "@/lib/turnos";

// app/ui/medico/tabla-trabajo.tsx
type SearchParams = {
    fecha: string;
    filtro?: string;
    busqueda?: string;
};
interface TablaTrabajoProps {
    props: SearchParams
}

export default async function TablaTrabajo({ props }: TablaTrabajoProps) {
    const resolvedParams = props;
    const fecha = resolvedParams?.fecha;
    const filtro = resolvedParams?.filtro;
    const busqueda = resolvedParams?.busqueda || "";
    //Obtener usuario logueado
    const userId = 0;/*await auth();
    if (!userId)
        return null;

    const perfil = await prisma.userProfile.findUnique({
        where: { userId },
        select: { id: true, role: true }
    });*/

    //Consultar turnos segun filtros y busqueda
    const turnos: [] = [];/*await obtenerTurnos({
                    doctorId: "doctorId",
                    fecha,
                    estado: filtro,
                    busqueda });*/

    return (
        <div className="overflow-hidden rounded-xl border border-gray-400 m-2">
            <table className="w-full p-2">
                <thead>
                    <tr className="text-center text-lg text-uppercase text-slate-500 bg-gray-200">
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>DNI</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {(turnos.length > 0) ? (
                        turnos.map((t) => {
                            return (
                                <tr key={0/*t.id*/} className="">
                                    <td>
                                        XX:XX
                                        {/*t.startAt.getTime() ? t.startAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }) : "Hora no disponible"*/}
                                    </td>
                                    <td>
                                        Apellido, Nombre
                                        {/*(t.patient) ? `${t.patient.profile.lastName}, ${t.patient.profile.firstName}` : "Paciente no disponible"*/}
                                    </td>
                                    <td>
                                        XX.XXX.XXX
                                        {/*(t.patient) ? t.patient.profile.dni : "DNI no disponible"*/}
                                    </td>
                                    <td className="text-black bg-gray-300 rounded-lg">
                                        Estado
                                        {/*(t.status) ? ETIQUETAS_ESTADO[t.status] : "Estado no disponible"*/}
                                    </td>
                                    <td className="text-white bg-slate-600 rounded-sm">
                                        Accion
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td className="text-center text-lg text-black italic" colSpan={5}>
                                No hay turnos para mostrar
                            </td>
                        </tr>
                    )
                }
                </tbody>
            </table>
        </div>
    );
}