import { createNextHandlerV3 } from '@kimono-one/virtual-tryon';

// Create V3 handler with 4-image mode support
// V3 mode: Face + Kimono + Pose Reference (original) + Clean Background
// This provides precise pose replication with pre-processed backgrounds
const handler = createNextHandlerV3({
  googleApiKey: process.env.GOOGLE_AI_API_KEY!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: 'tryon-results',
});

export const POST = handler;
