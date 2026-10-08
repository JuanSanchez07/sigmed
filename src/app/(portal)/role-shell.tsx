import RoleNav, { type NavItem } from "./role-nav";

export default function RoleShell({
  role,
  items,
  children,
}: {
  role: string;
  items: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
          Rol {role}
        </span>

        <RoleNav items={items} />
      </div>

      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
