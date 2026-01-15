# Week 2 Detailed Implementation Plan

> **Date**: 2026-01-14
> **Status**: Pending Review
> **Prerequisites**: Week 1 tasks completed

## Overview

Based on codebase exploration, Week 2 focuses on migrating existing components into the Feature-Sliced Design structure while replacing Context-based state with nuqs.

**Estimated Tasks**: 15 detailed tasks
**Approach**: Incremental migration with verification at each step

---

## Task 2.1: Setup nuqs Provider

**Goal**: Enable nuqs URL state management across the app.

**Files to modify**:
- `src/app/(main)/layout.tsx`

**Steps**:

1. Check if NuqsAdapter is already in layout
2. If not, add NuqsAdapter wrapper around children
3. Verify nuqs works by testing useSearchState hook

**Verification**:
```bash
pnpm dev
# Navigate to /plans?location=京都
# Check URL params persist and update
```

**Commit**: `feat(state): configure nuqs adapter in layout`

---

## Task 2.2: Enhance useSearchState Hook

**Goal**: Extend the nuqs-based hook to match SearchStateContext capabilities.

**Files**:
- Modify: `src/shared/hooks/useSearchState.ts`
- Create: `src/shared/hooks/index.ts` (if not exists)

**Current hook has**: location, date, theme, guests

**Need to add**:
- `minPrice`, `maxPrice` (price range)
- `sort` (sorting option)
- `tags` (array of tag slugs)
- `category` (plan category)
- `clearAll()` utility

**Implementation**:
```typescript
// src/shared/hooks/useSearchState.ts
import { useQueryState, useQueryStates, parseAsString, parseAsInteger, parseAsArrayOf } from 'nuqs';

export function useSearchState() {
  const [location, setLocation] = useQueryState('location', parseAsString);
  const [date, setDate] = useQueryState('date', parseAsString);
  const [theme, setTheme] = useQueryState('theme', parseAsString);
  const [guests, setGuests] = useQueryState('guests', parseAsInteger.withDefault(1));
  const [minPrice, setMinPrice] = useQueryState('minPrice', parseAsInteger);
  const [maxPrice, setMaxPrice] = useQueryState('maxPrice', parseAsInteger);
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('recommended'));
  const [category, setCategory] = useQueryState('category', parseAsString);
  const [tags, setTags] = useQueryState('tags', parseAsArrayOf(parseAsString, ','));

  const clearAll = async () => {
    await Promise.all([
      setLocation(null),
      setDate(null),
      setTheme(null),
      setGuests(null),
      setMinPrice(null),
      setMaxPrice(null),
      setSort(null),
      setCategory(null),
      setTags(null),
    ]);
  };

  return {
    // Values
    location, date, theme, guests, minPrice, maxPrice, sort, category, tags,
    // Setters
    setLocation, setDate, setTheme, setGuests, setMinPrice, setMaxPrice, setSort, setCategory, setTags,
    // Utilities
    clearAll,
    hasFilters: !!(location || date || theme || minPrice || maxPrice || tags?.length || category),
  };
}
```

**Verification**:
```bash
pnpm tsc --noEmit
```

**Commit**: `feat(state): enhance useSearchState hook with all search params`

---

## Task 2.3: Create guest/discovery Module Structure

**Goal**: Set up the discovery feature module directory.

**Files to create**:
```
src/features/guest/discovery/
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
└── index.ts
```

**Steps**:

1. Create directory structure
2. Create barrel exports (index.ts files)
3. Keep components in original location for now (will move in next tasks)

**Commit**: `refactor(discovery): create feature module structure`

---

## Task 2.4: Migrate ThemePills to Discovery Module

**Goal**: Move theme-related components to the discovery feature.

**Files**:
- Move: `src/components/ThemePills.tsx` → `src/features/guest/discovery/components/ThemePills.tsx`
- Move: `src/components/ClientThemePills.tsx` → `src/features/guest/discovery/components/ClientThemePills.tsx`
- Update: `src/features/guest/discovery/components/index.ts`

**Steps**:

1. Copy ThemePills.tsx to new location
2. Copy ClientThemePills.tsx to new location
3. Update imports in ClientThemePills to use new paths
4. Update barrel export
5. Update all consumers to import from `@/features/guest/discovery`
6. Delete original files
7. Verify app still works

**Consumer files to update**:
- `src/app/(main)/plans/(list)/PlansClient.tsx`
- `src/components/layout/Header.tsx` (if uses ClientThemePills)

**Verification**:
```bash
pnpm build
pnpm dev
# Navigate to /plans and verify theme pills work
```

**Commit**: `refactor(discovery): migrate ThemePills to feature module`

---

## Task 2.5: Migrate Search Dropdowns to Discovery Module

**Goal**: Move location and date dropdowns.

**Files**:
- Move: `src/components/search/LocationDropdown.tsx` → `src/features/guest/discovery/components/LocationDropdown.tsx`
- Move: `src/components/search/DateDropdown.tsx` → `src/features/guest/discovery/components/DateDropdown.tsx`
- Update barrel exports

