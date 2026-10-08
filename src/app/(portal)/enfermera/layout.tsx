import RoleShell from "../role-shell";

const items = [
  { href: "/enfermera", label: "Inicio" },
  { href: "/enfermera/vacunas", label: "Catálogo de vacunas" },
  { href: "/enfermera/inventario", label: "Stock" },
  { href: "/enfermera/turnos-vacunacion", label: "Turnos de vacunación" },
];

export default function EnfermeraLayout({ children }: LayoutProps<"/enfermera">) {
  return (
    <RoleShell role="Enfermera" items={items}>
      {children}
    </RoleShell>
  );
}
