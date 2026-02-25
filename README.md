# Piłka Nożna - Zapisy na grę ⚽

Aplikacja do zarządzania zapisami na cykliczne granie w piłkę nożną.

## Setup

### 1. Zainstaluj zależności
```bash
npm install
```

### 2. Uruchom PostgreSQL
```bash
docker compose up -d
```
Baza ruszy na porcie **5487**.

### 3. Skonfiguruj .env
```bash
cp .env.example .env
# Domyślnie ustawione na port 5487 — gotowe do użycia
```

### 4. Migracja bazy i seed
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Uruchom
```bash
npm run dev
```

Otwórz http://localhost:3000

## Konta testowe

| Role          | Email                       | Hasło      |
|---------------|-----------------------------|------------|
| Admin + Gracz | michal_admin@football.pl    | admin123   |
| Gracz         | jan@test.pl                 | player123  |

## Funkcjonalności

### Panel Admina
- Dashboard z podsumowaniem
- Zarządzanie graczami (dodawanie, bilans, wpłaty)
- Harmonogramy cykliczne
- Grania - tworzenie, zapisy, obecność, rozliczenia

### Panel Gracza
- Bilans konta
- Zapisywanie się na grania
- Historia transakcji

### Flow rozliczenia
1. Admin tworzy granie z harmonogramu
2. Gracze się zapisują (lista główna + rezerwowi)
3. Admin zamyka zapisy
4. Admin zaznacza obecność (był / nie był)
5. Admin rozlicza → system pobiera opłatę z bilansu

## Stack
- Next.js 14 (App Router)
- PostgreSQL + Prisma
- NextAuth.js (Credentials)
- Tailwind CSS
# football-app
