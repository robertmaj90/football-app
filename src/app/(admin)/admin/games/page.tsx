"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/utils";

interface Schedule {
  id: string;
  name: string;
  dayOfWeek: number;
  time: string;
  location: string;
  maxPlayers: number;
  pricePerGame: number;
}

interface Game {
  id: string;
  date: string;
  maxPlayers: number;
  pricePerGame: number;
  status: string;
  schedule: { name: string; location: string };
  _count: { signups: number };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Otwarte", color: "bg-green-100 text-green-700" },
  LOCKED: { label: "Zamknięte", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Rozliczone", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Odwołane", color: "bg-red-100 text-red-700" },
};

const ALL_STATUSES = ["OPEN", "LOCKED", "COMPLETED", "CANCELLED"] as const;

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [gameDate, setGameDate] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(
    new Set(["OPEN", "LOCKED"])
  );

  function toggleStatus(status: string) {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  const filteredGames = games.filter((g) => activeStatuses.has(g.status));

  async function loadData() {
    const [gRes, sRes] = await Promise.all([
      fetch("/api/games"),
      fetch("/api/schedules"),
    ]);
    setGames(await gRes.json());
    setSchedules(await sRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Oblicz najbliższą datę dla danego harmonogramu
  function getNextDateForSchedule(schedule: Schedule): string {
    const now = new Date();
    const targetDay = schedule.dayOfWeek; // 0=niedziela, 1=poniedziałek, ...
    const [hours, minutes] = schedule.time.split(":").map(Number);

    // Znajdź najbliższy dzień tygodnia
    const currentDay = now.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;

    // Jeśli to dziś, ale godzina już minęła — bierzemy za tydzień
    if (daysUntil === 0) {
      const todayTarget = new Date(now);
      todayTarget.setHours(hours, minutes, 0, 0);
      if (now > todayTarget) {
        daysUntil = 7;
      }
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    nextDate.setHours(hours, minutes, 0, 0);

    // Format: YYYY-MM-DDTHH:mm (dla datetime-local input)
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, "0");
    const d = String(nextDate.getDate()).padStart(2, "0");
    const h = String(nextDate.getHours()).padStart(2, "0");
    const min = String(nextDate.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  function handleScheduleChange(scheduleId: string) {
    setSelectedSchedule(scheduleId);
    if (scheduleId) {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (schedule) {
        setGameDate(getNextDateForSchedule(schedule));
      }
    } else {
      setGameDate("");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduleId: selectedSchedule,
        date: gameDate,
      }),
    });
    setShowForm(false);
    setSelectedSchedule("");
    setGameDate("");
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gierki</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          {showForm ? "Anuluj" : "+ Nowe gierkę"}
        </button>
      </div>

      {/* Pastylki filtrów statusów */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((status) => {
          const st = statusLabels[status];
          const isActive = activeStatuses.has(status);
          const count = games.filter((g) => g.status === status).length;
          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? `${st.color} border-current`
                  : "bg-gray-100 text-gray-400 border-gray-200"
              }`}
            >
              {st.label} ({count})
            </button>
          );
        })}
        <button
          onClick={() => {
            if (activeStatuses.size === ALL_STATUSES.length) {
              setActiveStatuses(new Set(["OPEN", "LOCKED"]));
            } else {
              setActiveStatuses(new Set(ALL_STATUSES));
            }
          }}
          className="px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 text-gray-500 hover:bg-gray-50 transition-all"
        >
          {activeStatuses.size === ALL_STATUSES.length ? "Domyślne" : "Wszystkie"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Utwórz gierkę</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedSchedule}
                onChange={(e) => handleScheduleChange(e.target.value)}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Wybierz harmonogram</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location})
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            {selectedSchedule && gameDate && (
              <p className="text-xs text-gray-500">
                📅 Podpowiedziana data na podstawie harmonogramu. Możesz ją zmienić.
              </p>
            )}
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Utwórz gierkę
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Ładowanie...</div>
        ) : filteredGames.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {games.length === 0
              ? "Brak gierek. Utwórz pierwszą gierkę."
              : "Brak gierek dla wybranych statusów."}
          </div>
        ) : (
          <div className="divide-y">
            {filteredGames.map((g) => {
              const st = statusLabels[g.status] || {
                label: g.status,
                color: "bg-gray-100",
              };
              return (
                <Link
                  key={g.id}
                  href={`/admin/games/${g.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{formatDate(g.date)}</div>
                    <div className="text-sm text-gray-500">
                      {g.schedule.name} • {g.schedule.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">
                      {g._count.signups}/{g.maxPlayers}
                    </span>
                    <span className="text-gray-400">
                      {formatMoney(g.pricePerGame)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
