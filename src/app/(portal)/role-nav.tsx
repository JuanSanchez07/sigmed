"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
};

export default function RoleNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
