# 3. ROI-Driven Testing Strategy

Date: 2026-02-10
Status: Accepted

## Context
We are a small team building a high-velocity product. We identified that manual regression testing for complex logic (like Authentication Race Conditions) is error-prone and slow. However, we cannot afford the time cost of maintaining 100% Code Coverage for UI components that change frequently.

## Decision
We adopt a **Critical-Path Only (ROI-Driven)** testing strategy:

1.  **Scope of Testing (Mandatory):**
    * **Authentication Logic:** `usePhoneAuth`, `useGoogleAuth`. (High Risk: User Lockout).
    * **State Management:** `auth.store.ts`. (High Risk: Data Loss/Logout).
    * **Complex Business Logic:** Any hook involving `useRef` locks or complex `useEffect` chains.

2.  **Scope of Exclusion (Explicitly Skipped):**
    * **UI Components:** Styling, simple rendering, and navigation buttons.
    * **Standard Data Fetching:** Read-only `useQuery` hooks.
    * **Configuration:** Constants and Type definitions.

3.  **Infrastructure Decision:**
    * We use a global `jest.setup.ts` file to **Mock Native Modules** (Google Sign-In, Firebase, Safe Area Context).
    * *Rationale:* This allows us to run tests in a fast Node.js environment (Jest) without requiring a physical device or emulator, while preventing "NativeModule not found" crashes.

## Consequences
* **Positive:** Development speed remains high; we only maintain tests that save us from critical failures ("3 AM Panics").
* **Negative:** Code Coverage reports will show low numbers (<50%) for many files. This is intentional and will be ignored in favor of "Critical Path Confidence."