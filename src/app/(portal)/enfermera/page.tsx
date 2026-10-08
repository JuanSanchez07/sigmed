import Placeholder from "../placeholder";

export default function EnfermeraPage() {
  return (
    <Placeholder
      title="Área de la enfermera"
      description="Gestión del catálogo de vacunas, del stock por lote y de los turnos de vacunación."
      tasks={[
        "US-3.1 · Alta de nuevas vacunas (RF-33)",
        "US-3.2 · Registro y actualización de stock (RF-11)",
        "US-3.6 · Asignación de turnos de vacunación (RF-12)",
      ]}
    />
  );
}
