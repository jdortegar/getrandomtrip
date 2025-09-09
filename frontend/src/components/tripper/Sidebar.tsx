"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Route, DollarSign, Users, Settings, Calendar, BarChart2, MessageSquare } from "lucide-react";
import Image from "next/image";

const navItems = [
  { name: "Tripper OS", href: "/tripper", icon: Home },
  { name: "Mis Rutas", href: "/tripper/routes", icon: Route },
  { name: "Reservas", href: "/tripper/bookings", icon: Calendar },
  { name: "Ingresos", href: "/tripper/earnings", icon: DollarSign },
  { name: "Comunidad", href: "/tripper/community", icon: Users },
  { name: "Configuración", href: "/tripper/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-neutral-900 text-white p-4 flex flex-col shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 mb-6">
        <Image src="/logo-randomtrip-white.svg" alt="Randomtrip Logo" width={150} height={40} />
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center p-3 rounded-lg transition-colors
                  ${pathname === item.href
                    ? "bg-neutral-700 text-white"
                    : "hover:bg-neutral-800 text-neutral-300 hover:text-white"}
                `}
              >
                <item.icon size={20} className="mr-3" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer/User Info (Optional) */}
      <div className="mt-auto pt-4 border-t border-neutral-700 text-neutral-400 text-xs">
        <p>© 2024 Randomtrip. Todos los derechos reservados.</p>
      </div>
    </aside>
  );
}
