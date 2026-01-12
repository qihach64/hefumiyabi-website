# Architecture Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor hefumiyabi-website from monolithic components to Feature-Sliced Design with tRPC backend.

**Architecture:** Create `features/`, `server/`, `shared/` directories. Migrate state from Context to nuqs/Zustand. Add tRPC for type-safe API. Clean up deprecated database models.

**Tech Stack:** Next.js 15, tRPC, nuqs, Zustand, Prisma, React Hook Form + Zod

**Design Doc:** `docs/plans/2026-01-10-architecture-refactor.md`

---

## Week 1: Foundation

### Task 1.1: Create Backup Branch

**Files:**
- N/A (git operations only)

**Step 1: Create backup branch**

```bash
git checkout main
git pull origin main
git checkout -b backup/pre-refactor-2026-01-11
git push origin backup/pre-refactor-2026-01-11
```

**Step 2: Create refactor branch**

```bash
git checkout main
git checkout -b refactor/architecture
```

**Step 3: Commit**

No commit needed - branch creation only.

---

### Task 1.2: Create Directory Structure

**Files:**
- Create: `src/features/.gitkeep`
- Create: `src/features/guest/.gitkeep`
- Create: `src/features/merchant/.gitkeep`
- Create: `src/features/platform/.gitkeep`
- Create: `src/server/.gitkeep`
- Create: `src/server/trpc/.gitkeep`
- Create: `src/server/services/.gitkeep`
- Create: `src/shared/.gitkeep`
- Create: `src/shared/ui/.gitkeep`
- Create: `src/shared/components/.gitkeep`
- Create: `src/shared/hooks/.gitkeep`
- Create: `src/shared/lib/.gitkeep`
- Create: `src/shared/api/.gitkeep`
- Create: `src/config/.gitkeep`

**Step 1: Create all directories with .gitkeep files**

```bash
mkdir -p src/features/guest src/features/merchant src/features/platform
mkdir -p src/server/trpc src/server/services
mkdir -p src/shared/ui src/shared/components src/shared/hooks src/shared/lib src/shared/api
mkdir -p src/config

touch src/features/.gitkeep
touch src/features/guest/.gitkeep
touch src/features/merchant/.gitkeep
touch src/features/platform/.gitkeep
touch src/server/.gitkeep
touch src/server/trpc/.gitkeep
touch src/server/services/.gitkeep
touch src/shared/.gitkeep
touch src/shared/ui/.gitkeep
touch src/shared/components/.gitkeep
touch src/shared/hooks/.gitkeep
touch src/shared/lib/.gitkeep
touch src/shared/api/.gitkeep
touch src/config/.gitkeep
```

**Step 2: Verify structure**

```bash
find src/features src/server src/shared src/config -type d
```

Expected: All directories listed.

**Step 3: Commit**

```bash
git add .
git commit -m "refactor(1.2): create FSD directory structure

- Add features/ for guest/merchant/platform modules
- Add server/ for tRPC and services
- Add shared/ for cross-feature code
- Add config/ for constants"
```

---

### Task 1.3: Install tRPC Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install tRPC packages**

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next superjson
```

**Step 2: Verify installation**

```bash
pnpm list @trpc/server
```

Expected: Shows @trpc/server version.

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add tRPC packages"
```

---

### Task 1.4: Create tRPC Server Setup

**Files:**
- Create: `src/server/trpc/trpc.ts`
- Create: `src/server/trpc/context.ts`

**Step 1: Create tRPC context**

```typescript
// src/server/trpc/context.ts
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function createContext() {
  const session = await auth();

  return {
    prisma,
    session,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

**Step 2: Create tRPC instance**

```typescript
// src/server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const merchantProcedure = protectedProcedure.use(({ ctx, next }) => {
  // TODO: Check merchant role
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // TODO: Check admin role
  return next({ ctx });
});
```

**Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: No errors in new files.

**Step 4: Commit**

```bash
git add src/server/trpc/
git commit -m "feat(trpc): add tRPC server setup with context and procedures"
```

---

### Task 1.5: Create tRPC Root Router

**Files:**
- Create: `src/server/trpc/routers/index.ts`
- Create: `src/server/trpc/routers/health.ts`

**Step 1: Create health router (for testing)**

```typescript
// src/server/trpc/routers/health.ts
import { router, publicProcedure } from '../trpc';

