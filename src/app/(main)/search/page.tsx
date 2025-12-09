import { redirect } from 'next/navigation';

// /search 已迁移到 /plans，此页面仅用于向后兼容重定向
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  // 将所有查询参数转发到 /plans
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedParams)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    }
  }

  const queryString = params.toString();
  const redirectUrl = queryString ? `/plans?${queryString}` : '/plans';

  redirect(redirectUrl);
}
