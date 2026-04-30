# Design System Specification: Editorial IDE

This document outlines the visual language and structural principles for building high-end, professional IDE-inspired interfaces. It moves away from generic, grid-locked layouts toward a sophisticated, layered environment designed for deep focus and technical clarity.

---

## 1. Overview & Creative North Star

### Creative North Star: "The Digital Obsidian"
This design system is built on the philosophy of **The Digital Obsidian**—an interface that feels carved from a single, dark architectural block. Unlike standard IDEs that rely on heavy lines and cluttered panels, this system uses "Tonal Architecture." It prioritizes atmospheric depth, crisp precision, and editorial-grade typography to transform a workspace into a curated experience.

**Key Deviations from Standard UI:**
- **Asymmetric Focus:** Content areas (like the Preview) are given breathing room that exceeds traditional sidebar proportions.
- **Atmospheric Layering:** Depth is achieved through light, not lines.
- **Intentional Negative Space:** We treat white space (or "dark space") as a functional tool to reduce cognitive load during complex tasks.

---

## 2. Colors

The palette is anchored in deep charcoals with high-chroma accents that act as beacons within the dark environment.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define major sections (Sidebar, Terminal, Main View). Boundaries must be defined strictly through background tonal shifts.
*   **Base:** `surface` (#111317)
*   **Nested Section:** `surface-container-low` (#1a1c20)
*   **Elevated Panel:** `surface-container-high` (#282a2e)

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. The background is the lowest point; as components become more interactive or temporary, they "rise" in tone.
*   **Lowest:** `surface-container-lowest` (#0c0e12) - Used for the Terminal background to create a "sunken" feel.
*   **Mid:** `surface-container` (#1e2024) - Standard sidebar and panel backgrounds.
*   **Highest:** `surface-container-highest` (#333539) - Active tab states or hovered items.

### The "Glass & Gradient" Rule
Floating elements (Modals, Command Palettes, Tooltips) should utilize **Glassmorphism**.
*   **Token:** `surface-variant` (#333539) at 70% opacity.
*   **Effect:** `backdrop-blur: 12px`. This prevents the UI from feeling "closed off" and maintains a sense of spatial awareness.
*   **Gradients:** Main CTAs (Blue/Orange) should use a subtle linear gradient from `primary` to `primary-container` to add "soul" and a sense of tactile curvature.

---

## 3. Typography

The system utilizes **Inter** for its neutral, technical clarity, but applies editorial scaling to create a clear information hierarchy.

*   **Display (Scale: 3.5rem - 2.25rem):** Use sparingly. Reserved for empty states or dashboard greetings.
*   **Headlines (Scale: 2rem - 1.5rem):** Used for major workspace headers. High contrast against `on-surface` ensures immediate orientation.
*   **Titles (Scale: 1.375rem - 1rem):** Medium weight. Used for Sidebar group titles and Panel headers.
*   **Body (Scale: 1rem - 0.75rem):** The workhorse. `body-md` (0.875rem) is the default for code-adjacent text and task descriptions.
*   **Labels (Scale: 0.75rem - 0.6875rem):** All-caps with increased letter spacing (0.05em) for terminal headers and metadata.

---

## 4. Elevation & Depth

Depth is conveyed through **Tonal Layering** rather than traditional drop shadows.

### The Layering Principle
To create a "floating" sidebar, do not add a shadow to the right edge. Instead, place the sidebar on `surface-container-low` and the main content area on `surface`. The shift in hex code provides all the separation the eye requires.

### Ambient Shadows
For floating UI (Popovers/Context Menus):
*   **Shadow:** `0 12px 40px rgba(0, 0, 0, 0.5)`. 
*   **Color Tint:** Shadows should be tinted with the `on-surface` color at 4% opacity to simulate natural light absorption in a dark room.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., Input fields):
*   **Token:** `outline-variant` (#424754) at **20% opacity**. 
*   **Constraint:** Never use 100% opaque borders for decorative containment.

---

## 5. Components

### Buttons
*   **Primary (CTA):** Vibrant Blue (`primary`) or Orange. Use `xl` (0.75rem) corner radius. Use a subtle inner-glow (1px top-stroke) to simulate a physical edge.
*   **Secondary:** `secondary-container`. Subtle, blends into the sidebar but remains clickable.
*   **Tertiary:** Ghost style. No background until hover (`surface-container-highest`).

### Input Fields (Top Navigation)
*   **Style:** Minimalist. No bottom line. Use `surface-container-high` as a subtle pill-shaped background. 
*   **Focus State:** A 1px `primary` "Ghost Border" (30% opacity) and a subtle `surface-tint` outer glow.

### Chips (Status Markers)
*   **Approved:** Use `tertiary` (#4edea3). High-legibility dark text (`on-tertiary`) on the soft green background.
*   **Shape:** `md` (0.375rem) for a professional, "tag" aesthetic.

### Cards & Task Lists
*   **Constraint:** **Forbid dividers.** Use `0.75rem` vertical spacing to separate task items. 
*   **Active State:** Use a "Surface Shift." Instead of a border, change the item's background to `surface-container-highest` and add a 2px `primary` vertical accent on the far left.

### The Terminal
*   **Background:** `surface-container-lowest`. 
*   **Text:** `on-surface-variant` for standard output, `tertiary` for success, and `error` (#ffb4ab) for failures.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `0.25rem` (DEFAULT) and `0.5rem` (lg) corner radii for almost all nested containers to maintain a geometric, IDE feel.
*   **Do** use `primary-fixed-dim` for inactive but important states.
*   **Do** prioritize vertical rhythm. Use a strict 4px/8px spacing grid to align sidebar text with main window content.

### Don't
*   **Don't** use pure black (#000000). It kills the "Obsidian" depth effect. Always use the `surface` token.
*   **Don't** use high-contrast white text for everything. Use `on-surface-variant` for secondary info to keep the eye drawn to the `primary` content.
*   **Don't** use standard shadows on buttons. They should feel integrated into the surface, not hovering high above it.