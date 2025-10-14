import prisma from "@/lib/prisma";
import KimonoGrid from "@/components/kimono/KimonoGrid";
import KimonoFilter from "@/components/kimono/KimonoFilter";
import { KimonoCategory, Season } from "@prisma/client";

interface SearchParams {
  category?: KimonoCategory;
  style?: string;
  color?: string;
  season?: Season;
  isAvailable?: string;
  page?: string;
}

export default async function KimonosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 12;

  // 构建查询条件
  const where: any = {};

  if (params.category) {
    where.category = params.category;
  }

  if (params.style) {
    where.style = {
      contains: params.style,
    };
  }

  if (params.color) {
    where.color = {
      has: params.color,
    };
  }

  if (params.season) {
    where.season = {
      has: params.season,
    };
  }

  if (params.isAvailable === "true") {
    where.isAvailable = true;
  }

  // 获取和服列表
  const [kimonos, total] = await Promise.all([
    prisma.kimono.findMany({
      where,
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.kimono.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">和服图库</h1>
        <p className="text-muted-foreground">
          精选 {total} 套精美和服，总有一款适合您
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* 左侧筛选 */}
        <aside className="lg:col-span-1">
          <div className="sticky top-4">
            <KimonoFilter />
          </div>
        </aside>

        {/* 右侧内容 */}
        <div className="lg:col-span-3">
          {/* 结果统计 */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              显示 {Math.min((page - 1) * pageSize + 1, total)} - {Math.min(page * pageSize, total)} 条，共 {total} 条结果
            </p>

            {/* 排序（可选） */}
            {/* <select className="text-sm border rounded px-3 py-1">
              <option>最新</option>
              <option>最热门</option>
            </select> */}
          </div>

          {/* 和服网格 */}
          <KimonoGrid kimonos={kimonos} />

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/kimonos?page=${page - 1}`}
                  className="px-4 py-2 border rounded hover:bg-accent"
                >
                  上一页
                </a>
              )}

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <a
                    key={pageNum}
                    href={`/kimonos?page=${pageNum}`}
                    className={`px-4 py-2 border rounded hover:bg-accent ${
                      page === pageNum ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {pageNum}
                  </a>
                );
              })}

              {page < totalPages && (
                <a
                  href={`/kimonos?page=${page + 1}`}
                  className="px-4 py-2 border rounded hover:bg-accent"
                >
                  下一页
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
