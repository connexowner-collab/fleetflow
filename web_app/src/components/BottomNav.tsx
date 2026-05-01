"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Truck, ClipboardCheck, BarChart2, Settings } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/frota",     label: "Frota",      icon: Truck           },
  { href: "/checklists",label: "Checklists", icon: ClipboardCheck  },
  { href: "/relatorios",label: "Relatórios", icon: BarChart2       },
  { href: "/configuracoes", label: "Config", icon: Settings        },
];

// Roles que NÃO veem determinados itens
const ROLE_HIDE: Record<string, string[]> = {
  motorista: ["/frota", "/relatorios", "/configuracoes"],
};

export default function BottomNav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const perfil = user?.perfil ?? "";
  const hidden = ROLE_HIDE[perfil] ?? [];
  const items = mounted ? navItems.filter(i => !hidden.includes(i.href)) : navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 pb-safe px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 group"
            >
              <span
                className={`
                  w-10 h-7 flex items-center justify-center rounded-full transition-all duration-200
                  ${isActive
                    ? "bg-brand-primary/10"
                    : "group-hover:bg-gray-100"}
                `}
              >
                <Icon
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? "text-brand-primary" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
              </span>
              <span
                className={`text-[10px] font-semibold tracking-tight transition-colors duration-200 ${
                  isActive ? "text-brand-primary" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
