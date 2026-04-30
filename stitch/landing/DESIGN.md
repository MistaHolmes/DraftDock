# Design System: Technical Minimalism

## 1. Overview & Creative North Star
**Creative North Star: The Architect’s Blueprint**

This design system is a masterclass in "Technical Minimalism." It moves away from the soft, rounded aesthetic dominating current SaaS trends, favoring a high-contrast, razor-sharp editorial look. The system is inspired by the precision of architectural drafting and the clarity of early computing interfaces, refined for a modern, high-end digital experience.

By breaking the "template" look through intentional asymmetry and a total rejection of traditional container borders, we create an interface that feels infinite and unconstrained. We utilize a rigid underlying grid (the "Drafting Plane") not to box elements in, but to anchor them in space with mathematical intent.

## 2. Colors & Tonal Logic

The palette is strictly monochromatic, relying on luminance shifts rather than hue to communicate hierarchy and state.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning or card definition. Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
- **Tonal Contrast:** Using the `outline-variant` sparingly as a background-on-background separator only when necessary for high-density layouts.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of vellum.
- **Base Level:** `surface` (#f9f9f9).
- **Secondary Tier:** `surface-container-low` (#f3f3f3) for subtle content grouping.
- **Active/Interactive Tier:** `surface-container-highest` (#e2e2e2) for elements requiring immediate focus.

### The "Glass & Gradient" Rule
To prevent the UI from feeling flat or sterile, use **Glassmorphism** for floating menus and modals. Utilize the `surface` token at 80% opacity with a `backdrop-filter: blur(12px)`. For Primary CTAs, apply a subtle linear gradient from `primary` (#000000) to `primary-container` (#3b3b3b) at a 45-degree angle to add "soul" and a tactile, premium finish.

## 3. Typography: The Editorial Scale

We use **Inter** as the foundational typeface. Its high x-height and geometric clarity support the "Technical" aesthetic.

*   **Display (lg/md/sm):** Used for "Hero" moments. These should feel authoritative. Use tighter letter-spacing (-0.02em) for `display-lg` to create a dense, editorial impact.
*   **Headline & Title:** These serve as the structural signposts. They are always `primary` (#000000) to ensure high-contrast readability against the monochromatic surfaces.
*   **Body (lg/md/sm):** Optimized for long-form reading. Use `on-surface-variant` (#474747) for body-md to reduce eye strain and create a sophisticated "ink-on-paper" grey tone.
*   **Label:** Used for technical metadata. Often paired with uppercase transformations to lean into the drafting-table aesthetic.

## 4. Elevation & Depth

In this system, depth is a function of light and stacking, never structural lines.

### The Layering Principle
Depth is achieved by stacking surface tiers. A card should be `surface-container-lowest` (#ffffff) sitting atop a `surface-container` (#eeeeee) background. This creates a natural "lift" through color value alone.

### Ambient Shadows
Shadows must mimic natural, ambient light.
- **Value:** Blur: 24px - 48px | Spread: 0 | Opacity: 4% - 6%.
- **Tint:** The shadow color should be a tint of `on-surface` (#1a1c1c), never pure black.

### The "Ghost Border" Fallback
If a visual anchor is required for accessibility, use a **Ghost Border**: the `outline-variant` (#c6c6c6) at 15% opacity. This provides a "suggestion" of a boundary without disrupting the minimalist flow.

## 5. Components

### Buttons
Sharp edges are mandatory. `borderRadius: 0px`.
*   **Primary:** `primary` background with `on-primary` text. Use the subtle 45-degree gradient.
*   **Secondary:** `surface` background with a 1px `primary` border (the only exception to the "No-Line" rule for high-contrast action).
*   **Tertiary:** No background. `on-surface` text with an underline that appears only on hover.

### Input Fields
*   **Style:** Minimalist underline or "Ghost Bordered" box. 
*   **State:** On focus, the bottom border transitions from `outline` to `primary` with a 2px stroke.
*   **Errors:** Use `error` (#ba1a1a) text for helper messages, never background fills.

### Cards & Lists
*   **Constraint:** Zero dividers. Use vertical white space from the **Spacing Scale** (e.g., `spacing-8` or `spacing-12`) to define segments.
*   **The Grid Motif:** Use a subtle CSS background pattern on `surface` areas to mimic the drafting paper seen in the original landing page (1px dots or lines at 5% opacity).

### Additional Component: The "Drafting Chip"
A specialized label for technical metadata. Sharp edges, `surface-container-highest` background, and `label-sm` typography. Used to denote versions, status, or categories.

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** Place hero text off-center to create visual tension and interest.
*   **Embrace Whitespace:** If a section feels crowded, double the spacing value.
*   **Leverage High Contrast:** Ensure `on-surface` text is always crisp against background tiers.
*   **Respect the Grid:** Elements should align to the underlying drafting pattern mathematically.

### Don’t:
*   **Don't use Rounded Corners:** Every `borderRadius` must be `0px`.
*   **Don't use Drop Shadows on everything:** Only floating modals or Primary CTAs should have depth; keep everything else "flat-stacked."
*   **Don't use Color for Emphasis:** Aside from the `error` token, stick strictly to the monochromatic palette. Use font-weight and size for emphasis instead.
*   **Don't use Dividers:** If you need a divider, you need more whitespace.