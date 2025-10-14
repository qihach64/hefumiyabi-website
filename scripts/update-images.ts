import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 真实的和服图片 URL（从 hefumiyabi.com 提取）
const realImages = [
  "https://cdn.sanity.io/images/u9jvdp7a/staging/cdff65bedb063563c91e3ff6fe56e2004faee1b0-1092x1472.png",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/d053820a53f8883cdc0debb7307375b260d383ab-1718x1714.png",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/5dd1195b6e98cb17cfaf210b018dc5d9582b574f-1066x1314.png",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/0b305683f4bf0ea23d82b744e4c177a9c9f1b149-2000x1333.jpg",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/1af5fd910acd7a630a48c3ebe2d9f6c78167721d-1078x1626.jpg",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/93ddbdf7804668f4a7c641b84adcb4bb8316c75e-960x642.jpg",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/d76eac82560dd08cb1394f8516bc74392af4ab01-1920x1461.jpg",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/cdff65bedb063563c91e3ff6fe56e2004faee1b0-1092x1472.png",
  "https://cdn.sanity.io/images/u9jvdp7a/staging/2c5c377c69c7d60f41b052db2fdcfc955ff32437-1260x1536.png",
];

async function updateImages() {
  console.log("🖼️  更新和服图片...\n");

  // 获取所有和服
  const kimonos = await prisma.kimono.findMany({
    include: {
      images: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`找到 ${kimonos.length} 套和服\n`);

  // 更新每套和服的图片
  for (let i = 0; i < kimonos.length; i++) {
    const kimono = kimonos[i];
    const imageUrl = realImages[i % realImages.length]; // 循环使用图片

    // 删除旧图片
    await prisma.kimonoImage.deleteMany({
      where: { kimonoId: kimono.id },
    });

    // 创建新图片
    await prisma.kimonoImage.create({
      data: {
        kimonoId: kimono.id,
        url: imageUrl,
        alt: kimono.name,
        order: 0,
      },
    });

    console.log(`✅ 更新 ${kimono.name} 的图片`);
  }

  console.log("\n🎉 图片更新完成！");
}

updateImages()
  .catch((e) => {
    console.error("❌ 更新失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
