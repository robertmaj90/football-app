"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";

interface Game {
  id: string;
  date: string;
  maxPlayers: number;
  pricePerGame: number;
  status: string;
  schedule: { name: string; location: string; time: string };
  signups: {
    id: string;
    position: number;
    isReserve: boolean;
    user: { id: string; name: string };
  }[];
  _count: { signups: number };
}

interface PlayerGame {
  gameId: string;
  date: string;
  status: string;
  scheduleName: string;
  location: string;
  time: string;
  pricePerGame: number;
  maxPlayers: number;
  totalSignups: number;
  mainListCount: number;
  position: number;
  isReserve: boolean;
  attended: "UNKNOWN" | "PRESENT" | "ABSENT";
  charged: boolean;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface PlayerInfo {
  id: string;
  balance: number;
  name: string;
}

type Tab = "upcoming" | "history" | "balance";

const typeLabels: Record<string, string> = {
  DEPOSIT: "💰 Wpłata",
  GAME_CHARGE: "⚽ Opłata za gierkę",
  REFUND: "↩️ Zwrot",
  ADJUSTMENT: "📝 Korekta",
};

const attendLabels: Record<string, { label: string; color: string }> = {
  UNKNOWN: { label: "—", color: "text-gray-400" },
  PRESENT: { label: "✅ Byłem", color: "text-green-700" },
  ABSENT: { label: "❌ Nie byłem", color: "text-red-600" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Otwarte", color: "bg-green-100 text-green-700" },
  LOCKED: { label: "Zamknięte", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Rozliczone", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Odwołane", color: "bg-red-100 text-red-700" },
};

export default function PlayerDashboard() {
  const { data: session } = useSession();
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<PlayerGame[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  async function loadData() {
    if (!session?.user?.id) return;
    const [gRes, pRes, mgRes, payRes] = await Promise.all([
      fetch("/api/games?upcoming=true"),
      fetch(`/api/players/${session.user.id}`),
      fetch(`/api/players/${session.user.id}/games`),
      fetch(`/api/players/${session.user.id}/payments`),
    ]);
    if (gRes.ok) setUpcomingGames(await gRes.json());
    if (pRes.ok) setPlayer(await pRes.json());
    if (mgRes.ok) setMyGames(await mgRes.json());
    if (payRes.ok) setPayments(await payRes.json());
    setLoading(false);
  }

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  async function signup(gameId: string) {
    await fetch(`/api/games/${gameId}/signups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    loadData();
  }

  async function unsign(gameId: string) {
    await fetch(`/api/games/${gameId}/signups`, {
      method: "DELETE",
    });
    loadData();
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Ładowanie...</div>;
  }

  const myId = session?.user?.id;
  const pastGames = myGames.filter(
    (g) => g.status === "COMPLETED" || g.status === "CANCELLED"
  );
  const totalCharged = payments
    .filter((p) => p.type === "GAME_CHARGE")
    .reduce((sum, p) => sum + Math.abs(p.amount), 0);
  const totalDeposited = payments
    .filter((p) => p.type === "DEPOSIT")
    .reduce((sum, p) => sum + p.amount, 0);
  const gamesPlayed = pastGames.filter((g) => g.attended === "PRESENT").length;

  return (
    <div className="space-y-6">
      {/* Karty podsumowania */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">Bilans</div>
          <div
            className={`text-xl font-bold mt-0.5 ${
              (player?.balance ?? 0) < 0 ? "text-red-600" : "text-green-700"
            }`}
          >
            {formatMoney(player?.balance ?? 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">Rozegrane</div>
          <div className="text-xl font-bold mt-0.5">{gamesPlayed}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">Wpłacone</div>
          <div className="text-xl font-bold mt-0.5 text-green-700">
            {formatMoney(totalDeposited)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-xs text-gray-500">Wydane na gry</div>
          <div className="text-xl font-bold mt-0.5 text-red-600">
            {formatMoney(totalCharged)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(
          [
            { key: "upcoming", label: `⚽ Gierki (${upcomingGames.length})` },
            { key: "history", label: `📋 Historia (${pastGames.length})` },
            { key: "balance", label: `💰 Bilans (${payments.length})` },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "upcoming" && (
        <UpcomingTab
          games={upcomingGames}
          myId={myId}
          onSignup={signup}
          onUnsign={unsign}
        />
      )}
      {tab === "history" && <HistoryTab games={pastGames} />}
      {tab === "balance" && <BalanceTab payments={payments} />}
    </div>
  );
}

/* ===================== UPCOMING TAB ===================== */
function UpcomingTab({
  games,
  myId,
  onSignup,
  onUnsign,
}: {
  games: Game[];
  myId?: string;
  onSignup: (id: string) => void;
  onUnsign: (id: string) => void;
}) {
  if (games.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
        Brak nadchodzących gierek
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((g) => {
        const mySignup = g.signups.find((s) => s.user.id === myId);
        const isSigned = !!mySignup;
        const mainCount = g.signups.filter((s) => !s.isReserve).length;

        return (
          <div
            key={g.id}
            className="bg-white rounded-xl shadow-sm border p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="font-semibold">{formatDate(g.date)}</div>
                <div className="text-sm text-gray-500">
                  {g.schedule.name} • {g.schedule.location} • {g.schedule.time}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {mainCount}/{g.maxPlayers} graczy •{" "}
                  ~
                  {formatMoney(
                    mainCount > 0
                      ? Math.round(g.pricePerGame / mainCount)
                      : g.pricePerGame
                  )}
                  /os
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSigned ? (
                  <>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        mySignup.isReserve
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {mySignup.isReserve
                        ? `Rezerwowy #${mySignup.position - g.maxPlayers}`
                        : `Zapisany #${mySignup.position}`}
                    </span>
                    {g.status === "OPEN" && (
                      <button
                        onClick={() => onUnsign(g.id)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Wypisz się
                      </button>
                    )}
                  </>
                ) : g.status === "OPEN" ? (
                  <button
                    onClick={() => onSignup(g.id)}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Zapisz się
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">
                    Zapisy zamknięte
                  </span>
                )}
              </div>
            </div>

            {/* Lista zapisanych */}
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500 mb-1">Zapisani:</div>
              <div className="flex flex-wrap gap-1">
                {g.signups
                  .filter((s) => !s.isReserve)
                  .map((s) => (
                    <span
                      key={s.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        s.user.id === myId
                          ? "bg-green-200 text-green-800 font-medium"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.user.name}
                    </span>
                  ))}
              </div>
              {g.signups.filter((s) => s.isReserve).length > 0 && (
                <>
                  <div className="text-xs text-gray-500 mt-2 mb-1">
                    Rezerwowi:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.signups
                      .filter((s) => s.isReserve)
                      .map((s) => (
                        <span
                          key={s.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            s.user.id === myId
                              ? "bg-yellow-200 text-yellow-800 font-medium"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s.user.name}
                        </span>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== HISTORY TAB ===================== */
function HistoryTab({ games }: { games: PlayerGame[] }) {
  if (games.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
        Brak historii gierek
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="divide-y">
        {games.map((g) => {
          const st = statusLabels[g.status] || {
            label: g.status,
            color: "bg-gray-100",
          };
          const att = attendLabels[g.attended] || attendLabels.UNKNOWN;
          const perPlayer =
            g.mainListCount > 0
              ? Math.round(g.pricePerGame / g.mainListCount)
              : 0;

          return (
            <div key={g.gameId} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">
                    {formatDate(g.date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {g.scheduleName} • {g.location}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${st.color}`}
                >
                  {st.label}
                </span>
              </div>

              {g.status === "COMPLETED" && (
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className={att.color}>{att.label}</span>
                  {g.charged && (
                    <span className="text-gray-500">
                      Opłata: {formatMoney(perPlayer)}
                    </span>
                  )}
                  <span className="text-gray-400">
                    {g.mainListCount} graczy
                  </span>
                </div>
              )}

              {g.status === "CANCELLED" && (
                <div className="mt-2 text-xs text-gray-400">
                  Gierka odwołana
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== BALANCE TAB ===================== */
function BalanceTab({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
        Brak transakcji
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="divide-y">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-5 py-3"
          >
            <div>
              <div className="text-sm font-medium">
                {typeLabels[p.type] || p.type}
              </div>
              <div className="text-xs text-gray-500">
                {p.description && <span>{p.description} • </span>}
                {formatDateTime(p.createdAt)}
              </div>
            </div>
            <div
              className={`font-semibold ${
                p.amount >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {p.amount >= 0 ? "+" : ""}
              {formatMoney(p.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
