import { PrismaClient } from "@prisma/client";
import { seasons, teams } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  for (const season of seasons) {
    await prisma.season.upsert({
      where: { id: season.id },
      update: season,
      create: season,
    });
  }

  for (const team of teams) {
    await prisma.team.upsert({
      where: { number: team.number },
      update: team,
      create: team,
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