export const healthRouter = router({
  check: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
});
```

**Step 2: Create root router**

```typescript
// src/server/trpc/routers/index.ts
import { router } from '../trpc';
import { healthRouter } from './health';

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
```

**Step 3: Commit**

```bash
git add src/server/trpc/routers/
git commit -m "feat(trpc): add root router with health check endpoint"
```

---

### Task 1.6: Create tRPC API Route

**Files:**
- Create: `src/app/api/trpc/[trpc]/route.ts`

**Step 1: Create Next.js API handler**

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers';
import { createContext } from '@/server/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

export { handler as GET, handler as POST };
```

**Step 2: Test the endpoint**

```bash
pnpm dev &
sleep 5
curl http://localhost:3000/api/trpc/health.check
```

Expected: `{"result":{"data":{"status":"ok","timestamp":"..."}}}`

**Step 3: Commit**

```bash
git add src/app/api/trpc/
git commit -m "feat(trpc): add API route handler"
```

---

### Task 1.7: Create tRPC Client

**Files:**
- Create: `src/shared/api/trpc.ts`
- Create: `src/shared/api/TRPCProvider.tsx`

**Step 1: Create tRPC client**

```typescript
// src/shared/api/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc/routers';

export const trpc = createTRPCReact<AppRouter>();
```

**Step 2: Create tRPC provider**

```typescript
// src/shared/api/TRPCProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from './trpc';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Step 3: Commit**

```bash
git add src/shared/api/
git commit -m "feat(trpc): add React client and provider"
```

---

### Task 1.8: Integrate tRPC Provider into App

**Files:**
- Modify: `src/app/layout.tsx` or `src/app/(main)/layout.tsx`

**Step 1: Find the root layout**

```bash
head -30 src/app/layout.tsx
```

**Step 2: Add TRPCProvider to layout**

Wrap children with `<TRPCProvider>`:

```typescript
import { TRPCProvider } from '@/shared/api/TRPCProvider';

// In the layout component:
<TRPCProvider>
  {children}
</TRPCProvider>
```

**Step 3: Test tRPC works from a client component**

Create a temporary test:

```typescript
// src/app/(main)/page.tsx - add temporarily
'use client';
import { trpc } from '@/shared/api/trpc';

// Inside component:
const { data } = trpc.health.check.useQuery();
console.log('tRPC health:', data);
```

**Step 4: Verify in browser console**

Expected: `tRPC health: { status: 'ok', timestamp: '...' }`

**Step 5: Remove test code and commit**

```bash
git add src/app/
git commit -m "feat(trpc): integrate provider into app layout"
```

---

### Task 1.9: Install nuqs for URL State

**Files:**
- Modify: `package.json`

**Step 1: Install nuqs**

```bash
pnpm add nuqs
```

**Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add nuqs for URL state management"
```

---

### Task 1.10: Create useSearchState Hook (nuqs)

**Files:**
- Create: `src/shared/hooks/useSearchState.ts`
- Test: Manual browser testing

**Step 1: Create the hook**

```typescript
// src/shared/hooks/useSearchState.ts
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

export function useSearchState() {
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [date, setDate] = useQueryState('date', parseAsString);
  const [theme, setTheme] = useQueryState('theme', parseAsString);
  const [guests, setGuests] = useQueryState('guests', parseAsInteger.withDefault(1));

  const clearAll = () => {
    setLocation(null);
    setDate(null);
    setTheme(null);
    setGuests(null);
  };

  return {
    // Values
    location,
    date,
    theme,
    guests,
    // Setters
    setLocation,
    setDate,
    setTheme,
    setGuests,
    // Utilities
    clearAll,
    hasFilters: !!(location || date || theme),
  };
}
```

**Step 2: Create index export**

```typescript
// src/shared/hooks/index.ts
export { useSearchState } from './useSearchState';
```

**Step 3: Commit**

```bash
git add src/shared/hooks/
git commit -m "feat(state): add useSearchState hook with nuqs"
```

---

