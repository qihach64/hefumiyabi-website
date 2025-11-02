# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**江戸和装工房雅 (Edo Wasokobo Miyabi)** - A professional kimono rental e-commerce platform with marketplace capabilities, built with Next.js 15 App Router, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router, React 19.1.0, TypeScript 5 (strict mode)
- **Database**: PostgreSQL + Prisma 6.17.1 ORM (hosted on Supabase for production)
- **Authentication**: NextAuth.js 5.0 (beta) with email verification
- **State Management**: Zustand 5.0 (cart) + React Query 5.90 (server state)
- **Styling**: Tailwind CSS 4, Lucide React icons
- **Email**: Nodemailer with SMTP
- **AI Features**: Google Generative AI (chatbot), Replicate (virtual try-on)
- **Build Tool**: Turbopack for fast development

## Development Commands

```bash
# Development
pnpm dev                           # Start dev server with Turbopack
pnpm build                         # Build for production (includes prisma generate)
pnpm start                         # Start production server

# Database
pnpm prisma generate               # Generate Prisma client
pnpm prisma migrate dev            # Run migrations in development
pnpm prisma db push                # Push schema changes without migrations
pnpm prisma studio                 # Open Prisma Studio GUI
pnpm db:seed                       # Seed database with sample data
pnpm db:reset                      # Reset database and re-seed

# Data Import Scripts
pnpm tsx scripts/import-unified-plans.ts              # Import unified plans
pnpm tsx scripts/import-unified-plans.ts --clear      # Clear and re-import
pnpm tsx scripts/migrate-campaigns-to-plans.ts        # Migrate legacy campaigns
pnpm tsx scripts/test-db-simple.ts                    # Test database connection

# Testing
pnpm tsx [script-path]             # Run any TypeScript script
```

## Architecture

### Routing Structure

The app uses Next.js App Router with route groups:

- **`(main)/`** - Public site with shared header/footer layout
  - `/` - Homepage with featured plans and campaigns
  - `/plans` - Rental plans listing (filterable by store/category)
  - `/plans/[id]` - Plan details with add-to-cart and quick book
  - `/campaigns` - Promotional campaigns
  - `/cart` - Shopping cart page
  - `/booking` - Unified checkout (single-page, not multi-step wizard)
  - `/booking/success` - Booking confirmation
  - `/kimonos` - Kimono catalog
  - `/stores` - Store locations
  - `/profile` - User profile and booking history
  - `/merchant/*` - Merchant portal (dashboard, listings, bookings)
  - `/admin/*` - Admin dashboard
  - `/virtual-tryon` - AI virtual try-on feature

- **`(auth)/`** - Separate layout for authentication
  - `/login`, `/register`, `/verify-email`

- **`api/`** - API routes (see API section below)

### Database Schema Key Models

The Prisma schema has 24+ models. Critical relationships:

**Core Business**:
- `User` - Multi-method auth (email/phone), role-based (USER/ADMIN/STAFF/MERCHANT)
- `Store` - Multi-location support with geolocation
- `Kimono` - Catalog with images, categories, availability
- `RentalPlan` - **Unified plan system** (regular + campaign plans via `isCampaign` flag)
- `Campaign` - Promotional campaigns with date restrictions
- `CampaignPlan` - **Legacy model** (being migrated to RentalPlan)

**Shopping & Booking**:
- `Cart` / `CartItem` - Shopping cart with user/session support and expiration
- `Booking` / `BookingItem` - Bookings support guests and authenticated users
- `BookingKimono` - Specific kimono selections per booking item

**Marketplace**:
- `Merchant` - Merchant accounts with verification status
- `Listing` - Merchant-created rental listings (require approval)
- `Payout` - Merchant payment processing
- `MerchantReview` - Merchant ratings

**User Features**:
- `Favorite`, `Review`, `UserPreference`, `UserBehavior`, `VirtualTryOn`

### Important Architectural Decisions

1. **Unified Plan System**: Migration from separate `Campaign`/`CampaignPlan` to a single `RentalPlan` model with `isCampaign` flag. Both systems currently coexist during transition.

2. **Shopping Cart Pattern**: E-commerce style cart using Zustand with localStorage persistence
   - Location: `src/store/cart.ts`
   - Same plan added multiple times increases quantity
   - Each item can have different store assignments
   - Quick booking feature clears cart and adds single item ("Buy Now" pattern)

