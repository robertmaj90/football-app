"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";

interface AdminStats {
  playersCount: number;
  lowBalancePlayers: { id: string; name: string; balance: number }[];
}

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

type MainTab = "admin" | "player";
type PlayerTab = "upcoming" | "history" | "balance";

const typeLabels: Record<string, string> = {
  DEPOSIT: "💰 Wpłata",
  GAME_CHARGE: "⚽ Opłata za granie",
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

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("admin");
  const [playerTab, setPlayerTab] = useState<PlayerTab>("upcoming");

  // Admin stats
  const [stats, setStats] = useState<AdminStats>({
    playersCount: 0,
    lowBalancePlayers: [],
  });

  // Player data (admin jako gracz)
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<PlayerGame[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);

  async function loadData() {
    if (!session?.user?.id) return;

    const [statsRes, gRes, pRes, mgRes, payRes] = await Promise.all([
      fetch("/api/admin/stats"),
      fetch("/api/games?upcoming=true"),
      fetch(`/api/players/${session.user.id}`),
      fetch(`/api/players/${session.user.id}/games`),
      fetch(`/api/players/${session.user.id}/payments`),
    ]);

    if (statsRes.ok) setStats(await statsRes.json());
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
  const gamesPlayed = pastGames.filter(
    (g) => g.attended === "PRESENT"
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Główne zakładki: Admin / Gracz */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setMainTab("admin")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${
            mainTab === "admin"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🛠️ Panel admina
        </button>
        <button
          onClick={() => setMainTab("player")}
          className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${
            mainTab === "player"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚽ Panel gracza
        </button>
      </div>

      {/* ==================== PANEL ADMINA ==================== */}
      {mainTab === "admin" && (
        <div className="space-y-6">
          {/* Admin stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Graczy w systemie</div>
              <div className="text-xl font-bold mt-0.5">{stats.playersCount}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Ujemne bilanse</div>
              <div className="text-xl font-bold mt-0.5 text-red-600">
                {stats.lowBalancePlayers.length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Nadchodzące grania</div>
              <div className="text-xl font-bold mt-0.5">{upcomingGames.length}</div>
            </div>
          </div>

          {/* Ujemne bilanse alert */}
          {stats.lowBalancePlayers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b bg-red-50">
                <h2 className="font-semibold text-red-800 text-sm">
                  ⚠️ Gracze z ujemnym bilansem
                </h2>
              </div>
              <div className="divide-y">
                {stats.lowBalancePlayers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/players/${p.id}`}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50"
                  >
                    <span className="font-medium text-sm">{p.name}</span>
                    <span className="text-red-600 font-semibold text-sm">
                      {formatMoney(p.balance)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nadchodzące grania - skrót */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 text-sm">
                📅 Nadchodzące grania
              </h2>
              <Link
                href="/admin/games"
                className="text-xs text-green-700 hover:underline"
              >
                Wszystkie →
              </Link>
            </div>
            {upcomingGames.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Brak nadchodzących grań
              </div>
            ) : (
              <div className="divide-y">
                {upcomingGames.slice(0, 5).map((g) => {
                  const mainCount = g.signups.filter((s) => !s.isReserve).length;
                  return (
                    <Link
                      key={g.id}
                      href={`/admin/games/${g.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {formatDate(g.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {g.schedule.name} • {g.schedule.location} • {mainCount}/{g.maxPlayers}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          ~{formatMoney(mainCount > 0 ? Math.round(g.pricePerGame / mainCount) : g.pricePerGame)}/os
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            statusLabels[g.status]?.color || "bg-gray-100"
                          }`}
                        >
                          {statusLabels[g.status]?.label || g.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================== PANEL GRACZA ==================== */}
      {mainTab === "player" && (
        <div className="space-y-6">
          {/* Karty gracza */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Mój bilans</div>
              <div
                className={`text-xl font-bold mt-0.5 ${
                  (player?.balance ?? 0) < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {formatMoney(player?.balance ?? 0)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Rozegrane</div>
              <div className="text-xl font-bold mt-0.5">{gamesPlayed}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Wpłacone</div>
              <div className="text-xl font-bold mt-0.5 text-green-700">
                {formatMoney(totalDeposited)}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="text-xs text-gray-500">Wydane</div>
              <div className="text-xl font-bold mt-0.5 text-red-600">
                {formatMoney(totalCharged)}
              </div>
            </div>
          </div>

          {/* Player tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(
              [
                { key: "upcoming", label: `Grania (${upcomingGames.length})` },
                { key: "history", label: `Historia (${pastGames.length})` },
                { key: "balance", label: `Bilans (${payments.length})` },
              ] as { key: PlayerTab; label: string }[]
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setPlayerTab(t.key)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  playerTab === t.key
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {playerTab === "upcoming" && (
            <UpcomingGames
              games={upcomingGames}
              myId={myId}
              onSignup={signup}
              onUnsign={unsign}
            />
          )}
          {playerTab === "history" && <HistoryGames games={pastGames} />}
          {playerTab === "balance" && <BalanceList payments={payments} />}
        </div>
      )}
    </div>
  );
}

/* ===================== UPCOMING ===================== */
function UpcomingGames({
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
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500 text-sm">
        Brak nadchodzących grań
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((g) => {
        const mySignup = g.signups.find((s) => s.user.id === myId);
        const isSigned = !!mySignup;
        const mainCount = g.signups.filter((s) => !s.isReserve).length;

        return (
          <div key={g.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/games/${g.id}`}
                    className="font-semibold text-sm hover:text-green-700"
                  >
                    {formatDate(g.date)}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusLabels[g.status]?.color || "bg-gray-100"}`}>
                    {statusLabels[g.status]?.label || g.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {g.schedule.name} • {g.schedule.location} • {mainCount}/
                  {g.maxPlayers} •{" "}
                  ~{formatMoney(mainCount > 0 ? Math.round(g.pricePerGame / mainCount) : g.pricePerGame)}/os
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
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Wypisz się
                      </button>
                    )}
                  </>
                ) : g.status === "OPEN" ? (
                  <button
                    onClick={() => onSignup(g.id)}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Zapisz się
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Zamknięte</span>
                )}
              </div>
            </div>

            {/* Zapisani */}
            <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
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
              {g.signups.filter((s) => s.isReserve).length > 0 && (
                <>
                  <span className="text-xs text-gray-300 mx-1">|</span>
                  {g.signups
                    .filter((s) => s.isReserve)
                    .map((s) => (
                      <span
                        key={s.id}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          s.user.id === myId
                            ? "bg-yellow-200 text-yellow-800 font-medium"
                            : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {s.user.name}
                      </span>
                    ))}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===================== HISTORY ===================== */
function HistoryGames({ games }: { games: PlayerGame[] }) {
  if (games.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500 text-sm">
        Brak historii
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="divide-y">
        {games.map((g) => {
          const st = statusLabels[g.status];
          const att = attendLabels[g.attended] || attendLabels.UNKNOWN;
          const perPlayer =
            g.mainListCount > 0
              ? Math.round(g.pricePerGame / g.mainListCount)
              : 0;

          return (
            <div key={g.gameId} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">
                    {formatDate(g.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {g.scheduleName} • {g.location}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${st?.color || "bg-gray-100"}`}
                >
                  {st?.label || g.status}
                </span>
              </div>
              {g.status === "COMPLETED" && (
                <div className="flex items-center gap-4 mt-1.5 text-xs">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== BALANCE ===================== */
function BalanceList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500 text-sm">
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
