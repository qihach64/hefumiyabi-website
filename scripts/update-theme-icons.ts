import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 图标映射：Lucide 名称 -> Emoji
  const iconMapping: Record<string, string> = {
    'Camera': '📸',
    'Crown': '👑',
    'Users': '👨‍👩‍👧‍👦',
    'Leaf': '🍂',
    'Footprints': '👣',
    'Sparkles': '✨'
  };

  // 更新每个主题的图标
  const themes = await prisma.theme.findMany({ where: { isActive: true } });

  for (const theme of themes) {
    if (theme.icon && iconMapping[theme.icon]) {
      const newIcon = iconMapping[theme.icon];
      await prisma.theme.update({
        where: { id: theme.id },
        data: { icon: newIcon }
      });
      console.log('Updated:', theme.name, theme.icon, '->', newIcon);
    }
  }

  // 验证更新结果
  const updated = await prisma.theme.findMany({
    where: { isActive: true },
    select: { name: true, icon: true },
    orderBy: { displayOrder: 'asc' }
  });
  console.log('\nFinal result:');
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