3. **Simplified Booking Flow**: Evolved from 4-step wizard to single-page checkout
   - Old: Select Store → Personal Info → Add-ons → Confirm
   - New: Unified checkout page with all fields visible
   - Only requires: visit date + time (no rental/return dates complexity)
   - Supports both guest and authenticated bookings

4. **Multi-Store Architecture**:
   - Each `BookingItem` has its own `storeId` (not at Booking level)
   - Supports different stores per item in same booking
   - Store filtering available on plans/campaigns pages

5. **Marketplace Model**: Two operating modes
   - Platform: Admin-managed stores and plans
   - Merchant: Merchants create listings requiring approval
   - Commission-based revenue split (15% default)

### API Routes

All API routes follow RESTful patterns:

```
/api/auth/[...nextauth]          # NextAuth handlers
/api/auth/register               # User registration
/api/auth/verify-email           # Email verification
/api/auth/send-verification      # Resend verification email

/api/bookings                    # GET (list), POST (create)
/api/bookings/[id]               # GET, PUT, DELETE
/api/bookings/[id]/cancel        # POST - cancel booking

/api/plans/[id]                  # GET plan details
/api/campaign-plans/[id]         # GET campaign plan details (legacy)

/api/kimonos                     # GET all kimonos
/api/kimonos/[id]                # GET kimono details
/api/kimonos/featured            # GET featured kimonos

/api/stores                      # GET all stores
/api/stores/[id]                 # GET store details

/api/merchant/register           # POST - merchant registration
/api/merchant/plans              # CRUD merchant plans
/api/merchant/plans/[id]         # GET, PUT, DELETE

/api/admin/bookings              # GET all bookings (admin only)
/api/admin/inventory             # Inventory management
/api/admin/merchants/[id]/approve  # Approve merchant
/api/admin/merchants/[id]/reject   # Reject merchant

/api/chatbot                     # POST - AI chatbot interactions
/api/virtual-tryon               # POST - AI virtual try-on
```

### Authentication & Authorization

- **NextAuth.js** with Prisma adapter
- Session-based auth with email verification
- Role-based access: `USER`, `ADMIN`, `STAFF`, `MERCHANT`
- Use `auth()` helper in Server Components and API routes
- Guest checkout supported (no auth required for booking)

### State Management Patterns

1. **Cart State** (Zustand): `src/store/cart.ts`
   - Persisted to localStorage as `cart-storage`
   - Hydration handled client-side
   - Access via `useCartStore()` hook

2. **Server State** (React Query): For data fetching
   - Cache management for API responses
   - Optimistic updates where applicable

3. **Form State** (React Hook Form): Forms use react-hook-form + Zod validation

### Price Handling

**CRITICAL**: All prices stored in database as **cents (分)** for precision
- Display: Divide by 100 and format as ¥
- Calculate discounts: `((originalPrice - price) / originalPrice) * 100`
- Never use floating point for money calculations

### Booking Constraints

- All cart items must have `storeId` selected before checkout
- Booking requires: visit date + visit time (no rental/return dates)
- Guest bookings require: name, email, phone
- User bookings auto-fill from session
- Email confirmations sent asynchronously (non-blocking)

### AI Features Implementation

**Virtual Try-On** (`src/app/api/virtual-tryon/route.ts`):
- Uses Replicate API or Google Gemini
- Stores results in `VirtualTryOn` model with caching
- Tracks costs, performance metrics, and status (PROCESSING/COMPLETED/FAILED)

**AI Chatbot** (`src/app/api/chatbot/route.ts`):
- Google Generative AI integration
- Embedded component in main layout

## Environment Variables

Required in `.env.local`:

```bash
# Database (required)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# Production: Add ?pgbouncer=true for connection pooling

# NextAuth (required)
NEXTAUTH_URL="http://localhost:3000"  # or production URL
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (required for verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-specific-password"
SMTP_FROM="江戸和装工房雅 <your-email@gmail.com>"

# AI Services (optional)
GOOGLE_AI_API_KEY="your-gemini-api-key"
REPLICATE_API_TOKEN="your-replicate-token"

# Redis Cache (optional)
UPSTASH_REDIS_URL="your-upstash-url"
UPSTASH_REDIS_TOKEN="your-upstash-token"
```

## Database Connection Notes

