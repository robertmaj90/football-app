"use client";

import { useEffect, useState } from "react";
import { formatMoney, dayOfWeekName, parseMoneyToGrosze } from "@/lib/utils";


interface Schedule {
  id: string;
  name: string;
  dayOfWeek: number;
  time: string;
  location: string;
  maxPlayers: number;
  pricePerGame: number;
  isActive: boolean;
  _count: { games: number };
}

const emptyForm = {
  name: "",
  dayOfWeek: "3",
  time: "20:00",
  location: "",
  maxPlayers: "14",
  pricePerGame: "350",
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  async function loadSchedules() {
    const res = await fetch("/api/schedules");
    setSchedules(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(s: Schedule) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      dayOfWeek: String(s.dayOfWeek),
      time: s.time,
      location: s.location,
      maxPlayers: String(s.maxPlayers),
      pricePerGame: String(s.pricePerGame / 100),
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      pricePerGame: parseMoneyToGrosze(form.pricePerGame),
    };

    if (editingId) {
      await fetch(`/api/schedules/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    cancelForm();
    loadSchedules();
  }

  async function toggleActive(s: Schedule) {
    await fetch(`/api/schedules/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    loadSchedules();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Harmonogramy</h1>
        <button
          onClick={showForm ? cancelForm : startCreate}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          {showForm ? "Anuluj" : "+ Nowy harmonogram"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">
            {editingId ? "Edytuj harmonogram" : "Nowy harmonogram"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nazwa (np. Środowa piłka)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <select
                value={form.dayOfWeek}
                onChange={(e) =>
                  setForm({ ...form, dayOfWeek: e.target.value })
                }
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              >
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {dayOfWeekName(d)}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="text"
                placeholder="Lokalizacja"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="number"
                placeholder="Max graczy"
                value={form.maxPlayers}
                onChange={(e) =>
                  setForm({ ...form, maxPlayers: e.target.value })
                }
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
                min="2"
              />
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Koszt grania (PLN)"
                  value={form.pricePerGame}
                  onChange={(e) =>
                    setForm({ ...form, pricePerGame: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                />
                <span className="absolute right-3 top-2.5 text-gray-400 text-sm">
                  PLN
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Koszt grania = łączna kwota za wynajem boiska. Cena per gracz
              zostanie wyliczona automatycznie na ekranie grania.
            </p>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              {editingId ? "Zapisz zmiany" : "Utwórz harmonogram"}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-center text-gray-500 col-span-2">
            Ładowanie...
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center text-gray-500 col-span-2">
            Brak harmonogramów
          </div>
        ) : (
          schedules.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-sm border p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{s.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-xs px-2 py-1 rounded-full cursor-pointer ${
                      s.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {s.isActive ? "Aktywny" : "Nieaktywny"}
                  </button>
                  <button
                    onClick={() => startEdit(s)}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    Edytuj
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>
                  📅 {dayOfWeekName(s.dayOfWeek)} o {s.time}
                </div>
                <div>📍 {s.location}</div>
                <div>
                  👥 Max {s.maxPlayers} graczy • 💰{" "}
                  {formatMoney(s.pricePerGame)} za granie
                </div>
                <div className="text-xs text-gray-400">
                  ~{formatMoney(Math.round(s.pricePerGame / s.maxPlayers))}
                  /gracz przy pełnym składzie • {s._count.games} grań
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
