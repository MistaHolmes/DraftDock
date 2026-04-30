# Design System: DraftDock
**Project:** DraftDock — Intelligent Blogging Platform

## 1. Visual Theme & Atmosphere

DraftDock exudes a **modern editorial elegance** — clean, spacious, and deliberately unhurried. The aesthetic philosophy is "premium newsroom meets creative studio." The interface favors generous whitespace, muted neutrals, and strategic pops of violet to draw attention. In dark mode, the atmosphere shifts to a **deep ink-on-charcoal** feel — intimate and focused, like writing in a quiet library at night.

- **Density:** Airy and spacious — content breathes with generous padding (`p-6` to `p-12`)
- **Mood:** Confident, editorial, quietly luxurious
- **Motioni8:** Subtle fade-and-rise entrance animations (Framer Motion `opacity: 0, y: 10 → 1, 0`)
- **Dark Mode:** Class-based toggle (`.dark`), full oklch color inversion

## 2. Color Palette & Roles

### Primary Accent
| Name | Value | Role |
|------|-------|------|
| **Royal Violet** | `violet-600` / `#7c3aed` | Primary action buttons, active states, CTA backgrounds, accent badges |
| **Violet Glow** | `violet-50` / `#f5f3ff` | Hover backgrounds, subtle highlight fills |
| **Violet Shadow** | `shadow-violet-200` | Elevated pill badges and active indicators |

### Surfaces & Backgrounds
| Name | Value | Role |
|------|-------|------|
| **Cloud White** | `gray-50` / `#f9fafb` | Light mode page background |
| **Pure White** | `white` / `#ffffff` | Card backgrounds, input fills, popover surfaces |
| **Ink Black** | `gray-900` / `#111827` | Dark mode page background |
| **Charcoal** | `gray-800` / `#1f2937` | Dark mode card backgrounds |

### Text & Content
| Name | Value | Role |
|------|-------|------|
| **Near Black** | `gray-900` / `#111827` | Headlines, primary body text (light mode) |
| **Soft Gray** | `gray-400` / `#9ca3af` | Section labels, metadata, timestamps |
| **Ghost Gray** | `gray-200` / `#e5e7eb` | Placeholder text, ranking numbers |
| **Snow White** | `white` | Primary text in dark mode |

### Semantic Colors
| Name | Value | Role |
|------|-------|------|
| **Rose Alert** | `rose-500` / `#f43f5e` | Error banners, delete actions, destructive states |
| **Emerald Signal** | `green-500` / `#22c55e` | Auto-save indicators, success states |
| **Readability Red** | `red` gradient bar | Readability score, difficulty indicator |

### Stitch Design Tokens
| Name | Value | Role |
|------|-------|------|
| **Stitch Surface** | `#f9f9f9` | Neutral surface for Stitch-generated components |
| **Stitch On-Surface** | `#1b1b1b` | Text on Stitch surfaces |
| **Stitch Tertiary** | `#8f7100` | Gold-amber accent for tertiary actions |

### Borders
| Name | Value | Role |
|------|-------|------|
| **Whisper Border** | `gray-100` / `#f3f4f6` | Light mode card/container borders |
| **Slate Border** | `gray-700` / `#374151` | Dark mode card/container borders |
| **Divider** | `gray-200` / `#e5e7eb` | Sidebar and section dividers |

## 3. Typography Rules

| Role | Family | Weight | Size | Character |
|------|--------|--------|------|-----------|
| **Headlines** | Newsreader (`font-headline`) | Bold (700) | `text-4xl` to `text-5xl` | Elegant serif — editorial authority |
| **Body Text** | Manrope (`font-body`) | Regular (400–500) | `text-sm` to `text-base` | Clean geometric sans — crisp readability |
| **Labels & Meta** | Manrope (`font-label`) | Black (900) | `text-[9px]` to `text-[10px]` | **ALL-CAPS**, `tracking-[0.2em]` — micro-label system |
| **Decorative** | Playfair Display (`font-playfair`) | Variable | Contextual | Ornamental serif — used sparingly for accent |
| **Fallback Base** | Charter, Georgia, serif | Regular | Default body | Warm serif baseline via `App.css` |

**Key Pattern:** The micro-label system (`text-[10px] font-black uppercase tracking-[0.2em]`) is used extensively for section headers, badges, and metadata. This creates a distinctive "luxury editorial" feel.

## 4. Component Stylings

