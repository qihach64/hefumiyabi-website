import { redirect } from 'next/navigation';

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Next.js 15 要求 await searchParams
  const resolvedParams = await searchParams;

  // 将所有查询参数转发到主页
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
  const redirectUrl = queryString ? `/?${queryString}` : '/';

  redirect(redirectUrl);
}
