# 1. Selection of Tech Stack for Rewrite

Date: 2025-12-23
Status: Accepted

## Context
The previous application suffered from performance issues, inconsistent styling (mixed StyleSheet and Tailwind), and scattered state management (AsyncStorage overuse). We are rewriting the app to support 100k+ users. Additionally, we identified a critical need for automated regression testing to prevent bugs in complex flows like Authentication.

## Decision
We will use the following stack:

1.  **Framework:** Expo SDK 54 (Managed Workflow)
    * *Why:* Best-in-class support for OTA updates (EAS) and simplified native builds.
2.  **Styling:** NativeWind v4
    * *Why:* Unifies Web and Mobile styling. Better performance than `twrnc` due to native compilation.
3.  **Client State:** Zustand
    * *Why:* Minimal boilerplate compared to Redux. Supports transient state (like auth tokens) better than Context.
4.  **Server State:** TanStack Query (React Query)
    * *Why:* Solves the "Sync-on-Focus" requirement for real-time likes/comments without complex WebSocket infrastructure.
5.  **List Performance:** FlashList (Shopify)
    * *Why:* Essential for the "Stories" and "Events" feed to maintain 60fps on low-end Android devices.
6.  **Testing:** Jest + React Native Testing Library
    * *Why:* Essential for verifying critical logic (like Auth race conditions) without manual regression testing.
7.  **Cross-Platform Strategy:** File Extension Adapters (`.web.ts` vs `.ts`)
    * *Why:* Strictly separates Native SDKs (Google Sign-In, Firebase) from Web SDKs at the file level to prevent runtime crashes.

## Consequences
* **Positive:** Significantly faster load times; consistent code structure; automated safety net for critical logic (Auth).
* **Negative:** Developers must learn Tailwind syntax, React Query hooks, and write mocks for Native Modules in Jest.