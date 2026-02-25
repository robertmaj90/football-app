import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 12);
  const noLoginPassword = await bcrypt.hash(crypto.randomUUID(), 12);

  // Michał Buko — Admin + Gracz
  const michal = await prisma.user.upsert({
    where: { email: "michal.buko@football.pl" },
    update: {},
    create: {
      email: "michal.buko@football.pl",
      name: "Michał Buko",
      phone: "500000001",
      passwordHash: adminPassword,
      roles: [Role.ADMIN, Role.PLAYER],
      balance: 0,
    },
  });
  console.log("Created admin+player:", michal.name);

  // Robert Maj — Admin + Gracz
  const robert = await prisma.user.upsert({
    where: { email: "robert.maj@football.pl" },
    update: {},
    create: {
      email: "robert.maj@football.pl",
      name: "Robert Maj",
      phone: "500000002",
      passwordHash: adminPassword,
      roles: [Role.ADMIN, Role.PLAYER],
      balance: 0,
    },
  });
  console.log("Created admin+player:", robert.name);

  // 20 graczy
  const players = [
    { name: "Jan Kowalski", phone: "501000001" },
    { name: "Adam Nowak", phone: "501000002" },
    { name: "Piotr Wiśniewski", phone: "501000003" },
    { name: "Marek Zieliński", phone: "501000004" },
    { name: "Tomasz Wójcik", phone: "501000005" },
    { name: "Krzysztof Kamiński", phone: "501000006" },
    { name: "Paweł Lewandowski", phone: "501000007" },
    { name: "Michał Szymański", phone: "501000008" },
    { name: "Jakub Woźniak", phone: "501000009" },
    { name: "Łukasz Dąbrowski", phone: "501000010" },
    { name: "Mateusz Kozłowski", phone: "501000011" },
    { name: "Damian Jankowski", phone: "501000012" },
    { name: "Kamil Mazur", phone: "501000013" },
    { name: "Bartosz Krawczyk", phone: "501000014" },
    { name: "Rafał Piotrowski", phone: "501000015" },
    { name: "Wojciech Grabowski", phone: "501000016" },
    { name: "Marcin Pawlak", phone: "501000017" },
    { name: "Dawid Michalski", phone: "501000018" },
    { name: "Sebastian Król", phone: "501000019" },
    { name: "Artur Wieczorek", phone: "501000020" },
  ];

  for (const p of players) {
    const email = p.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/\s+/g, ".")
      + "@football.pl";

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: p.name,
        phone: p.phone,
        passwordHash: noLoginPassword,
        roles: [Role.PLAYER],
        balance: 0,
      },
    });
    console.log("Created player:", user.name);
  }

  // Harmonogram — Wtorek 16:30
  const schedule = await prisma.gameSchedule.upsert({
    where: { id: "wtorkowa-pilka" },
    update: {},
    create: {
      id: "wtorkowa-pilka",
      name: "Wtorkowa piłka",
      dayOfWeek: 2,
      time: "16:30",
      location: "Księcia Bolesława 1/3, 01-452 Warszawa",
      maxPlayers: 12,
      pricePerGame: 60000,
      isActive: true,
    },
  });
  console.log("Created schedule:", schedule.name);

  console.log("\n--- Seed complete ---");
  console.log("Login: michal.buko@football.pl / admin1234");
  console.log("Login: robert.maj@football.pl / admin1234");
  console.log("20 graczy bez hasła (do zarządzania przez adminów)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