**Steps**:

1. Copy files to new location
2. Update internal imports if needed
3. Export from `src/features/guest/discovery/components/index.ts`
4. Update all consumers
5. Delete original files

**Consumer files to update**:
- `src/components/HeroSearchBar.tsx`
- `src/components/home/HeroSearchPanel.tsx`

**Commit**: `refactor(discovery): migrate search dropdowns to feature module`

---

## Task 2.6: Migrate SearchFilterSidebar to Discovery Module

**Goal**: Move filter sidebar component.

**Files**:
- Move: `src/components/search/SearchFilterSidebar.tsx` → `src/features/guest/discovery/components/SearchFilterSidebar.tsx`
- Move: `src/components/CategoryFilter.tsx` → `src/features/guest/discovery/components/CategoryFilter.tsx`
- Move: `src/components/SortSelector.tsx` → `src/features/guest/discovery/components/SortSelector.tsx`
- Move: `src/components/StoreFilter.tsx` → `src/features/guest/discovery/components/StoreFilter.tsx`

**Commit**: `refactor(discovery): migrate filter components to feature module`

---

## Task 2.7: Migrate HeroSearchBar to Discovery Module

**Goal**: Move main search bar components.

**Files**:
- Move: `src/components/HeroSearchBar.tsx` → `src/features/guest/discovery/components/HeroSearchBar.tsx`
- Move: `src/components/home/HeroSearchPanel.tsx` → `src/features/guest/discovery/components/HeroSearchPanel.tsx`
- Update: Replace SearchStateContext usage with useSearchState hook

**Key Change**: Remove `useSearchState()` from Context, use nuqs hook instead.

**Before**:
```typescript
import { useSearchState } from '@/contexts/SearchStateContext';
const { location, setLocation, theme, setTheme } = useSearchState();
```

**After**:
```typescript
import { useSearchState } from '@/shared/hooks';
const { location, setLocation, theme, setTheme } = useSearchState();
```

**Commit**: `refactor(discovery): migrate HeroSearchBar with nuqs state`

---

## Task 2.8: Create guest/plans Module Structure

**Goal**: Set up the plans feature module directory.

**Files to create**:
```
src/features/guest/plans/
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
└── index.ts
```

**Commit**: `refactor(plans): create feature module structure`

---

## Task 2.9: Migrate PlanCard Components to Plans Module

**Goal**: Move PlanCard and related components.

**Files**:
- Move entire: `src/components/PlanCard/` → `src/features/guest/plans/components/PlanCard/`
  - index.tsx (315 lines)
  - FeaturedPlanCard.tsx (285 lines)
  - PlanCardGrid.tsx (35 lines)
  - (Skip PlanCardPreview.tsx, PlanCardManagement.tsx - merchant components)

**Steps**:

1. Copy guest-facing PlanCard components
2. Update barrel exports
3. Update all consumers to import from `@/features/guest/plans`
4. Verify imports work

**Key consumers**:
- `src/app/(main)/page.tsx` (homepage)
- `src/app/(main)/plans/(list)/PlansClient.tsx`
- `src/components/plan/RelatedPlans.tsx`

**Commit**: `refactor(plans): migrate PlanCard components to feature module`

---

## Task 2.10: Migrate Plan Detail Components to Plans Module

**Goal**: Move plan detail page components.

**Files**:
- Move: `src/components/PlanDetailClient.tsx` → `src/features/guest/plans/components/PlanDetailClient.tsx`
- Move entire: `src/components/plan/` → `src/features/guest/plans/components/`
  - VisualHub/
  - ServiceMap/
  - UpgradeServices.tsx
  - JourneyTimeline/
  - AITryOnSection.tsx
  - RelatedPlans.tsx
  - StoreLocationCard.tsx
  - SocialProof/

**Steps**:

1. Copy all plan detail components
2. Update internal imports (components reference each other)
3. Update PlanDetailClient to import from new paths
4. Update barrel exports
5. Update page consumer: `src/app/(main)/plans/[id]/page.tsx`

**Commit**: `refactor(plans): migrate plan detail components to feature module`

---

## Task 2.11: Create usePlanList Hook

**Goal**: Create a hook that uses tRPC for plan listing.

**Files**:
- Create: `src/features/guest/plans/hooks/usePlanList.ts`

**Implementation**:
```typescript
// src/features/guest/plans/hooks/usePlanList.ts
import { trpc } from '@/shared/api/trpc';

export interface UsePlanListParams {
  theme?: string | null;
  storeId?: string | null;
  location?: string | null;
  limit?: number;
  offset?: number;
}

export function usePlanList(params: UsePlanListParams = {}) {
  return trpc.plan.list.useQuery({
    theme: params.theme ?? undefined,
    storeId: params.storeId ?? undefined,
    location: params.location ?? undefined,
    limit: params.limit ?? 20,
    offset: params.offset ?? 0,
  });
}

export function useFeaturedPlans(limit = 8) {
  return trpc.plan.featured.useQuery({ limit });
}
```

