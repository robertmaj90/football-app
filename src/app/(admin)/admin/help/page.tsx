"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Section = {
  id: string;
  title: string;
  icon: string;
  audience: "admin" | "player" | "both";
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: "overview",
    title: "Czym jest ta aplikacja?",
    icon: "📱",
    audience: "both",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Aplikacja do zarządzania graniami w piłkę nożną. Umożliwia organizowanie
          meczów, zarządzanie zapisami graczy oraz rozliczeniami finansowymi.
        </p>
        <p>
          Są dwa typy użytkowników: <strong>Admin</strong> (organizator) i{" "}
          <strong>Gracz</strong>. Admin może też być jednocześnie graczem.
        </p>
      </div>
    ),
  },
  {
    id: "schedules",
    title: "Harmonogramy",
    icon: "📋",
    audience: "admin",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          <strong>Harmonogram</strong> to szablon powtarzającego się grania.
          Określa dzień tygodnia, godzinę, lokalizację, maksymalną liczbę graczy
          i cenę za granie.
        </p>
        <p>Przykład: &quot;Wtorki 20:00, Orlik Mokotów, 14 graczy, 280 zł&quot;</p>
        <p>
          Harmonogram nie tworzy automatycznie grań — służy jako szablon.
          Kiedy tworzysz nowe granie i wybierzesz harmonogram, dane (lokalizacja,
          cena, max graczy) zostaną automatycznie uzupełnione.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Jak dodać harmonogram:</p>
          <p className="mt-1">
            Przejdź do zakładki <strong>Harmonogramy</strong> w menu → kliknij{" "}
            <strong>+ Nowy harmonogram</strong> → uzupełnij dane → zapisz.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "games",
    title: "Grania",
    icon: "⚽",
    audience: "admin",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          <strong>Granie</strong> to konkretny mecz z ustaloną datą. Tworzy się
          go na podstawie harmonogramu.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Jak stworzyć granie:</p>
          <p className="mt-1">
            Przejdź do zakładki <strong>Grania</strong> → kliknij{" "}
            <strong>+ Nowe granie</strong> → wybierz harmonogram (data
            zostanie podpowiedziana automatycznie) → kliknij{" "}
            <strong>Utwórz granie</strong>.
          </p>
        </div>
        <p className="font-medium">Statusy grania:</p>
        <ul className="space-y-1.5 ml-1">
          <li className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
              Otwarte
            </span>
            — gracze mogą się zapisywać i wypisywać
          </li>
          <li className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
              Zamknięte
            </span>
            — zapisy zamknięte, skład ustalony
          </li>
          <li className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              Rozliczone
            </span>
            — mecz się odbył, opłaty zostały naliczone
          </li>
          <li className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
              Odwołane
            </span>
            — mecz odwołany
          </li>
        </ul>
        <p>
          Na liście grań możesz filtrować po statusach używając <strong>pastylkowych przycisków</strong> na górze.
          Domyślnie widoczne są Otwarte i Zamknięte.
        </p>
      </div>
    ),
  },
  {
    id: "signups",
    title: "Zapisy na granie",
    icon: "✍️",
    audience: "both",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Kiedy granie ma status <strong>Otwarte</strong>, gracze mogą się
          zapisywać i wypisywać.
        </p>
        <p>
          Jeśli liczba zapisanych przekroczy limit (max graczy), nadmiarowi
          gracze trafiają na <strong>listę rezerwową</strong>. Gdy ktoś się
          wypisze, rezerwowy automatycznie awansuje.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-800">Jako gracz:</p>
          <p className="mt-1">
            W panelu gracza (Dashboard → Panel gracza) widzisz nadchodzące
            grania. Kliknij <strong>Zapisz się</strong> / <strong>Wypisz się</strong>.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Jako admin:</p>
          <p className="mt-1">
            Na stronie szczegółów grania możesz ręcznie dodawać i usuwać
            graczy z listy, zmieniać kolejność, oraz zarządzać rezerwą.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "players",
    title: "Zarządzanie graczami",
    icon: "👥",
    audience: "admin",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Dodawanie gracza:</p>
          <p className="mt-1">
            Zakładka <strong>Gracze</strong> → <strong>+ Dodaj gracza</strong> →
            podaj imię, email, telefon i hasło.
          </p>
        </div>
        <p className="font-medium">Zarządzanie:</p>
        <ul className="space-y-1 ml-1">
          <li>
            <strong>Edytuj</strong> — zmień dane, role (Gracz/Admin)
          </li>
          <li>
            <strong>Dezaktywuj</strong> — gracz nie będzie widoczny przy
            zapisach, ale dane zostają w systemie
          </li>
          <li>
            <strong>Wpłata / Zwrot</strong> — dodaj wpłatę lub wykonaj zwrot
          </li>
        </ul>
        <p>
          Użyj <strong>filtrów bilansu</strong> (pastylki) aby szybko znaleźć
          graczy z ujemnym lub dodatnim bilansem. Filtr{" "}
          <strong>Nieaktywni</strong> pokaże zdezaktywowanych graczy.
        </p>
      </div>
    ),
  },
  {
    id: "payments",
    title: "Finanse i rozliczenia",
    icon: "💰",
    audience: "admin",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Każdy gracz ma <strong>bilans</strong> (w PLN). Wpłaty zwiększają
          bilans, opłaty za grania go zmniejszają.
        </p>
        <p className="font-medium">Typy transakcji:</p>
        <ul className="space-y-1 ml-1">
          <li>
            <strong>💰 Wpłata</strong> — gracz wpłaca pieniądze (przelew,
            gotówka)
          </li>
          <li>
            <strong>⚽ Opłata za granie</strong> — automatycznie naliczana
            przy rozliczeniu meczu
          </li>
          <li>
            <strong>↩️ Zwrot</strong> — zwrot środków graczowi
          </li>
          <li>
            <strong>📝 Korekta</strong> — ręczna korekta bilansu
          </li>
        </ul>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Jak dodać wpłatę/zwrot:</p>
          <p className="mt-1">
            Na liście graczy kliknij <strong>💰 Wpłata</strong> przy danym
            graczu. W oknie wybierz zakładkę Wpłata lub Zwrot, podaj kwotę i
            opcjonalny opis.
          </p>
          <p className="mt-1">
            Wpłaty/zwroty można też dodawać z poziomu szczegółów grania —
            ikona 💰 przy każdym zapisanym graczu.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "settlement",
    title: "Rozliczanie meczu",
    icon: "📊",
    audience: "admin",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Po meczu admin rozlicza granie — zmienia status na{" "}
          <strong>Rozliczone</strong>. Koszt grania jest dzielony równo między
          obecnych graczy i automatycznie potrącany z ich bilansów.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-medium text-green-800">Jak rozliczyć:</p>
          <p className="mt-1">
            Otwórz szczegóły grania → oznacz kto był obecny → zmień status na{" "}
            <strong>Rozliczone</strong>. System automatycznie podzieli koszt i
            obciąży bilanse graczy.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "player-view",
    title: "Panel gracza",
    icon: "🏃",
    audience: "player",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>
          Jako gracz widzisz swój panel z trzema zakładkami:
        </p>
        <ul className="space-y-1 ml-1">
          <li>
            <strong>Grania</strong> — nadchodzące mecze, zapisz się / wypisz się
          </li>
          <li>
            <strong>Historia</strong> — przeszłe grania, czy byłeś obecny,
            ile zapłaciłeś
          </li>
          <li>
            <strong>Bilans</strong> — lista wszystkich transakcji (wpłaty,
            opłaty, zwroty)
          </li>
        </ul>
        <p>
          Na górze panelu widzisz swoje statystyki: aktualny bilans, liczbę
          rozegranych meczów, łączne wpłaty i wydatki.
        </p>
      </div>
    ),
  },
  {
    id: "roles",
    title: "Role w systemie",
    icon: "🔑",
    audience: "both",
    content: (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        <p>System ma dwie role:</p>
        <ul className="space-y-1 ml-1">
          <li>
            <strong>Gracz</strong> — może się zapisywać na grania, przeglądać
            swój bilans i historię
          </li>
          <li>
            <strong>Admin</strong> — zarządza harmonogramami, graniami, graczami
            i finansami
          </li>
        </ul>
        <p>
          Użytkownik może mieć obie role jednocześnie — wtedy na dashboardzie
          widzi przełącznik <strong>Panel admina / Panel gracza</strong>.
        </p>
      </div>
    ),
  },
];

export default function HelpPage() {
  const { data: session } = useSession();
  const [openSection, setOpenSection] = useState<string | null>("overview");
  const isAdmin = session?.user?.roles?.includes("ADMIN");
  const [filter, setFilter] = useState<"all" | "admin" | "player">("all");

  const filteredSections = sections.filter((s) => {
    if (filter === "all") return true;
    return s.audience === filter || s.audience === "both";
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pomoc</h1>
        <p className="text-sm text-gray-500 mt-1">
          Instrukcja obsługi aplikacji do zarządzania graniami
        </p>
      </div>

      {/* Filtry */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all" as const, label: "Wszystko", color: "bg-gray-700 text-white" },
          { key: "admin" as const, label: "Dla admina", color: "bg-green-100 text-green-700" },
          { key: "player" as const, label: "Dla gracza", color: "bg-blue-100 text-blue-700" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f.key
                ? `${f.color} border-current`
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        {filteredSections.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div
              key={section.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenSection(isOpen ? null : section.id)
                }
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium text-sm">{section.title}</span>
                  {section.audience === "admin" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                  {section.audience === "player" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                      Gracz
                    </span>
                  )}
                </div>
                <span
                  className={`text-gray-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t">{section.content}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
