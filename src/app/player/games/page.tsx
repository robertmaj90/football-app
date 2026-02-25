"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";

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

export default function MyGamesPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [player, setPlayer] = useState<PlayerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    if (!session?.user?.id) return;
    const [payRes, pRes] = await Promise.all([
      fetch(`/api/players/${session.user.id}/payments`),
      fetch(`/api/players/${session.user.id}`),
    ]);
    if (payRes.ok) setPayments(await payRes.json());
    if (pRes.ok) setPlayer(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  const typeLabels: Record<string, string> = {
    DEPOSIT: "💰 Wpłata",
    GAME_CHARGE: "⚽ Opłata za granie",
    REFUND: "↩️ Zwrot",
    ADJUSTMENT: "📝 Korekta",
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Bilans */}
      {player && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Twój bilans</div>
              <div
                className={`text-2xl font-bold ${
                  player.balance < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {formatMoney(player.balance)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historia */}
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
