import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ 数据库连接成功!\n");

    const themes = await prisma.theme.findMany({ orderBy: { displayOrder: "asc" } });
    console.log(`=== Themes (${themes.length}) ===`);
    themes.forEach((t) =>
      console.log(`- ${t.name} | slug: ${t.slug} | icon: ${t.icon || "N/A"} | color: ${t.color || "N/A"}`)
    );

    const plansByTheme = await prisma.rentalPlan.groupBy({
      by: ["themeId"],
      _count: { id: true },
    });
    console.log("\n=== Plans by themeId ===");
    for (const item of plansByTheme) {
      const themeName = item.themeId
        ? themes.find((t) => t.id === item.themeId)?.name || item.themeId
        : "(no theme)";
      console.log(`- ${themeName}: ${item._count.id} plans`);
    }
  } catch (e: any) {
    console.log("❌ 错误:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
