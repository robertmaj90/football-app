"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney, parseMoneyToGrosze } from "@/lib/utils";

interface Player {
  id: string;
  email: string;
  name: string;
  phone: string;
  balance: number;
  roles: string[];
  isActive: boolean;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [balanceFilter, setBalanceFilter] = useState<"all" | "negative" | "positive" | "zero">("all");

  // Edycja gracza
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    roles: [] as string[],
  });

  // Wpłata / Zwrot
  const [depositPlayerId, setDepositPlayerId] = useState<string | null>(null);
  const [depositType, setDepositType] = useState<"DEPOSIT" | "REFUND">("DEPOSIT");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDesc, setDepositDesc] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);

  async function loadPlayers() {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setForm({ email: "", name: "", phone: "", password: "" });
    setShowForm(false);
    loadPlayers();
  }

  function startEdit(p: Player) {
    setEditingId(p.id);
    setEditForm({
      name: p.name,
      email: p.email,
      phone: p.phone,
      roles: [...p.roles],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", email: "", phone: "", roles: [] });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    await fetch(`/api/players/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    cancelEdit();
    loadPlayers();
  }

  function toggleEditRole(role: string) {
    setEditForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  }

  async function toggleActive(p: Player) {
    await fetch(`/api/players/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    loadPlayers();
  }

  function startDeposit(playerId: string) {
    setDepositPlayerId(playerId);
    setDepositType("DEPOSIT");
    setDepositAmount("");
    setDepositDesc("");
  }

  function startRefund(playerId: string) {
    setDepositPlayerId(playerId);
    setDepositType("REFUND");
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
    loadPlayers();
  }

  const q = search.toLowerCase();
  const visiblePlayers = showInactive
    ? players
    : players.filter((p) => p.isActive);

  const balanceFiltered = visiblePlayers.filter((p) => {
    if (balanceFilter === "negative") return p.balance < 0;
    if (balanceFilter === "positive") return p.balance > 0;
    if (balanceFilter === "zero") return p.balance === 0;
    return true;
  });

  const filtered = q
    ? balanceFiltered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.includes(q)
      )
    : balanceFiltered;

  const inactiveCount = players.filter((p) => !p.isActive).length;
  const negativeCount = visiblePlayers.filter((p) => p.balance < 0).length;
  const positiveCount = visiblePlayers.filter((p) => p.balance > 0).length;
  const zeroCount = visiblePlayers.filter((p) => p.balance === 0).length;

  const balanceFilters = [
    { key: "all" as const, label: "Wszyscy", color: "bg-gray-700 text-white", count: visiblePlayers.length },
    { key: "negative" as const, label: "Ujemny bilans", color: "bg-red-100 text-red-700", count: negativeCount },
    { key: "positive" as const, label: "Dodatni bilans", color: "bg-green-100 text-green-700", count: positiveCount },
    { key: "zero" as const, label: "Zerowy bilans", color: "bg-gray-100 text-gray-600", count: zeroCount },
  ];
  const depositPlayer = players.find((p) => p.id === depositPlayerId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gracze</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            cancelEdit();
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          {showForm ? "Anuluj" : "+ Dodaj gracza"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Nowy gracz</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Imię i nazwisko"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="tel"
                placeholder="Nr telefonu"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="password"
                placeholder="Hasło"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Dodaj gracza
            </button>
          </form>
        </div>
      )}

      {/* Wyszukiwanie + filtr nieaktywnych */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Szukaj gracza..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
        />
        {inactiveCount > 0 && (
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-2.5 text-xs rounded-xl border shadow-sm font-medium whitespace-nowrap ${
              showInactive
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {showInactive
              ? `Ukryj nieaktywnych (${inactiveCount})`
              : `+ Nieaktywni (${inactiveCount})`}
          </button>
        )}
      </div>

      {/* Pastylki filtrów bilansu */}
      <div className="flex flex-wrap gap-2">
        {balanceFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setBalanceFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              balanceFilter === f.key
                ? `${f.color} border-current`
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Modal wpłaty / zwrotu */}
      {depositPlayerId && depositPlayer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-1">
              {depositType === "REFUND" ? "↩️ Zwrot" : "💰 Wpłata"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {depositPlayer.name} • bilans:{" "}
              <span
                className={
                  depositPlayer.balance < 0 ? "text-red-600" : "text-green-700"
                }
              >
                {formatMoney(depositPlayer.balance)}
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

      {/* Lista graczy */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Ładowanie...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? "Brak wyników" : "Brak graczy. Dodaj pierwszego gracza."}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((p) => (
              <div key={p.id}>
                {editingId === p.id ? (
                  /* Tryb edycji */
                  <form
                    onSubmit={saveEdit}
                    className="px-5 py-3 bg-yellow-50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="px-2.5 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Imię"
                        required
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="px-2.5 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Email"
                        required
                      />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="px-2.5 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Telefon"
                        required
                      />
                    </div>
                    {/* Role */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-gray-500">Role:</span>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes("PLAYER")}
                          onChange={() => toggleEditRole("PLAYER")}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        Gracz
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.roles.includes("ADMIN")}
                          onChange={() => toggleEditRole("ADMIN")}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        Admin
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                      >
                        Anuluj
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Tryb podglądu */
                  <div
                    className={`flex items-center justify-between px-5 py-3 group ${
                      !p.isActive ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/admin/players/${p.id}`}
                          className="font-medium text-green-700 hover:underline text-sm"
                        >
                          {p.name}
                        </Link>
                        <span
                          className={`text-sm font-semibold ${
                            p.balance < 0 ? "text-red-600" : "text-green-700"
                          }`}
                        >
                          {formatMoney(p.balance)}
                        </span>
                        {/* Badges ról */}
                        {p.roles.includes("ADMIN") && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                            Admin
                          </span>
                        )}
                        {!p.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full font-medium">
                            Nieaktywny
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.email} • {p.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startDeposit(p.id)}
                        className="px-2.5 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                      >
                        💰 Wpłata
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      >
                        Edytuj
                      </button>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium ${
                          p.isActive
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                        title={
                          p.isActive
                            ? "Dezaktywuj gracza"
                            : "Aktywuj gracza"
                        }
                      >
                        {p.isActive ? "Dezaktywuj" : "Aktywuj"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
