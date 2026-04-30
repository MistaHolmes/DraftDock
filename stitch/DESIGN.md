# Design System: The Editorial Canvas

## 1. Overview & Creative North Star

### Creative North Star: "The Modern Curator"
This design system is built for an elite writing experience. It moves away from the "SaaS dashboard" cliché and toward a **High-End Editorial** aesthetic. We treat the digital interface as a physical workspace—think of a clean, expansive studio desk with layered sheets of premium paper. 

The system achieves distinction through **Intentional Asymmetry** and **Tonal Depth**. By utilizing a sophisticated scale of grays and a vibrant, intellectual purple, we create a focus-driven environment where the content is the hero, and the UI is the invisible, supportive infrastructure.

---

## 2. Colors

The palette is designed to be "quiet" yet authoritative. We use a high-contrast primary purple to signal action and intelligence, while the neutral foundation provides a sense of calm.

### Core Palette
- **Primary (`#702ae1`)**: The "Action" color. Reserved for brand moments, primary CTAs, and active navigation states.
- **Secondary (`#7742a6`)**: Used for supportive elements like "Pro" features or subtle accents.
- **Tertiary (`#9e3657`)**: A sophisticated berry tone used for highlight states or specific category markers.
- **Background (`#f5f7f9`)**: A cool-tinted white that reduces eye strain compared to pure `#FFFFFF`.

### The "No-Line" Rule
**Lines are a failure of layout.** To maintain a premium feel, designers are prohibited from using 1px solid borders to section off large areas of the UI. Instead, boundaries must be defined by:
1.  **Background Shifts:** Place a `surface-container-low` component on a `background` page.
2.  **Negative Space:** Use the spacing scale (specifically `8` or `10`) to define relationships.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers:
*   **Base:** `background` (#f5f7f9)
*   **Secondary Surface:** `surface-container-low` (#eef1f3) for sidebars or secondary panels.
*   **Hero/Card Surface:** `surface-container-lowest` (#ffffff) for the primary writing canvas.
*   **Elevated Elements:** Use semi-transparent surface colors with `backdrop-blur` (Glassmorphism) for floating menus or tooltips to ensure the layout feels integrated, not "pasted on."

---

## 3. Typography

The system uses a dual-font approach to balance personality with readability.

*   **Display & Headlines (Plus Jakarta Sans):** A modern, geometric sans-serif with a high x-height. Use `display-lg` (3.5rem) for "Welcome" moments and `headline-md` (1.75rem) for blog titles.
*   **Body & Labels (Manrope):** A versatile font designed for legibility. Its balanced proportions make it perfect for long-form writing (`body-lg`) and metadata (`label-md`).

**Editorial Hierarchy Tip:** Use `primary` (#702ae1) sparingly within typography (e.g., a single italicized word in a header) to create a "signature" look that mimics high-end print magazines.

---

## 4. Elevation & Depth

We avoid the "floating card" look of the 2010s. Depth is achieved through **Tonal Layering**.

*   **The Layering Principle:** Rather than shadows, place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#eef1f3) background. The subtle 2% difference in luminosity creates a sophisticated, natural lift.
*   **Ambient Shadows:** If an element *must* float (like a dropdown), use an extra-diffused shadow: `box-shadow: 0 10px 40px rgba(44, 47, 49, 0.06);`. The shadow color should be a tinted version of `on-surface` (#2c2f31), never pure black.
*   **The Ghost Border:** For input fields or cards where accessibility requires a container, use a `outline-variant` (#abadaf) at **15% opacity**. This provides a "ghost" of a structure without cluttering the visual field.

---

## 5. Components

### Buttons
*   **Primary:** Background: `primary` (#702ae1); Text: `on-primary` (#f8f0ff); Radius: `lg` (1rem). Use a subtle gradient transition to `primary-dim` (#6411d5) for depth.
*   **Secondary:** Ghost style. Background: `transparent`; Border: 1px `outline-variant` at 20% opacity.
*   **Write Button:** Always feature a leading `+` icon and utilize the `xl` (1.5rem) rounding for a "pill" aesthetic.

### Writing Canvas (The Blog Card)
*   **Padding:** Use `10` (3.5rem) or `12` (4rem) internal padding to give the text "breathing room."
*   **Rounding:** `xl` (1.5rem) on the main editor container to soften the professional environment.
*   **No Dividers:** Separate the title from the body using a `10` (3.5rem) vertical spacing unit rather than a horizontal line.

### Sidebar & Navigation
*   **Visual Balance:** Use a "rail" style left sidebar. Active states should use the `primary` color for the icon, with a subtle `primary-container` background-blur behind the icon.
*   **Top Nav:** Use `surface-container-lowest` (#ffffff) with a 60% opacity and a `20px` backdrop blur to create a premium glass effect as content scrolls beneath it.

### AI & Utility Chips
*   **Selection Chips:** Use `secondary-container` (#e6c5ff) with `on-secondary-container` text. These should feel like soft highlights on a page.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a wider central writing column with a narrow, right-aligned AI assistant panel).
*   **Do** lean into the Spacing Scale. If a layout feels "crowded," double the spacing unit.
*   **Do** use `primary-fixed` (#b28cff) for subtle background highlights behind important text.

### Don't
*   **Don't** use 100% opaque, high-contrast borders. It breaks the "editorial" flow.
*   **Don't** use standard "Drop Shadows." Stick to Tonal Layering or Ambient (Low-Opacity) Shadows.
*   **Don't** mix more than two font families. Stick strictly to Plus Jakarta Sans for headers and Manrope for text.
*   **Don't** use dividers (`<hr>`) to separate list items. Use background color shifts on hover or vertical whitespace.