import RoleShell from "../role-shell";

const items = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/horarios", label: "Horarios" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleShell role="Administrador" items={items}>
      {children}
    </RoleShell>
  );
}
