-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('OPEN', 'LOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendStatus" AS ENUM ('UNKNOWN', 'PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'GAME_CHARGE', 'REFUND', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSchedule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "maxPlayers" INTEGER NOT NULL DEFAULT 14,
    "pricePerGame" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "pricePerGame" INTEGER NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSignup" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isReserve" BOOLEAN NOT NULL DEFAULT false,
    "attended" "AttendStatus" NOT NULL DEFAULT 'UNKNOWN',
    "charged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "PaymentType" NOT NULL,
    "description" TEXT,
    "gameId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GameSignup_gameId_userId_key" ON "GameSignup"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "GameSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSignup" ADD CONSTRAINT "GameSignup_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSignup" ADD CONSTRAINT "GameSignup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
