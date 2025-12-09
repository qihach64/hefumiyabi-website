import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache key -> client mapping to support multiple configurations
const supabaseClients: Map<string, SupabaseClient> = new Map();

/**
 * Generate a cache key from configuration
 */
function getCacheKey(url: string, serviceKey: string): string {
  // Use URL + first 10 chars of key for caching (avoid storing full key)
  return `${url}:${serviceKey.substring(0, 10)}`;
}

/**
 * Initialize or get Supabase admin client
 * Supports multiple configurations by caching based on URL+key
 */
export function getSupabaseAdmin(url: string, serviceKey: string): SupabaseClient {
  const cacheKey = getCacheKey(url, serviceKey);

  let client = supabaseClients.get(cacheKey);
  if (!client) {
    client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    supabaseClients.set(cacheKey, client);
  }
  return client;
}

/**
 * Upload image to Supabase Storage
 * @param buffer Image buffer
 * @param path Storage path (e.g., "tryon/user123/1234567890.jpg")
 * @param contentType MIME type (e.g., "image/jpeg")
 * @param config Supabase configuration
 * @returns Public URL of the uploaded image
 */
export async function uploadToSupabase(
  buffer: Buffer,
  path: string,
  contentType: string = 'image/jpeg',
  config: {
    supabaseUrl: string;
    supabaseServiceKey: string;
    bucket?: string;
  }
): Promise<string> {
  const client = getSupabaseAdmin(config.supabaseUrl, config.supabaseServiceKey);
  const bucket = config.bucket || 'tryon-results';

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000', // 1 year cache
      upsert: false,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = client.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete image from Supabase Storage
 * @param path Storage path
 * @param config Supabase configuration
 */
export async function deleteFromSupabase(
  path: string,
  config: {
    supabaseUrl: string;
    supabaseServiceKey: string;
    bucket?: string;
  }
): Promise<void> {
  const client = getSupabaseAdmin(config.supabaseUrl, config.supabaseServiceKey);
  const bucket = config.bucket || 'tryon-results';

  const { error } = await client.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Generate storage path for uploaded image
 * @param userId User ID (or 'guest')
 * @param fileExtension File extension (e.g., 'jpg')
 * @returns Path string
 */
export function generateStoragePath(
  userId: string | null,
  fileExtension: string = 'jpg'
): string {
  const userDir = userId || 'guest';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${userDir}/${timestamp}-${random}.${fileExtension}`;
}
