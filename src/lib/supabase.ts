import { createClient } from '@supabase/supabase-js';

// Supabase 服务端客户端（带 service_role 密钥，可绕过 RLS）
// 仅在 API 路由中使用，不要在客户端使用
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Supabase 客户端（带 anon 密钥，受 RLS 保护）
// 可在客户端和服务端使用
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
