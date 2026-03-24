# Design System Strategy: High-Contrast Editorial

## 1. Overview & Creative North Star

**Creative North Star: The Monochromatic Blueprint**
This design system is built for the high-performance developer who values clarity over clutter. It moves away from the "standard SaaS" aesthetic and toward a "Digital Editorial" experience—merging the raw, structural feel of a technical blueprint with the sophisticated polish of a high-end typography journal. 

We achieve this by leaning into the tension between **Organic Brutalism** (raw grids and sharp contrasts) and **Sophisticated Depth** (soft tonal layering and glassmorphism). The layout should feel intentional and asymmetric, breaking the rigidity of the background grid with floating containers that suggest a workspace in progress rather than a static page.

---

## 2. Colors & Surface Logic

The palette is intentionally restricted to a monochrome base to allow the content—the code and the writing—to take center stage.

### The Palette
*   **Primary (Action):** `#000000` (The anchor for all high-intent actions)
*   **Secondary (Support):** `#785900` (Inspired by the "Buy Me a Coffee" yellow, reserved exclusively for community and support actions)
*   **Surface:** `#f8f9fa` (The paper base)
*   **Neutral Grays:** Ranging from `#edeeef` (Container Low) to `#d9dadb` (Surface Dim)

### The "No-Line" Rule
To maintain a premium feel, **1px solid borders are strictly prohibited for sectioning.** We define boundaries through background color shifts. If a sidebar needs to be separated from a main feed, do not draw a line; instead, set the sidebar to `surface-container-low` on a `surface` background. This creates a "blocked out" look that feels architectural rather than boxed in.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the `surface-container` tiers to create depth:
1.  **Level 0 (Base):** `surface` (`#f8f9fa`) - Global background with the grid texture.
2.  **Level 1 (Card/Section):** `surface-container-lowest` (`#ffffff`) - For primary content areas.
3.  **Level 2 (In-section detail):** `surface-container-high` (`#e7e8e9`) - For search bars or secondary widgets.

### The "Glass & Gradient" Rule
For floating elements like "Save" bars or "Drafting" palettes, use **Glassmorphism**. Apply a semi-transparent `surface-container-lowest` with a `backdrop-blur` of 12px. To give CTAs "soul," use a subtle linear gradient on the Primary button transitioning from `primary` (`#000000`) to `primary_container` (`#3b3b3b`) at a 45-degree angle.

---

## 3. Typography

The typographic system relies on a high-contrast pairing of a geometric display font and a highly readable sans-serif.

*   **Display & Headlines (Space Grotesk):** This font conveys the "Blueprint" aesthetic. Use `display-lg` (3.5rem) for hero titles with tight letter spacing (-0.02em). It should feel bold, loud, and authoritative.
*   **Body & Interface (Inter):** For technical reading and long-form blogs. `body-lg` (1rem) is the standard for blog posts to ensure maximum readability.
*   **Labels (Inter Mono/Medium):** Use `label-md` for metadata like "5 min read" or "Tags." 

**Hierarchy Note:** Use capitalization sparingly but intentionally. `Label-sm` in all-caps with 0.05em tracking can be used for section headers to provide an editorial "tag" look.

---

## 4. Elevation & Depth

We reject traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" tones. A `surface-container-lowest` card placed on a `surface-container-low` background creates a natural lift without visual noise.
*   **Ambient Shadows:** If a floating menu is required, use a shadow with a 40px blur, 0px offset, and 4% opacity of the `on-surface` color. It should feel like a soft glow of darkness, not a hard shadow.
*   **The "Ghost Border" Fallback:** For accessibility in input fields or code blocks, use a "Ghost Border": `outline-variant` at **15% opacity**. This provides a guide for the eye without breaking the "No-Line" rule.
*   **Signature Grid:** The background grid is not just a pattern; it’s a functional guide. Ensure components align to the grid intersections to maintain a sense of structural integrity.

---

## 5. Components

### Buttons
*   **Primary:** Solid `#000000`, roundedness `md` (0.375rem). Text: `on-primary`. On hover, shift to a subtle gradient.
*   **Secondary (Coffee/Support):** Solid `#fabd00` (secondary_fixed). Provides a warmth contrast to the monochrome UI.
*   **Tertiary/Ghost:** No background. Rounded-rectangular `outline-variant` (Ghost Border style).

### Cards & Feed Items
*   **Constraint:** Absolutely no divider lines. 
*   **Separation:** Use `10` (2.5rem) or `12` (3rem) vertical spacing from the scale to separate blog entries. 
*   **Interaction:** On hover, a card should shift from `surface` to `surface-container-low`.

### Code Blocks (Unique to DraftDock)
*   **Style:** Use `inverse_surface` (`#2e3132`) for the background.
*   **Details:** `xl` (0.75rem) rounded corners. Use a "copy" button that utilizes Glassmorphism in the top right corner.

### Inputs
*   **Base:** `surface-container-lowest` with a Ghost Border.
*   **Focus State:** The Ghost Border becomes a solid 2px `primary` border. This is the only time a high-contrast border is allowed, signifying active focus.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins. Large whitespace on the left with content pushed right creates a modern, editorial feel.
*   **Do** use the grid background to "anchor" floating elements.
*   **Do** rely on font weight (Bold vs. Regular) rather than color to show hierarchy.

### Don'ts
*   **Don't** use pure `#000000` for body text. Use `on-surface` (`#191c1d`) to reduce eye strain.
*   **Don't** use standard 1px borders to separate the navbar from the content. Use a subtle tonal shift or a backdrop-blur.
*   **Don't** use vibrant colors for anything other than the secondary "Support" action or Error states. The monochrome integrity is the brand.