**Commit**: `feat(plans): add usePlanList and useFeaturedPlans hooks`

---

## Task 2.12: Create usePlanDetail Hook

**Goal**: Create a hook for fetching plan details via tRPC.

**Files**:
- Create: `src/features/guest/plans/hooks/usePlanDetail.ts`

**Implementation**:
```typescript
// src/features/guest/plans/hooks/usePlanDetail.ts
import { trpc } from '@/shared/api/trpc';

export function usePlanDetail(id: string | undefined) {
  return trpc.plan.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );
}
```

**Commit**: `feat(plans): add usePlanDetail hook`

---

## Task 2.13: Create guest/booking Module Structure

**Goal**: Set up the booking feature module.

**Files to create**:
```
src/features/guest/booking/
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
├── store/
│   └── index.ts
└── index.ts
```

**Commit**: `refactor(booking): create feature module structure`

---

## Task 2.14: Migrate BookingCard to Booking Module

**Goal**: Move booking components.

**Files**:
- Move: `src/components/BookingCard.tsx` → `src/features/guest/booking/components/BookingCard.tsx`
- Move: `src/components/InstantBookingModal.tsx` → `src/features/guest/booking/components/InstantBookingModal.tsx`
- Move: `src/components/MiniBookingBar.tsx` → `src/features/guest/booking/components/MiniBookingBar.tsx`
- Move entire: `src/components/booking/` → `src/features/guest/booking/components/`

**Steps**:

1. Copy all booking components
2. Update internal imports
3. Update barrel exports
4. Update consumers (PlanDetailClient)

**Commit**: `refactor(booking): migrate BookingCard components to feature module`

---

## Task 2.15: Delete SearchStateContext and SearchLoadingContext

**Goal**: Remove deprecated context providers.

**Files to delete**:
- `src/contexts/SearchStateContext.tsx`
- `src/contexts/SearchLoadingContext.tsx`

**Files to modify**:
- `src/app/(main)/layout.tsx` - Remove provider wrappers
- All remaining consumers - Already updated in previous tasks

**Steps**:

1. Verify no files import from deleted contexts
2. Remove provider wrappers from layout
3. Delete context files
4. Run full build to verify

**Verification**:
```bash
# Check for remaining imports
grep -r "SearchStateContext" src/
grep -r "SearchLoadingContext" src/

# Should return no results (or only the context files themselves)
pnpm build
```

**Commit**: `refactor(state): remove deprecated search contexts`

---

## Task 2.16: Week 2 Milestone Verification

**Checklist**:
- [ ] All discovery components in `features/guest/discovery/`
- [ ] All plan components in `features/guest/plans/`
- [ ] All booking components in `features/guest/booking/`
- [ ] nuqs useSearchState hook working
- [ ] SearchStateContext deleted
- [ ] SearchLoadingContext deleted
- [ ] tRPC hooks (usePlanList, usePlanDetail) created
- [ ] App builds without errors
- [ ] Manual testing: search, browse plans, view details, booking flow

**Verification**:
```bash
# Full build
pnpm build

# Type check
pnpm tsc --noEmit

# Run tests
pnpm test

# Manual testing
pnpm dev
# Test: Homepage → Search → Plans list → Plan detail → Add to cart → Checkout
```

**Commit**: `docs: mark Week 2 milestone complete`

---

## Execution Order

**Batch 1** (Foundation):
- Task 2.1: Setup nuqs Provider
- Task 2.2: Enhance useSearchState Hook
- Task 2.3: Create guest/discovery Module Structure

**Batch 2** (Discovery Module):
- Task 2.4: Migrate ThemePills
- Task 2.5: Migrate Search Dropdowns
- Task 2.6: Migrate SearchFilterSidebar
- Task 2.7: Migrate HeroSearchBar

**Batch 3** (Plans Module):
- Task 2.8: Create guest/plans Module Structure
- Task 2.9: Migrate PlanCard Components
- Task 2.10: Migrate Plan Detail Components
- Task 2.11: Create usePlanList Hook
- Task 2.12: Create usePlanDetail Hook

**Batch 4** (Booking Module + Cleanup):
- Task 2.13: Create guest/booking Module Structure
- Task 2.14: Migrate BookingCard
- Task 2.15: Delete SearchStateContext and SearchLoadingContext
- Task 2.16: Week 2 Milestone Verification

---

## Risk Mitigation

1. **Import Path Changes**: Use IDE "Find and Replace" carefully
2. **Build Breaks**: Run `pnpm build` after each batch
3. **Runtime Errors**: Test critical flows after each migration
4. **Rollback**: Each task has a dedicated commit for easy revert

---

## Notes

- Keep `SearchBarContext` for now (UI scroll behavior, lower priority)
- Merchant-specific components (PlanCardManagement, etc.) stay in `src/components/` until merchant module migration
- Cart store stays at `src/store/cart.ts` until booking module fully migrated
