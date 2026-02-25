"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/players", label: "Gracze", icon: "👥" },
  { href: "/admin/schedules", label: "Harmonogramy", icon: "📅" },
  { href: "/admin/games", label: "Gierki", icon: "⚽" },
  { href: "/admin/finance", label: "Finanse", icon: "💰" },
  { href: "/admin/help", label: "Pomoc", icon: "❓" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-white/20 text-white shadow-sm backdrop-blur-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <span className="sm:hidden">{link.icon}</span>
                <span className="hidden sm:inline">
                  {link.icon} {link.label}
                </span>
              </Link>
            ))}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-white/60 hover:text-white transition-colors ml-2"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}
