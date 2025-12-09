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
} from './generator';
export type { GeneratorResult, TryOnRequestV3 } from './generator';
