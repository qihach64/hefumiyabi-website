import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Create a mock Prisma client for testing
export function createMockPrismaClient() {
  return {
    rentalPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    store: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    theme: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient;
}

// Helper to reset all mocks
export function resetPrismaMocks(mockPrisma: ReturnType<typeof createMockPrismaClient>) {
  vi.clearAllMocks();
}
