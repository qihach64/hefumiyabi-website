import {
  Camera,
  Crown,
  Users,
  Leaf,
  Footprints,
  Sparkles,
  Heart,
  Gift,
  Star,
  Image,
  Calendar,
  MapPin,
  Palette,
  Flower,
  Gem,
  Zap,
  Award,
  LucideIcon,
} from "lucide-react";

// Lucide icon name to component mapping
export const iconMap: Record<string, LucideIcon> = {
  Camera,
  Crown,
  Users,
  Leaf,
  Footprints,
  Sparkles,
  Heart,
  Gift,
  Star,
  Image,
  Calendar,
  MapPin,
  Palette,
  Flower,
  Gem,
  Zap,
  Award,
  // 常用别名映射
  Photo: Camera,
  Picture: Image,
  Love: Heart,
  Present: Gift,
  Lightning: Zap,
  Trophy: Award,
  Diamond: Gem,
};

// Emoji to Lucide icon mapping
export const emojiToIconMap: Record<string, LucideIcon> = {
  '📷': Camera,
  '📸': Camera,
  '👑': Crown,
  '👥': Users,
  '👫': Users,
  '🍂': Leaf,
  '🌸': Flower,
  '✨': Gem,           // 特色定制 - 用 Gem 代替 Sparkles 以区分"全部"
  '💎': Gem,
  '⚡': Zap,
  '🏆': Award,
  '🎁': Gift,
  '❤️': Heart,
  '⭐': Star,
  '🎨': Palette,
  '👣': Footprints,
  '🚶': Footprints,
  '👨‍👩‍👧‍👦': Heart,    // 亲友同行 - 用 Heart 代表亲情/陪伴
};

/**
 * Get the Lucide icon component for a theme icon string
 * @param icon - The icon string (can be a Lucide icon name or emoji)
 * @returns The Lucide icon component, or Sparkles as default
 */
export function getThemeIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) return Sparkles;

  // If it's a Lucide icon name
  if (iconMap[icon]) {
    return iconMap[icon];
  }

  // If it's an emoji
  if (emojiToIconMap[icon]) {
    return emojiToIconMap[icon];
  }

  // Check if it's an emoji using Unicode range detection
  const isEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon);
  if (isEmoji) {
    return Sparkles; // Default for unknown emojis
  }

  // Default fallback
  return Sparkles;
}

/**
 * Check if the given string is a known Lucide icon name
 */
export function isLucideIconName(icon: string | null | undefined): boolean {
  if (!icon) return false;
  return !!iconMap[icon];
}

/**
 * Check if the given string is an emoji
 */
export function isEmoji(icon: string | null | undefined): boolean {
  if (!icon) return false;
  return /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon);
}
