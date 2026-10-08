import RoleShell from "../role-shell";

const items = [
  { href: "/paciente", label: "Inicio" },
  { href: "/paciente/historial", label: "Mi historial" },
];

export default function PacienteLayout({ children }: LayoutProps<"/paciente">) {
  return (
    <RoleShell role="Paciente" items={items}>
      {children}
    </RoleShell>
  );
}
