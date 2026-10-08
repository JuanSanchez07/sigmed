import Placeholder from "../placeholder";

export default function AdminPage() {
  return (
    <Placeholder
      title="Área del administrador"
      description="Administración de la sala médica. Esta área es exclusiva del rol administrador y no expone las áreas de médico ni de paciente."
      tasks={[
        "US-1.5 · Modificación de horarios (RF-27)",
        "RF-30 · Reserva presencial de turnos",
        "RF-24 · Creación de cuentas del personal",
      ]}
    />
  );
}
