import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.rentalPlan.findMany({
    where: { themeId: { not: null } },
    include: { theme: true },
    orderBy: [{ theme: { displayOrder: "asc" } }, { price: "asc" }],
  });

  console.log(`=== 有 Theme 的套餐 (${plans.length}) ===\n`);

  let currentTheme = "";
  for (const p of plans) {
    if (p.theme!.name !== currentTheme) {
      currentTheme = p.theme!.name;
      console.log(`\n【${currentTheme}】(${p.theme!.icon}) - ${p.theme!.color}`);
    }
    const priceYen = p.price / 100;
    console.log(`  - ${p.name} | ¥${priceYen} | ${p.category} | ${p.duration}h`);
  }

  await prisma.$disconnect();
}

main();
