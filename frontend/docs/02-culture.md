# 2. Engineering Culture & Core Principles

> **"Great products are a byproduct of a great engineering culture."**

At VolStory, our engineering culture is the engine that drives our mission. We are a team of problem-solvers building high-impact tools for the ISKCON community. To maintain a world-class standard, we hold ourselves and each other accountable to the following core principles.

### 🧘‍♂️ Ego-Free Collaboration & Code Reviews
We practice "Ego-Free Engineering." You are not your code. 
* **Review the Code, Not the Coder:** Code reviews are collaborative learning opportunities, not battlegrounds. We leave constructive, actionable, and kind feedback. 
* **The "Boy Scout" Rule:** Always leave the codebase cleaner than you found it. If you are fixing a bug in a file and spot an outdated type definition or a messy import, fix it.
* **Ask for Context:** If you don't understand *why* a piece of code was written a certain way, ask before deleting or rewriting it. We assume positive intent from all contributors.

### 📱 Extreme Empathy for the End User
Temple environments are unique. Users will access VolStory in crowded festival tents, in temple kitchens with weak cellular signals, and on older, low-end Android devices.
* **Offline-First Resilience:** Network requests will fail. We always assume a slow 3G connection or complete offline status. UI should immediately reflect cached data (via TanStack Query) while background syncs occur seamlessly.
* **60 FPS is Non-Negotiable:** A dropped frame is a broken promise. We use tools like Shopify's `FlashList` and `NativeWind` to ensure smooth scrolling and instant interactions. Do not block the JavaScript thread. Heavy computations must be memoized (`useMemo`, `useCallback`) or pushed to the backend.
* **Accessibility (a11y) by Default:** Our congregation spans generations. Font scaling, high-contrast text, touch target sizes (minimum 44x44 points), and screen reader compatibility are strict requirements, not afterthoughts.

### 🛡️ Fail Loudly Locally, Degrade Gracefully in Production
We want our tools to scream at us on our local machines so that our users never see a white screen of death in production.
* **Strict TypeScript:** We compile with `strict: true`. The `any` type is strictly prohibited. If a type is unknown, use `unknown` and narrow it safely. Let the compiler catch your bugs before you even save the file.
* **Automated Guardrails:** We rely on Husky and Lint-Staged to enforce our rules. If your code fails the linter or breaks a test, the CI pipeline will block the Pull Request. We embrace these tools because they protect the main branch.
* **Error Boundaries:** When the unexpected happens in production, the app must never crash entirely. Features must be wrapped in Error Boundaries that provide a graceful fallback UI and clear recovery options (e.g., "Pull to Refresh").

### 🏗️ Pragmatic Architecture over Dogma
We value readable, maintainable, and predictable code over "clever" one-liners or the latest trendy design patterns.
* **Feature-First Modularity:** We organize our code by domain (e.g., `auth`, `feed`, `events`), keeping everything related to a specific feature isolated. This prevents "spaghetti code" and allows multiple developers to work in parallel without merge conflicts.
* **Single Source of Truth:** State should only exist in one place. Do not duplicate server data into local state. Rely on our designated state management tools (Zustand for UI, React Query for Server Data) to maintain absolute consistency.