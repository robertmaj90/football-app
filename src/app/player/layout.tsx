import { PlayerNav } from "@/components/PlayerNav";

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <PlayerNav />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
