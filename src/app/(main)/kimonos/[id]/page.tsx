import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { MapPin, ArrowLeft } from "lucide-react";
import FavoriteButton from "@/components/kimono/FavoriteButton";

export default async function KimonoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kimono = await prisma.kimono.findUnique({
    where: {
      id,
    },
    include: {
      images: {
        orderBy: {
          order: "asc",
        },
      },
      stores: {
        include: {
          store: true,
        },
      },
    },
  });

  if (!kimono) {
    notFound();
  }

  // 增加浏览次数
  await prisma.kimono.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });

  const categoryNames = {
    WOMEN: "女士和服",
    MEN: "男士和服",
    CHILDREN: "儿童和服",
  };

  const mainImage = kimono.images[0];

  return (
    <div className="container py-8">
      {/* 返回按钮 */}
      <Link
        href="/kimonos"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回和服图库
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 左侧：图片 */}
        <div>
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt || kimono.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                暂无图片
              </div>
            )}

            {/* 状态标签 */}
            {!kimono.isAvailable && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-md font-semibold">
                已租出
              </div>
            )}
          </div>

          {/* 缩略图（如果有多张图片） */}
          {kimono.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {kimono.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative aspect-square rounded overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer"
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${kimono.name} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：详情 */}
        <div>
          {/* 分类标签 */}
          <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary mb-4">
            {categoryNames[kimono.category]}
          </span>

          {/* 标题 */}
          <h1 className="text-3xl font-bold mb-2">{kimono.name}</h1>
          {kimono.nameEn && (
            <p className="text-lg text-muted-foreground mb-4">{kimono.nameEn}</p>
          )}

          {/* 状态 */}
          <div className="flex items-center gap-4 mb-6">
            {kimono.isAvailable ? (
              <span className="text-green-600 font-medium">✓ 可租赁</span>
            ) : (
              <span className="text-red-600 font-medium">✗ 已租出</span>
            )}
            <span className="text-sm text-muted-foreground">
              {kimono.viewCount} 次浏览
            </span>
          </div>

          {/* 描述 */}
          {kimono.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">描述</h3>
              <p className="text-muted-foreground leading-relaxed">
                {kimono.description}
              </p>
            </div>
          )}

          {/* 详细信息 */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">详细信息</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">编号</dt>
                  <dd className="font-medium">{kimono.code}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">风格</dt>
                  <dd className="font-medium">{kimono.style}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">尺寸</dt>
                  <dd className="font-medium">{kimono.size}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">适用季节</dt>
                  <dd className="font-medium">{kimono.season.join("、")}</dd>
                </div>
              </dl>
            </div>

            {/* 颜色 */}
            <div>
              <h4 className="font-semibold mb-2">颜色</h4>
              <div className="flex flex-wrap gap-2">
                {kimono.color.map((color) => (
                  <span
                    key={color}
                    className="px-3 py-1 text-sm rounded-full bg-secondary text-secondary-foreground"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>

            {/* 图案 */}
            {kimono.pattern.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">图案</h4>
                <div className="flex flex-wrap gap-2">
                  {kimono.pattern.map((pattern) => (
                    <span
                      key={pattern}
                      className="px-3 py-1 text-sm rounded-full bg-secondary text-secondary-foreground"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 可租赁店铺 */}
          {kimono.stores.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                可租赁店铺
              </h3>
              <div className="space-y-2">
                {kimono.stores.map((kimonoStore) => (
                  <Link
                    key={kimonoStore.id}
                    href={`/stores/${kimonoStore.store.slug}`}
                    className="block p-3 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
                  >
                    <p className="font-medium">{kimonoStore.store.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {kimonoStore.store.city} - 库存: {kimonoStore.quantity} 件
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Link
              href="/booking"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 text-center font-medium transition-colors"
            >
              立即预约
            </Link>
            <FavoriteButton
              kimonoId={kimono.id}
              className="border rounded-md px-4 py-3 hover:bg-accent transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
