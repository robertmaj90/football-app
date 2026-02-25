import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatuje grosze na PLN: 5025 → "50,25 zł" */
export function formatMoney(grosz: number): string {
  const zl = grosz / 100;
  return (
    zl.toLocaleString("pl-PL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " zł"
  );
}

/** Parsuje PLN string na grosze: "50.25" → 5025 */
export function parseMoneyToGrosze(value: string): number {
  const cleaned = value.replace(",", ".");
  return Math.round(parseFloat(cleaned) * 100);
}

const DAYS_PL = [
  "Niedziela",
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
];

export function dayOfWeekName(day: number): string {
  return DAYS_PL[day] || "?";
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Sprawdza czy użytkownik ma rolę ADMIN */
export function hasRole(roles: string[] | undefined, role: string): boolean {
  return Array.isArray(roles) && roles.includes(role);
}

export function isAdmin(session: any): boolean {
  return hasRole(session?.user?.roles, "ADMIN");
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
