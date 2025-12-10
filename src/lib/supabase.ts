import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 延迟初始化的 Supabase 客户端，避免构建时因缺少环境变量而报错
let _supabaseAdmin: SupabaseClient | null = null;
let _supabase: SupabaseClient | null = null;

// Supabase 服务端客户端（带 service_role 密钥，可绕过 RLS）
// 仅在 API 路由中使用，不要在客户端使用
export const supabaseAdmin = {
  get storage() {
    if (!_supabaseAdmin) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error('Supabase environment variables are not configured');
      }
      _supabaseAdmin = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return _supabaseAdmin.storage;
  },
};

// Supabase 客户端（带 anon 密钥，受 RLS 保护）
// 可在客户端和服务端使用
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase environment variables are not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// 保留向后兼容的导出（延迟初始化）
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});
