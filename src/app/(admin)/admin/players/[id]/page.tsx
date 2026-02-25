"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatDateTime, parseMoneyToGrosze } from "@/lib/utils";

interface Player {
  id: string;
  email: string;
  name: string;
  phone: string;
  balance: number;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDesc, setDepositDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    const [pRes, payRes] = await Promise.all([
      fetch(`/api/players/${params.id}`),
      fetch(`/api/players/${params.id}/payments`),
    ]);
    if (pRes.ok) {
      setPlayer(await pRes.json());
    }
    if (payRes.ok) {
      setPayments(await payRes.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const amountGrosze = parseMoneyToGrosze(depositAmount);

    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: params.id,
        amount: amountGrosze,
        type: "DEPOSIT",
        description: depositDesc || "Wpłata",
      }),
    });

    setDepositAmount("");
    setDepositDesc("");
    setSubmitting(false);
    loadData();
  }

  const typeLabels: Record<string, string> = {
    DEPOSIT: "💰 Wpłata",
    GAME_CHARGE: "⚽ Opłata za gierkę",
    REFUND: "↩️ Zwrot",
    ADJUSTMENT: "📝 Korekta",
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Ładowanie...</div>;
  }

  if (!player) {
    return <div className="p-8 text-center text-red-500">Gracz nie znaleziony</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/players" className="hover:text-green-700">
          Gracze
        </Link>
        <span>/</span>
        <span>{player.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info gracza */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold text-lg mb-3">{player.name}</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Email:</span> {player.email}
            </div>
            <div>
              <span className="text-gray-500">Telefon:</span> {player.phone}
            </div>
            <div className="pt-3 border-t mt-3">
              <span className="text-gray-500">Bilans:</span>
              <span
                className={`text-2xl font-bold ml-2 ${
                  player.balance < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {formatMoney(player.balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Dodaj wpłatę */}
        <div className="bg-white rounded-xl shadow-sm border p-5 lg:col-span-2">
          <h2 className="font-semibold mb-3">Dodaj wpłatę</h2>
          <form onSubmit={handleDeposit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Opis (opcjonalny)
                </label>
                <input
                  type="text"
                  placeholder="np. Wpłata gotówką"
                  value={depositDesc}
                  onChange={(e) => setDepositDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Dodawanie..." : "Dodaj wpłatę"}
            </button>
          </form>
        </div>
      </div>

      {/* Historia płatności */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h2 className="font-semibold">Historia transakcji</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Brak transakcji
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