### Buttons
- **Primary CTA:** Ink-black background (`bg-black dark:bg-white`), white text, `font-black uppercase tracking-[0.2em]`, generously rounded (`rounded-2xl`), tall (`h-14`), wide padding (`px-12`), elevated shadow (`shadow-xl`). Hover: `opacity-90` fade.
- **Secondary:** Light gray fill (`bg-gray-50 dark:bg-gray-900`), violet or gray text, `rounded-xl`, medium padding (`px-6`). Hover: subtle shadow lift.
- **Accent/CTA Banner:** Violet-600 background, white text, full-width, `rounded-lg`, uppercase label typography.
- **Pill Badge:** Violet-600 background, white text, `rounded-full`, `shadow-lg shadow-violet-200`, all-caps micro-label.

### Cards & Containers
- **Primary Card:** White background (`dark:bg-gray-800`), **super-rounded corners** (`rounded-3xl`), thin border (`border-gray-100 dark:border-gray-700`), whisper-soft shadow (`shadow-sm`), generous internal padding (`p-6` or `p-12`).
- **Nested Widget Card:** Same as Primary but with `rounded-2xl` and slightly less padding (`p-5`).
- **Error Banner:** Rose-tinted background (`bg-rose-50 dark:bg-rose-900/10`), rose text, rose border, `rounded-3xl`.

### Inputs & Forms
- **Text Inputs:** Transparent background or `bg-gray-50 dark:bg-gray-900`, no visible border (`border-none` or `border-0`), `rounded-xl` to `rounded-2xl`, subtle focus ring in violet (`focus:ring-violet-500`).
- **Title Textarea:** Completely borderless, transparent background, headline typography (`text-4xl font-bold`), no resize. Placeholder text: near-invisible light gray (`placeholder:text-gray-200 dark:placeholder:text-gray-700`).
- **Tag Chip Input:** Dashed border (`border-dashed border-gray-200`), `rounded-xl`, collapses on focus to solid violet border.

### Tags & Badges
- **Topic Tag:** Light gray pill (`bg-gray-50 dark:bg-gray-900`), `rounded-xl`, thin border, close button on hover turns rose.
- **AI Suggestion Tag:** Colored pill (`bg-violet-50 text-violet-700` or `bg-blue-50 text-blue-700`), `rounded-full`.
- **Status Pill:** Small, all-caps, bold, `rounded-full`, color-coded by state.

### AI Assistant Panel
- **Container:** White card with `rounded-3xl`, collapsible header with chevron.
- **Feature Buttons:** Two-column grid of outlined buttons (`border border-gray-200`), each with an icon + label, `rounded-xl`. Active state: filled with violet or complementary color.
- **Suggestion List:** Stacked list items, hover reveals subtle background shift.

## 5. Layout Principles

### Grid Structure
- **Three-Column Layout:** Left sidebar (256px / `w-64`), main content (fluid), right panel (320px / `w-80`).
- **Max Container Width:** 1600px (`max-w-[1600px]`), centered with `mx-auto`.
- **Content Max Width:** 4xl (`max-w-4xl`) within the main column.
- **Sticky Sidebars:** Both sidebars are sticky (`sticky top-16`) with viewport-height scroll (`h-[calc(100vh-4rem)]`).

### Spacing & Whitespace
- **Page Padding:** `p-6` (main content), `p-4` (left sidebar), `p-6` (right sidebar).
- **Section Gaps:** `space-y-6` to `space-y-8` between major sections.
- **Component Internal:** `p-6` to `p-12` for card content, `mb-10` between form sections.
- **Strategy:** Deliberately generous — the design breathes. No cramped layouts.

### Responsive Behavior
- **Desktop (lg+):** Full three-column layout visible.
- **Tablet (md):** Right panel hides, two-column layout.
- **Mobile (<md):** Single column, sidebar becomes overlay/drawer.
- **Transitions:** `transition-all duration-300` on layout shifts.

### Elevation & Depth
- **Philosophy:** Mostly flat with selective elevation. The design uses thin borders (`border-gray-100`) rather than shadows for separation.
- **Subtle Shadows:** `shadow-sm` on cards, `shadow-xl` on promoted CTAs and the violet accent panel.
- **Cover Images:** Heavy shadow (`shadow-2xl`) with `ring-4 ring-white` for a framed photo effect.
- **Hover Effects:** Scale transforms (`hover:scale-105`) on cover images, shadow lift on cards.
