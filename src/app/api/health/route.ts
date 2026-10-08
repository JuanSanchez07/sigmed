import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

    return NextResponse.json({
      status: "ok",
      database: "connected",
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] fallo al consultar la base:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: "No se pudo consultar la base de datos. Revisar DATABASE_URL.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}