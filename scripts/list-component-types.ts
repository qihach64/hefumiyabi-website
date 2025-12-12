import prisma from "../src/lib/prisma";

async function main() {
  const components = await prisma.serviceComponent.findMany({
    select: { type: true, name: true, icon: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const grouped: Record<string, { name: string; icon: string | null }[]> = {};
  for (const c of components) {
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push({ name: c.name, icon: c.icon });
  }

  for (const [type, items] of Object.entries(grouped)) {
    console.log(`\n=== ${type} (${items.length}项) ===`);
    items.forEach((i) => console.log(`  ${i.icon || "📍"} ${i.name}`));
  }

  await prisma.$disconnect();
}
main();
