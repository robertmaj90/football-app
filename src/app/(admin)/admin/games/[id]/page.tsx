"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatDate, parseMoneyToGrosze } from "@/lib/utils";


interface Signup {
  id: string;
  position: number;
  isReserve: boolean;
  attended: "UNKNOWN" | "PRESENT" | "ABSENT";
  charged: boolean;
  user: { id: string; name: string; phone: string; balance: number };
}

interface Game {
  id: string;
  date: string;
  maxPlayers: number;
  pricePerGame: number;
  status: string;
  schedule: { name: string; location: string; time: string };
  signups: Signup[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Otwarte", color: "bg-green-100 text-green-700" },
  LOCKED: { label: "Zamknięte", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Rozliczone", color: "bg-blue-100 text-blue-700" },
  CANCELLED: { label: "Odwołane", color: "bg-red-100 text-red-700" },
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [players, setPlayers] = useState<
    { id: string; name: string; email: string; phone: string; isActive?: boolean }[]
  >([]);
  const [searchLeft, setSearchLeft] = useState("");
  const [searchRight, setSearchRight] = useState("");

  // Wpłata / Zwrot z poziomu grania
  const [depositPlayerId, setDepositPlayerId] = useState<string | null>(null);
  const [depositPlayerName, setDepositPlayerName] = useState("");
  const [depositPlayerBalance, setDepositPlayerBalance] = useState(0);
  const [depositType, setDepositType] = useState<"DEPOSIT" | "REFUND">("DEPOSIT");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDesc, setDepositDesc] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  async function loadGame() {
    const res = await fetch(`/api/games/${params.id}`);
    if (res.ok) {
      setGame(await res.json());
    }
    setLoading(false);
  }

  async function loadPlayers() {
    const res = await fetch("/api/players");
    if (res.ok) {
      setPlayers(await res.json());
    }
  }

  useEffect(() => {
    loadGame();
    loadPlayers();
  }, [params.id]);

  async function toggleAttendance(
    signupId: string,
    current: string,
    next: string
  ) {
    await fetch(`/api/games/${params.id}/attendance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signupId, attended: next }),
    });
    loadGame();
  }

  async function handleSettle() {
    if (!confirm("Czy na pewno chcesz rozliczyć to granie? Gracze oznaczeni jako OBECNI i NIEOBECNI zostaną obciążeni.")) return;

    setSettling(true);
    const res = await fetch(`/api/games/${params.id}/settle`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      alert(
        `Rozliczono ${data.charged} graczy po ${formatMoney(data.perPlayer)} (łącznie ${formatMoney(data.totalCost)})`
      );
    } else {
      alert(data.error);
    }
    setSettling(false);
    loadGame();
  }

  async function addPlayer(userId: string) {
    await fetch(`/api/games/${params.id}/signups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    loadGame();
  }

  async function removePlayer(userId: string) {
    await fetch(`/api/games/${params.id}/signups?userId=${userId}`, {
      method: "DELETE",
    });
    loadGame();
  }

  async function changeStatus(status: string) {
    await fetch(`/api/games/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadGame();
  }

  function startDeposit(userId: string, name: string, balance: number) {
    setDepositPlayerId(userId);
    setDepositPlayerName(name);
    setDepositPlayerBalance(balance);
    setDepositType("DEPOSIT");
    setDepositAmount("");
    setDepositDesc("");
  }

  function cancelDeposit() {
    setDepositPlayerId(null);
    setDepositAmount("");
    setDepositDesc("");
  }

  async function submitDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!depositPlayerId) return;
    setDepositSubmitting(true);
    const grosze = parseMoneyToGrosze(depositAmount);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: depositPlayerId,
        amount: depositType === "REFUND" ? -grosze : grosze,
        type: depositType,
        description:
          depositDesc || (depositType === "REFUND" ? "Zwrot" : "Wpłata"),
      }),
    });
    setDepositSubmitting(false);
    cancelDeposit();
    loadGame();
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Ładowanie...</div>;
  }

  if (!game) {
    return <div className="p-8 text-center text-red-500">Granie nie znalezione</div>;
  }

  const mainList = game.signups.filter((s) => !s.isReserve);
  const reserveList = game.signups.filter((s) => s.isReserve);
  const st = statusLabels[game.status] || {
    label: game.status,
    color: "bg-gray-100",
  };

  // Gracze niezapisani
  const signedUpIds = new Set(game.signups.map((s) => s.user.id));
  const availablePlayers = players.filter((p) => !signedUpIds.has(p.id) && p.isActive !== false);

  // Filtrowanie wyszukiwaniem
  const q = searchLeft.toLowerCase();
  const filteredAvailable = q
    ? availablePlayers.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      )
    : availablePlayers;

  const qr = searchRight.toLowerCase();
  const filteredSignups = qr
    ? game.signups.filter((s) => s.user.name.toLowerCase().includes(qr) || s.user.phone.includes(qr))
    : game.signups;

  const filteredMain = filteredSignups.filter((s) => !s.isReserve);
  const filteredReserve = filteredSignups.filter((s) => s.isReserve);

  const canEdit = game.status === "OPEN" || game.status === "LOCKED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/games" className="hover:text-green-700">
          Grania
        </Link>
        <span>/</span>
        <span>{formatDate(game.date)}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{formatDate(game.date)}</h1>
            <div className="text-sm text-gray-500 mt-1">
              {game.schedule.name} •{" "}
              {game.schedule.location} •{" "}
              {game.schedule.time}
            </div>
            <div className="text-sm text-gray-500">
              Koszt grania: {formatMoney(game.pricePerGame)} • Max:{" "}
              {game.maxPlayers} graczy
            </div>
            <div className="text-sm font-medium text-green-700 mt-1">
              💰 Per gracz: {formatMoney(
                mainList.length > 0
                  ? Math.round(game.pricePerGame / mainList.length)
                  : game.pricePerGame
              )}{" "}
              <span className="text-gray-400 font-normal">
                ({mainList.length > 0 ? mainList.length : "?"} graczy)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${st.color}`}
            >
              {st.label}
            </span>
            {game.status === "OPEN" && (
              <button
                onClick={() => changeStatus("LOCKED")}
                className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Zamknij zapisy
              </button>
            )}
            {game.status === "LOCKED" && (
              <>
                <button
                  onClick={() => changeStatus("OPEN")}
                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Otwórz zapisy
                </button>
                <button
                  onClick={handleSettle}
                  disabled={settling}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {settling ? "Rozliczanie..." : "💰 Rozlicz granie"}
                </button>
              </>
            )}
            {game.status === "OPEN" && (
              <button
                onClick={() => changeStatus("CANCELLED")}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Odwołaj
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal wpłaty / zwrotu */}
      {depositPlayerId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-1">
              {depositType === "REFUND" ? "↩️ Zwrot" : "💰 Wpłata"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {depositPlayerName} • bilans:{" "}
              <span
                className={
                  depositPlayerBalance < 0 ? "text-red-600" : "text-green-700"
                }
              >
                {formatMoney(depositPlayerBalance)}
              </span>
            </p>
            <form onSubmit={submitDeposit} className="space-y-3">
              {/* Przełącznik Wpłata / Zwrot */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDepositType("DEPOSIT")}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    depositType === "DEPOSIT"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  💰 Wpłata
                </button>
                <button
                  type="button"
                  onClick={() => setDepositType("REFUND")}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    depositType === "REFUND"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  ↩️ Zwrot
                </button>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Kwota (PLN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="np. 50.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Opis (opcjonalny)
                </label>
                <input
                  type="text"
                  placeholder={
                    depositType === "REFUND"
                      ? "np. Zwrot za odwołane granie"
                      : "np. Przelew, Gotówka"
                  }
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={depositSubmitting}
                  className={`flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                    depositType === "REFUND"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {depositSubmitting
                    ? "Zapisywanie..."
                    : depositType === "REFUND"
                    ? "Wykonaj zwrot"
                    : "Dodaj wpłatę"}
                </button>
                <button
                  type="button"
                  onClick={cancelDeposit}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dwie kolumny: dostępni ↔ zapisani */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEWA KOLUMNA — Dostępni gracze */}
        {canEdit && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">
                👥 Dostępni gracze ({availablePlayers.length})
              </h2>
            </div>
            <div className="px-3 py-2 border-b">
              <input
                type="text"
                placeholder="Szukaj gracza..."
                value={searchLeft}
                onChange={(e) => setSearchLeft(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="overflow-y-auto max-h-[28rem] divide-y">
              {filteredAvailable.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  {searchLeft
                    ? "Brak wyników"
                    : "Wszyscy gracze są już zapisani"}
                </div>
              ) : (
                filteredAvailable.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 group"
                  >
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.phone}</div>
                    </div>
                    <button
                      onClick={() => addPlayer(p.id)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      Dodaj →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PRAWA KOLUMNA — Zapisani */}
        <div
          className={`space-y-4 ${
            !canEdit ? "lg:col-span-2" : ""
          }`}
        >
          {/* Wyszukiwanie zapisanych */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-3 py-2 border-b">
              <input
                type="text"
                placeholder="Szukaj wśród zapisanych..."
                value={searchRight}
                onChange={(e) => setSearchRight(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Lista główna */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-5 py-3 border-b bg-green-50">
              <h2 className="font-semibold text-green-800">
                ⚽ Lista ({mainList.length}/{game.maxPlayers})
              </h2>
            </div>
            {filteredMain.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                {searchRight ? "Brak wyników" : "Brak zapisanych"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredMain.map((s) => (
                  <SignupRow
                    key={s.id}
                    signup={s}
                    gameStatus={game.status}
                    onToggleAttendance={toggleAttendance}
                    onRemove={removePlayer}
                    onDeposit={startDeposit}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Lista rezerwowa */}
          {(filteredReserve.length > 0 || reserveList.length > 0) && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-5 py-3 border-b bg-yellow-50">
                <h2 className="font-semibold text-yellow-800">
                  🔄 Rezerwowi ({reserveList.length})
                </h2>
              </div>
              {filteredReserve.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  Brak wyników
                </div>
              ) : (
                <div className="divide-y">
                  {filteredReserve.map((s) => (
                    <SignupRow
                      key={s.id}
                      signup={s}
                      gameStatus={game.status}
                      onToggleAttendance={toggleAttendance}
                      onRemove={removePlayer}
                      onDeposit={startDeposit}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignupRow({
  signup,
  gameStatus,
  onToggleAttendance,
  onRemove,
  onDeposit,
}: {
  signup: Signup;
  gameStatus: string;
  onToggleAttendance: (id: string, current: string, next: string) => void;
  onRemove: (userId: string) => void;
  onDeposit: (userId: string, name: string, balance: number) => void;
}) {
  const attendColors = {
    UNKNOWN: "bg-gray-100 text-gray-600",
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-700",
  };
  const attendLabels = {
    UNKNOWN: "❓",
    PRESENT: "✅ Był",
    ABSENT: "❌ Nie był",
  };
  const nextAttend: Record<string, string> = {
    UNKNOWN: "PRESENT",
    PRESENT: "ABSENT",
    ABSENT: "UNKNOWN",
  };

  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 w-6 text-right">
          {signup.position}.
        </span>
        <div>
          <div className="font-medium text-sm">{signup.user.name}</div>
          <div className="text-xs text-gray-500">{signup.user.phone}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-semibold ${
            signup.user.balance < 0 ? "text-red-600" : "text-green-700"
          }`}
        >
          {formatMoney(signup.user.balance)}
        </span>
        <button
          onClick={() =>
            onDeposit(signup.user.id, signup.user.name, signup.user.balance)
          }
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
          title="Wpłata"
        >
          💰
        </button>
        {signup.charged && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Rozliczony
          </span>
        )}
        {(gameStatus === "LOCKED" || gameStatus === "COMPLETED") && (
          <button
            onClick={() =>
              onToggleAttendance(
                signup.id,
                signup.attended,
                nextAttend[signup.attended]
              )
            }
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              attendColors[signup.attended]
            }`}
            disabled={gameStatus === "COMPLETED"}
          >
            {attendLabels[signup.attended]}
          </button>
        )}
        {(gameStatus === "OPEN" || gameStatus === "LOCKED") && (
          <button
            onClick={() => onRemove(signup.user.id)}
            className="text-xs text-red-400 hover:text-red-600"
            title="Wypisz"
          >
            ← Usuń
          </button>
        )}
      </div>
    </div>
  );
}