- **Development**: Direct PostgreSQL connection (port 5432)
- **Production (Vercel)**: Use Supabase with connection pooling
  - Connection pooler port: 6543
  - Add `?pgbouncer=true` parameter to DATABASE_URL
- **Build Time**: Prisma generate runs automatically via `postinstall` script
- **Migrations**: Use `prisma migrate dev` locally, `prisma db push` for quick iteration

## Code Conventions

1. **TypeScript**: Strict mode enabled, use proper types (avoid `any`)
2. **Path Aliases**: Use `@/` for `src/` directory
3. **Component Pattern**: Prefer Server Components by default, mark Client Components with `'use client'`
4. **API Responses**: Return JSON with proper HTTP status codes
5. **Error Handling**: Use try-catch in API routes, return descriptive error messages
6. **Prisma Queries**: Always use `include` to fetch relations instead of multiple queries
7. **Image Optimization**: Use Next.js `<Image>` component, configure domains in `next.config.ts`

## Common Patterns

### Adding to Cart (Client Component)

```tsx
'use client';
import { useCartStore } from '@/store/cart';

const addToCart = () => {
  useCartStore.getState().addItem({
    type: 'PLAN',
    planId: plan.id,
    name: plan.name,
    price: plan.price,
    originalPrice: plan.originalPrice,
    image: plan.images?.[0],
    addOns: [],
    isCampaign: plan.isCampaign,
  });
};
```

### Authenticated API Route

```tsx
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Query database
  const data = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { items: true, store: true },
  });

  return Response.json(data);
}
```

### Server Component Data Fetching

```tsx
import prisma from '@/lib/prisma';

export default async function PlansPage() {
  const plans = await prisma.rentalPlan.findMany({
    where: { isActive: true },
    include: { store: true },
    orderBy: { priority: 'desc' },
  });

  return <PlanGrid plans={plans} />;
}
```

## Important Files

- `prisma/schema.prisma` - Database schema (single source of truth)
- `src/store/cart.ts` - Shopping cart state management
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `next.config.ts` - Next.js configuration (image domains, build settings)
- `tailwind.config.ts` - Tailwind theme customization

## Deployment Notes

### Vercel Deployment

1. Database must be accessible from Vercel (use Supabase connection pooler)
2. Set all environment variables in Vercel dashboard
3. Build command: `pnpm build` (includes `prisma generate`)
4. Output directory: `.next`
5. Node version: 18.x or 20.x

### Build Optimization

- **Recent Change**: Removed database sync from build step to speed up deploys
- Prisma generate happens in `postinstall` and `build` script
- For production, ensure DATABASE_URL uses connection pooling

## Testing

- Manual testing via browser (no automated tests yet)
- Use Prisma Studio (`pnpm prisma studio`) to inspect database
- Test database connection: `pnpm tsx scripts/test-db-simple.ts`
- API testing: Use browser DevTools Network tab or tools like Postman

## Troubleshooting

**Email verification not sending**:
- Check SMTP credentials in `.env.local`
- For Gmail: use app-specific password, not regular password
- Check spam folder

**Database connection fails**:
- Verify PostgreSQL is running
- Check DATABASE_URL format
- For Supabase: use direct connection locally, pooled in production

**Cart not persisting**:
- Check browser localStorage (key: `cart-storage`)
- Verify client component has `'use client'` directive
- Check for hydration mismatches

**Build fails on Vercel**:
- Ensure DATABASE_URL is set in environment variables
- Check for TypeScript errors: `pnpm build` locally
- Verify Prisma schema is valid: `pnpm prisma validate`

## Recent Development Focus

Based on recent commits and file structure:

1. **Virtual Try-On Feature** - AI-powered kimono try-on (Gemini/Replicate)
2. **Schema Migration** - Moving from legacy Campaign/CampaignPlan to unified RentalPlan
3. **Build Optimization** - Removed database operations from build step for faster deploys
4. **Scene Mode Testing** - Evaluating different AI providers for virtual try-on

## Design System

- **Inspiration**: Airbnb-style UI with horizontal scrolling cards
- **Image Ratio**: 3:4 for product images (kimono display)
- **Font**: Noto Sans SC for Chinese/Japanese text
- **Color Theme**: Sakura (cherry blossom) inspired palette
- **Responsive**: Mobile-first approach, touch-friendly interactions