### Task 1.11: Configure nuqs Provider

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Add NuqsAdapter**

```typescript
import { NuqsAdapter } from 'nuqs/adapters/next/app';

// Wrap in layout:
<NuqsAdapter>
  <TRPCProvider>
    {children}
  </TRPCProvider>
</NuqsAdapter>
```

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(state): configure nuqs adapter in layout"
```

---

### Task 1.12: Create Plan Service

**Files:**
- Create: `src/server/services/plan.service.ts`

**Step 1: Create plan service with basic methods**

```typescript
// src/server/services/plan.service.ts
import prisma from '@/lib/prisma';

export interface PlanListParams {
  theme?: string;
  storeId?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

export const planService = {
  async getList(params: PlanListParams) {
    const { theme, storeId, location, limit = 20, offset = 0 } = params;

    const where: any = {
      isActive: true,
    };

    if (theme) {
      where.theme = { slug: theme };
    }

    if (storeId) {
      where.planStores = { some: { storeId } };
    }

    if (location) {
      where.planStores = {
        some: {
          store: {
            OR: [
              { city: { contains: location, mode: 'insensitive' } },
              { name: { contains: location, mode: 'insensitive' } },
            ],
          },
        },
      };
    }

    const [plans, total] = await Promise.all([
      prisma.rentalPlan.findMany({
        where,
        include: {
          theme: true,
          planStores: { include: { store: true } },
          planTags: { include: { tag: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { priority: 'desc' }],
        take: limit,
        skip: offset,
      }),
      prisma.rentalPlan.count({ where }),
    ]);

    return { plans, total, limit, offset };
  },

  async getById(id: string) {
    return prisma.rentalPlan.findUnique({
      where: { id },
      include: {
        theme: true,
        planStores: { include: { store: true } },
        planTags: { include: { tag: true } },
        planComponents: {
          include: { merchantComponent: true },
          orderBy: { hotmapOrder: 'asc' },
        },
        planUpgrades: {
          include: { merchantComponent: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  },

  async getFeatured(limit = 8) {
    return prisma.rentalPlan.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        theme: true,
        planStores: { include: { store: true } },
      },
      orderBy: { priority: 'desc' },
      take: limit,
    });
  },
};
```

**Step 2: Commit**

```bash
git add src/server/services/
git commit -m "feat(services): add plan service with list, getById, getFeatured"
```

---

### Task 1.13: Create Plan Router

**Files:**
- Create: `src/server/trpc/routers/plan.ts`
- Modify: `src/server/trpc/routers/index.ts`

**Step 1: Create plan router**

```typescript
// src/server/trpc/routers/plan.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { planService } from '@/server/services/plan.service';

export const planRouter = router({
  list: publicProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        storeId: z.string().optional(),
        location: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      return planService.getList(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return planService.getById(input.id);
    }),

  featured: publicProcedure
    .input(z.object({ limit: z.number().default(8) }).optional())
    .query(async ({ input }) => {
      return planService.getFeatured(input?.limit);
    }),
});
```

**Step 2: Add to root router**

```typescript
// src/server/trpc/routers/index.ts
import { router } from '../trpc';
import { healthRouter } from './health';
import { planRouter } from './plan';

export const appRouter = router({
  health: healthRouter,
  plan: planRouter,
});

export type AppRouter = typeof appRouter;
```

**Step 3: Commit**

```bash
git add src/server/trpc/routers/
git commit -m "feat(trpc): add plan router with list, getById, featured"
```

---

### Task 1.14: Run Data Migration Check Script

**Files:**
- Create: `scripts/check-legacy-data.ts`

**Step 1: Create check script**

```typescript
// scripts/check-legacy-data.ts
import prisma from '../src/lib/prisma';

async function checkLegacyData() {
  console.log('=== Legacy Data Check ===\n');

  // Check CampaignPlan
  try {
    const campaignPlanCount = await prisma.campaignPlan.count();
    console.log(`CampaignPlan records: ${campaignPlanCount}`);
  } catch (e) {
    console.log('CampaignPlan: table not found or already removed');
  }

  // Check Listing
  try {
    const listingCount = await prisma.listing.count();
    console.log(`Listing records: ${listingCount}`);
  } catch (e) {
    console.log('Listing: table not found or already removed');
  }

  // Check CartItem with campaignPlanId
  try {
    const cartItemsWithCampaign = await prisma.cartItem.count({
      where: { campaignPlanId: { not: null } },
    });
    console.log(`CartItem with campaignPlanId: ${cartItemsWithCampaign}`);
  } catch (e) {
    console.log('CartItem.campaignPlanId: field not found or already removed');
  }

  // Check BookingItem with campaignPlanId
  try {
    const bookingItemsWithCampaign = await prisma.bookingItem.count({
      where: { campaignPlanId: { not: null } },
    });
    console.log(`BookingItem with campaignPlanId: ${bookingItemsWithCampaign}`);
  } catch (e) {
    console.log('BookingItem.campaignPlanId: field not found or already removed');
  }

  console.log('\n=== Check Complete ===');
}

checkLegacyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Run the script**

```bash
pnpm tsx scripts/check-legacy-data.ts
```

**Step 3: Record findings in docs/plans/2026-01-10-architecture-refactor.md Section 10**

**Step 4: Commit**

```bash
git add scripts/check-legacy-data.ts
git commit -m "chore: add legacy data check script"
```

---

### Task 1.15: Week 1 Milestone Verification

**Checklist:**

- [ ] tRPC API accessible at `/api/trpc/health.check`
- [ ] tRPC client works from React components
- [ ] nuqs useSearchState hook updates URL
- [ ] plan.list and plan.getById queries work
- [ ] Directory structure created (features/, server/, shared/)
- [ ] All changes committed to `refactor/architecture` branch

**Step 1: Run full verification**

```bash
# Start dev server
pnpm dev &
sleep 5

# Test tRPC health
curl http://localhost:3000/api/trpc/health.check

# Test plan list
curl "http://localhost:3000/api/trpc/plan.list?input={}"
```

**Step 2: Push branch**

```bash
git push -u origin refactor/architecture
```

---

## Week 2: Feature Module Migration (High-Level)

> Detailed steps will be added after Week 1 review.

### Task 2.1: Create guest/discovery Module

- Move HeroSearchBar.tsx to features/guest/discovery/
- Move SearchFilters, ThemePills
- Create usePlanSearch hook using tRPC
- Replace SearchStateContext usage with useSearchState (nuqs)

### Task 2.2: Create guest/plans Module

- Move PlanCard, PlanGrid to features/guest/plans/
- Move PlanDetailClient, ServiceMap, UpgradeSelector
- Create usePlanDetail hook
- Wire up tRPC queries

### Task 2.3: Create guest/booking Module

- Move BookingCard to features/guest/booking/
- Move Cart components
- Move checkout flow
- Create booking service and router

### Task 2.4: Create guest/profile Module

- Move profile page components
- Move favorites components
- Move booking history

### Task 2.5: Delete SearchStateContext

- Remove src/contexts/SearchStateContext.tsx
- Remove src/contexts/SearchBarContext.tsx
- Remove src/contexts/SearchLoadingContext.tsx
- Update all imports

---

## Week 3: AI Integration + Cleanup (High-Level)

> Detailed steps will be added after Week 2 review.

### Task 3.1: Integrate AI Virtual Try-On

- Copy from packages/virtual-tryon/ to features/guest/virtual-tryon/
- Delete current src/components/virtual-tryon/ draft
- Create tRPC router for try-on
- Wire up components

### Task 3.2: Setup AI Chatbot Client

- Install openapi-typescript
- Generate types from chatbot OpenAPI
- Create chatbot.ts client
- Create ChatWidget component

### Task 3.3: Merchant Module Organization

- Move merchant components to features/merchant/
- Create merchant routers

### Task 3.4: Cleanup Legacy Code

- Delete unused components from src/components/
- Delete old contexts
- Update CLAUDE.md with new architecture
- Final testing

---

## Commit Convention

```
type(scope): description

Types:
- feat: new feature
- fix: bug fix
- refactor: code restructuring
- deps: dependency changes
- chore: maintenance
- docs: documentation

Scopes:
- trpc, state, services, features, cleanup
```
