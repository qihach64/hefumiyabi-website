# Role: World-Class UI/UX Designer (Airbnb Level) & Senior React Engineer who leads a FE/UI/UX team

You are tasked with redesigning the homepage for "Kimono One" (Kimono Rental Service) to achieve a **"Cinematic Zen"** aesthetic—blending the emotional depth of traditional Japanese culture with the frictionless, modern utility of Airbnb.

## Design Philosophy: "Wabi-Sabi Modern"

- **Visuals**: Use a "Sakura & Stone" palette. Soft pinks (#FF7A9A) for accents, warm grays/neons for backgrounds.
- **Texture**: Surfaces should feel tactile. Use "imperfect" paper textures or subtle noise overlays on verify high-end devices.
- **Motion**: Every interaction must have physics. Hover states should lift (elevation), active states should press (scale down).

## Component Specifications

### 1. Hero Section: "The Emotional Hook"
- **Background**: Implementing a slow "Ken Burns" effect (scale 1.0 -> 1.05 over 20s) on the high-res kimono image to create breathing room.
- **Typography**: Vertical Japanese text (writing-mode: vertical-rl) for "Kyoto Kimono" to anchor cultural authenticity.
- **Glassmorphism**: The search bar should be a "Frosted Glass" panel (backdrop-filter: blur(12px) + white/70) floating above the image.

### 2. Search Experience: "Instant & Tactile"
- **Performance**: Search results must appear in <200ms. Use optimistic UI updates.
- **Feedback**: Clicking "Search" triggers a subtle ripple effect.
- **Dropdowns**: Date/Location pickers should spring open (using spring physics) rather than just appearing.

### 3. Content Discovery: "Fluid Exploration"
- **Horizontal Scroll**: "Popular Plans" section uses snap-scrolling (scroll-snap-type: x mandatory).
- **Cards**:
    - **Image**: 3:2 aspect ratio.
    - **Hover**: Card lifts 8px, shadow deepens (shadow-xl), image zooms slightly (scale 1.05).
    - **Skeleton**: Shimmering "bone" color (stone-200) matching the Wabi-Sabi theme, not generic gray.

### 4. Mobile Experience: "Thumb-Driven"
- **Navigation**: Bottom sheet for filters.
- **Height**: Use `100svh` for the Hero to avoid address bar layout shifts.
- **Touch**: 48px minimum touch targets for all interactive elements.

## Technical Requirements (Next.js 14 + Tailwind)

1.  **Zero Layout Shift (CLS)**: Pre-allocate space for images using `next/image` sizing.
2.  **Lazy Loading**: Only load the "Search Mode" hefty components (Filter sidebar, huge lists) when the user interacts.
3.  **Code Structure**:
    - `src/components/home/HeroSection.tsx`: Zen animations + Glass search.
    - `src/app/(main)/HomeClient.tsx`: Client-side state for instant filtering.
    - `src/styles/globals.css`: Define standard "ease-out-quart" transitions.

## Implementation Prompt

"Refactor the `HeroSection` and `HomeClient` to embody this 'Cinematic Zen' vision. Eliminate all layout jank. Ensure the search bar feels like a premium native OS element. Use the existing `useSearchState` hook but make the UI updates optimistic and fluid."

Initialize an agent team (frontend, ui/ux) to implement this design.

Frontend agent is responsible for the implementation of the frontend code.

UI/UX agent is responsible for the implementation of the ui/ux design.