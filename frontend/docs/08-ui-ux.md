# 8. UI/UX, Styling & Design Handoff

> **"A pixel-perfect interface is a sign of respect for the user."**

VolStory is designed to be as beautiful as it is functional. Our users—from university students to senior devotees—deserve an experience that feels polished, native, and intuitive. To achieve this, we bridge the gap between design and engineering with strict standards.

### Figma Sync & Design System Strictness



The **Figma Design File** is the absolute Source of Truth. 
* **Do Not "Eyeball" It:** If the design specifies a `16px` margin, do not use `20px` because "it looks close enough." Use the exact token.
* **Token Mapping:** We map Figma variables directly to our Tailwind configuration.
  * *Figma:* `Primary / Brand-500` -> *Code:* `bg-primary-500`
  * *Figma:* `Text / Muted` -> *Code:* `text-muted-foreground`
* **Asset Export:** Do not screenshot icons. Export SVGs directly from Figma and convert them to React Native components using SVGR or `lucide-react-native`.

### NativeWind (Tailwind) Utility Standards

We use **NativeWind v4**, which brings the utility-first power of Tailwind CSS to React Native.

**1. The "No Inline Styles" Rule:**
Inline styles (`style={{ margin: 10 }}`) are strictly prohibited for static layouts. They cause unnecessary re-renders and break the design system.
* *Bad:* `<View style={{ backgroundColor: 'red', padding: 10 }} />`
* *Good:* `<View className="bg-red-500 p-2.5" />`

**2. Component Composition:**
Do not copy-paste long strings of utility classes. Extract common patterns into reusable variants using `cva` (Class Variance Authority) or standard React components in `src/components/ui/`.

**3. Platform-Specific Styles:**
NativeWind allows us to target platforms easily. Use this to handle notch differences or platform conventions.
* *Example:* `className="pt-4 android:pt-8 ios:pt-0"`

### High-Fidelity Animations (Lottie & Reanimated)

Motion conveys meaning. However, animations must never block the main thread.

**1. Vector Animations (Lottie):**
For complex, pre-rendered animations (e.g., a "Success" checkmark, a "Loading" devotee animation, or an empty state illustration), use **Lottie**.
* Place JSON files in `assets/lottie/`.
* Use `lottie-react-native` to render them.
* Ensure animations are optimized and small (<50KB) to prevent bundle bloat.

**2. Layout Transitions (Reanimated):**
For interactive UI movements (e.g., opening a drawer, swiping a list item, expanding a card), use **React Native Reanimated**.
* **Strict Ban:** Do not use the legacy `Animated` API from React Native. It struggles with 60fps on low-end Android devices.
* **Shared Element Transitions:** Use `expo-router`'s built-in shared element features to create seamless morphing effects between screens.

### Accessibility (a11y) & Multi-generational UI

Our user base includes elderly congregation members who may have poor eyesight or limited motor control. Accessibility is not a "nice-to-have"; it is a requirement for *Seva*.

**1. Minimum Touch Targets:**
All interactive elements (buttons, icons, links) must have a hit slop of at least **44x44 points**.
* If an icon is visually small (24px), use `hitSlop` or wrap it in a larger `Pressable` with padding to ensure it can be tapped easily by older fingers.

**2. Dynamic Type (Font Scaling):**
Never set fixed heights on text containers.
* *Bad:* `h-10` (If the user bumps their font size to 200%, the text will be cut off).
* *Good:* `min-h-10` (Allows the container to grow with the text).
* Test your UI with the device font size set to "Largest" in Accessibility Settings.

**3. Screen Readers (TalkBack / VoiceOver):**
Every image and icon button must have an `accessibilityLabel`.
* *Bad:* `<Icon name="menu" />` (Screen reader says "Unlabeled button").
* *Good:* `<Icon name="menu" accessibilityLabel="Open navigation menu" />`