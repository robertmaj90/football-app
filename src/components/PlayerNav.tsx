"use client";

import { signOut, useSession } from "next-auth/react";

export function PlayerNav() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-700">⚽ Piłka Nożna</span>
            {session?.user?.name && (
              <span className="text-sm text-gray-400 hidden sm:inline">
                — {session.user.name}
              </span>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </nav>
  );
}
