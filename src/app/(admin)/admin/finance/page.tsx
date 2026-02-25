"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/utils";

interface Summary {
  totalDeposits: number;
  totalRefunds: number;
  totalGameCharges: number;
  totalBalance: number;
  cashCollected: number;
  cashSpentOnGames: number;
  cashBalance: number;
  venuePaidTotal: number;
  venueUnpaidTotal: number;
}

interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: "DEPOSIT";
  description: string | null;
  createdAt: string;
}

interface GameEntry {
  id: string;
  type: "GAME";
  date: string;
  scheduleName: string;
  location: string;
  totalCharged: number;
  pricePerGame: number;
  playersCharged: number;
  venuePaid: boolean;
}

type FilterType = "all" | "deposits" | "games";
type VenueFilter = "all" | "paid" | "unpaid";

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    const res = await fetch("/api/admin/finance");
    if (res.ok) {
      const data = await res.json();
      setSummary(data.summary);
      setDeposits(data.deposits);
      setGameEntries(data.gameEntries);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleVenuePaid(gameId: string, current: boolean) {
    const res = await fetch(`/api/games/${gameId}/venue-paid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venuePaid: !current }),
    });
    if (res.ok) {
      setGameEntries((prev) =>
        prev.map((g) =>
          g.id === gameId ? { ...g, venuePaid: !current } : g
        )
      );
      // Odśwież podsumowanie
      loadData();
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Ładowanie...</div>;
  }

  const q = search.toLowerCase();

  // Filtrowane wpłaty
  const filteredDeposits =
    filter === "games"
      ? []
      : deposits.filter((d) => {
          if (q && !d.userName.toLowerCase().includes(q) && !(d.description || "").toLowerCase().includes(q)) return false;
          return true;
        });

  // Filtrowane gierki
  const filteredGames =
    filter === "deposits"
      ? []
      : gameEntries.filter((g) => {
          if (venueFilter === "paid" && !g.venuePaid) return false;
          if (venueFilter === "unpaid" && g.venuePaid) return false;
          if (q && !g.scheduleName.toLowerCase().includes(q) && !g.location.toLowerCase().includes(q)) return false;
          return true;
        });

  // Łączona lista do wyświetlania posortowana chronologicznie (najnowsze na górze)
  type TimelineItem =
    | { kind: "deposit"; data: Deposit }
    | { kind: "game"; data: GameEntry };

  const timeline: TimelineItem[] = [];
  filteredDeposits.forEach((d) => timeline.push({ kind: "deposit", data: d }));
  filteredGames.forEach((g) => timeline.push({ kind: "game", data: g }));
  timeline.sort((a, b) => {
    const dateA = a.kind === "deposit" ? new Date(a.data.createdAt) : new Date(a.data.date);
    const dateB = b.kind === "deposit" ? new Date(b.data.createdAt) : new Date(b.data.date);
    return dateB.getTime() - dateA.getTime();
  });

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Wszystkie", count: deposits.length + gameEntries.length },
    { key: "deposits", label: "Wpłaty graczy", count: deposits.length },
    { key: "games", label: "Opłaty za gierki", count: gameEntries.length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finanse</h1>

      {/* Karty podsumowania */}
      {summary && (
        <div className="space-y-3">
          {/* Główne saldo */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 shadow-lg text-white">
            <div className="text-sm opacity-80">Saldo kasy</div>
            <div className="text-3xl font-bold mt-1">
              {formatMoney(summary.cashBalance)}
            </div>
            <div className="text-sm opacity-70 mt-1">
              Zebrane od graczy minus wydane na boiska
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Wpłaty graczy</div>
              <div className="text-lg font-bold mt-0.5 text-green-700">
                +{formatMoney(summary.totalDeposits)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Wydane na boiska</div>
              <div className="text-lg font-bold mt-0.5 text-red-600">
                -{formatMoney(summary.cashSpentOnGames)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Opłacone (boisko)</div>
              <div className="text-lg font-bold mt-0.5 text-emerald-600">
                {formatMoney(summary.venuePaidTotal)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Nieopłacone (boisko)</div>
              <div className={`text-lg font-bold mt-0.5 ${summary.venueUnpaidTotal > 0 ? "text-amber-600" : "text-gray-400"}`}>
                {formatMoney(summary.venueUnpaidTotal)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Szukaj + filtry */}
      <input
        type="text"
        placeholder="Szukaj po graczu, opisie lub lokalizacji..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.key
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}

        {/* Filtr statusu opłaty boiska - tylko gdy widoczne gierki */}
        {filter !== "deposits" && (
          <>
            <span className="text-gray-300 self-center">|</span>
            {(
              [
                { key: "all" as VenueFilter, label: "Wszystkie statusy" },
                { key: "unpaid" as VenueFilter, label: "Nieopłacone" },
                { key: "paid" as VenueFilter, label: "Opłacone" },
              ] as const
            ).map((vf) => (
              <button
                key={vf.key}
                onClick={() => setVenueFilter(vf.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  venueFilter === vf.key
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-gray-50 text-gray-400 border-gray-200"
                }`}
              >
                {vf.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Lista transakcji */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-700 text-sm">
            Historia ({timeline.length})
          </h2>
        </div>
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Brak transakcji
          </div>
        ) : (
          <div className="divide-y">
            {timeline.map((item) => {
              if (item.kind === "deposit") {
                const d = item.data;
                return (
                  <div
                    key={`dep-${d.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">💰</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/players/${d.userId}`}
                            className="font-medium text-sm text-green-700 hover:underline"
                          >
                            {d.userName}
                          </Link>
                          <span className="text-xs text-gray-400">Wpłata</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {d.description && <span>{d.description} · </span>}
                          {formatDate(d.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-sm shrink-0 ml-3 text-green-700">
                      +{formatMoney(d.amount)}
                    </div>
                  </div>
                );
              } else {
                const g = item.data;
                return (
                  <div
                    key={`game-${g.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">⚽</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/games/${g.id}`}
                            className="font-medium text-sm text-blue-700 hover:underline"
                          >
                            {g.scheduleName}
                          </Link>
                          <span className="text-xs text-gray-400">
                            {g.playersCharged} graczy · {g.playersCharged > 0 ? formatMoney(Math.round(g.totalCharged / g.playersCharged)) : formatMoney(0)}/os
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {g.location} · {formatDate(g.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <button
                        onClick={() => toggleVenuePaid(g.id, g.venuePaid)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          g.venuePaid
                            ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                        }`}
                        title={g.venuePaid ? "Oznacz jako nieopłacone" : "Oznacz jako opłacone"}
                      >
                        {g.venuePaid ? "✓ Opłacone" : "Nieopłacone"}
                      </button>
                      <div className="font-semibold text-sm text-red-600">
                        -{formatMoney(g.totalCharged)}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
