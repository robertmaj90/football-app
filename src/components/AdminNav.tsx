"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/players", label: "Gracze", icon: "👥" },
  { href: "/admin/schedules", label: "Harmonogramy", icon: "📅" },
  { href: "/admin/games", label: "Grania", icon: "⚽" },
  { href: "/admin/help", label: "Pomoc", icon: "❓" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="font-bold text-green-700 mr-4 hidden sm:block">
              ⚽ Admin
            </span>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50"
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
            className="text-sm text-gray-500 hover:text-gray-700 ml-2"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}
