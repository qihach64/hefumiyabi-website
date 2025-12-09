// Virtual Try-On Package
// AI-powered kimono virtual try-on module V2

// Types
export * from './types';
export * from './types/background';
export * from './types/kimono';

// API
export {
  // Single-round (legacy)
  generateTryOn,
  generateTryOnV2,
  createNextHandler,
  createNextHandlerV2,
  // Two-round
  generateTryOnTwoRound,
  createNextHandlerTwoRound,
  // V3 - Clean background mode (recommended)
  generateTryOnV3,
  createNextHandlerV3,
  // Error class
  TryOnGeneratorError
} from './api';
export type { GeneratorResult, TryOnRequestV3 } from './api';

// Components
export {
  VirtualTryOnApp,
  TryOnCanvas,
  KimonoSelector,
  PromptEditor,
  DebugPanel,
  BackgroundPoseSelector,
} from './components';

// Lib utilities - Prompts
export {
  // Single-round (legacy)
  DEFAULT_PROMPT,
  UNIFIED_TRYON_PROMPT,
  PRESERVE_USER_EXPRESSION_ADDON,
  // Two-round
  ROUND1_DRESS_PROMPT,
  ROUND2_MERGE_PROMPT,
  ROUND2_MERGE_KEEP_EXPRESSION_PROMPT,
  // V3 - Clean background mode (recommended)
  V3_CLEAN_BACKGROUND_PROMPT,
  V3_WITH_POSE_REFERENCE_PROMPT,
} from './lib/prompts';

// Lib utilities - Background Library
export {
  BACKGROUND_LIBRARY,
  BACKGROUND_BASE_PATH,
  CLEAN_BACKGROUND_BASE_PATH,
  getBackgroundLibrary,
  getBackgroundsByCategory,
  getBackgroundById,
  getBackgroundCounts,
  getRandomBackground,
  getCleanBackgroundUrl,
} from './lib/backgroundLibrary';

// Lib utilities - Kimono Library
export {
  KIMONO_LIBRARY,
  KIMONO_BASE_PATH,
  getKimonoLibrary,
  getKimonosByCategory,
  getKimonoById,
  getAllKimonos,
  getKimonoCounts,
  getRandomKimono,
} from './lib/kimonoLibrary';

// Lib utilities - Upload
export {
  uploadToSupabase,
  deleteFromSupabase,
  generateStoragePath,
  getSupabaseAdmin,
} from './lib/upload';

// Store
export { useTryOnStore } from './store/tryOn';
export { useUserPhotoStore } from './store/userPhoto';
