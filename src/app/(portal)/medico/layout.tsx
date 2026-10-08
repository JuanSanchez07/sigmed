import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import RoleShell from "../role-shell";

export const metadata: Metadata = {
  title: {
    template: "%s | Medico",
    default: "Medico",
  },
  description: "Consultas de la jornada y organización de la atención propia"
};

const items = [
  { href: "/medico", label: "Inicio" },
  { href: "/medico/agenda", label: "Hoja de trabajo" },
];

export default function MedicoLayout({ children }: LayoutProps<"/medico">) {
  return (
    <RoleShell role="Médico" items={items}>
      {children}
    </RoleShell>
  );
}
