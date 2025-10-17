import { PrismaClient, SocialPlatform } from '@prisma/client';

const prisma = new PrismaClient();

// 示例社交媒体帖子数据
const samplePosts = [
  {
    platform: SocialPlatform.INSTAGRAM,
    postId: 'ig_sample_001',
    postUrl: 'https://www.instagram.com/kimonomiyabi/',
    content: '今天的和服体验太棒了！浅草的秋天真美 🍂 感谢江户和装工房雅的专业服务，让我们度过了难忘的一天。',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fae93ec3d5c6338e35e2a511165993cab7582afde-1340x1710.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: '小美的东京之旅',
    authorAvatar: null,
    likes: 324,
    comments: 28,
    shares: 12,
    postedAt: new Date('2024-11-15T10:30:00Z'),
    isFeatured: true,
    displayOrder: 1,
  },
  {
    platform: SocialPlatform.INSTAGRAM,
    postId: 'ig_sample_002',
    postUrl: 'https://www.instagram.com/kimonomiyabi/',
    content: '振袖真的太美了！第一次穿这么正式的和服，感觉自己像公主一样 👘✨',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F76902bff15f5be0c2a31fc77bd08d3e51ee0fbcb-820x1292.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: 'Yuki_Tokyo',
    authorAvatar: null,
    likes: 567,
    comments: 45,
    shares: 23,
    postedAt: new Date('2024-11-14T14:20:00Z'),
    isFeatured: true,
    displayOrder: 2,
  },
  {
    platform: SocialPlatform.FACEBOOK,
    postId: 'fb_sample_001',
    postUrl: 'https://www.facebook.com/kimonomiyabi77/',
    content: '和朋友一起来京都清水寺穿和服，工作人员很专业，帮我们选了最适合的款式。拍照效果超棒！',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fd23ed1e8913acfba76528621ed8f3fa0b7a0dc0f-1334x1628.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: '京都旅游攻略',
    authorAvatar: null,
    likes: 892,
    comments: 67,
    shares: 45,
    postedAt: new Date('2024-11-13T16:45:00Z'),
    isFeatured: true,
    displayOrder: 3,
  },
  {
    platform: SocialPlatform.WEIBO,
    postId: 'wb_sample_001',
    postUrl: 'https://www.weibo.com/mymiyabi',
    content: '姐妹们！强烈推荐这家和服店！价格实惠，款式多，服务好。我们选的情侣套餐，拍了好多美照 📸',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F392ef8ae7e6c97b6ce5c2efb25a059fd21d97a2c-1214x1634.png%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: '日本旅行小助手',
    authorAvatar: null,
    likes: 1234,
    comments: 98,
    shares: 67,
    postedAt: new Date('2024-11-12T09:15:00Z'),
    isFeatured: true,
    displayOrder: 4,
  },
  {
    platform: SocialPlatform.INSTAGRAM,
    postId: 'ig_sample_003',
    postUrl: 'https://www.instagram.com/kimonomiyabi/',
    content: '蕾丝和服真的太独特了！和传统和服不一样的感觉，拍照超美 💕',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2F42916d1b177ca5754edc6ed2ed24d748b3e7f04f-600x400.jpg%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: 'travel_with_momo',
    authorAvatar: null,
    likes: 445,
    comments: 32,
    shares: 18,
    postedAt: new Date('2024-11-11T11:30:00Z'),
    isFeatured: true,
    displayOrder: 5,
  },
  {
    platform: SocialPlatform.FACEBOOK,
    postId: 'fb_sample_002',
    postUrl: 'https://www.facebook.com/kimonomiyabi77/',
    content: '带妈妈一起穿和服，她说这是最难忘的生日礼物 ❤️ 工房雅的服务真的很贴心！',
    images: [
      'https://hefumiyabi.com/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fu9jvdp7a%2Fstaging%2Fa0c450b07e897b55982345da50b36c28af0f6f0e-600x400.jpg%3Ffm%3Dwebp%26fit%3Dcrop&w=3840&q=100',
    ],
    authorName: 'Sarah Chen',
    authorAvatar: null,
    likes: 678,
    comments: 54,
    shares: 29,
    postedAt: new Date('2024-11-10T15:00:00Z'),
    isFeatured: true,
    displayOrder: 6,
  },
];

async function seedSocialPosts() {
  console.log('🚀 开始添加社交媒体帖子...\n');

  try {
    // 清除现有的示例数据
    const deleted = await prisma.socialPost.deleteMany({
      where: {
        postId: {
          in: samplePosts.map(p => p.postId),
        },
      },
    });
    console.log(`🗑️  清除了 ${deleted.count} 个旧的示例帖子\n`);

    // 添加新的示例帖子
    let created = 0;
    for (const post of samplePosts) {
      await prisma.socialPost.create({
        data: post,
      });
      console.log(`✅ 创建帖子: ${post.platform} - ${post.authorName}`);
      created++;
    }

    console.log(`\n🎉 成功添加 ${created} 个社交媒体帖子！`);

    // 统计信息
    const stats = await prisma.socialPost.groupBy({
      by: ['platform'],
      _count: true,
    });

    console.log('\n📊 按平台统计:');
    stats.forEach(stat => {
      console.log(`   - ${stat.platform}: ${stat._count} 个帖子`);
    });

    const featured = await prisma.socialPost.count({
      where: { isFeatured: true },
    });
    console.log(`\n⭐ 首页展示的帖子: ${featured} 个`);

  } catch (error) {
    console.error('❌ 添加失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子脚本
seedSocialPosts()
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
