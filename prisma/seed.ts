import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin + Gracz
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "michal_admin@football.pl" },
    update: {},
    create: {
      balance: 0,
      email: "michal_admin@football.pl",
      name: "Michał Admin",
      passwordHash: adminPassword,
      phone: "500000000",
      roles: [Role.ADMIN, Role.PLAYER],
    },
  });
  console.log("Created admin+player:", admin.email);

  // Gracze
  const playerPassword = await bcrypt.hash("player123", 12);
  const players = [
    { email: "jan@test.pl", name: "Jan Kowalski", phone: "501111111" },
    { email: "adam@test.pl", name: "Adam Nowak", phone: "502222222" },
    { email: "piotr@test.pl", name: "Piotr Wiśniewski", phone: "503333333" },
    { email: "marek@test.pl", name: "Marek Zieliński", phone: "504444444" },
    { email: "tomek@test.pl", name: "Tomasz Wójcik", phone: "505555555" },
  ];

  for (const p of players) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        ...p,
        passwordHash: playerPassword,
        roles: [Role.PLAYER],
        balance: 10000, // 100 PLN na start
      },
    });
    console.log("Created player:", user.email);
  }

  // Przykładowy harmonogram
  const schedule = await prisma.gameSchedule.create({
    data: {
      name: "Środowa piłka",
      dayOfWeek: 3, // Środa
      time: "20:00",
      location: "Orlik Mokotów, ul. Sportowa 5",
      maxPlayers: 14,
      pricePerGame: 35000, // 350 PLN za wynajem boiska
      isActive: true,
    },
  });
  console.log("Created schedule:", schedule.name);

  console.log("\n--- Seed complete ---");
  console.log("Admin+Player login: michal_admin@football.pl / admin123");
  console.log("Player login: jan@test.pl / player123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
