# 4. Domain-Driven Architecture (Feature-First)

To support the complex, overlapping requirements of temple operations—ranging from volunteer scheduling to festival logistics—VolStory utilizes a **Domain-Driven (Feature-First) Architecture**. 

Instead of organizing files by their technical type (e.g., putting all components in one massive `/components` folder and all hooks in `/hooks`), we group files by their **business domain**. This ensures that as the codebase grows to support thousands of devotees, it remains modular, predictable, and easy to navigate.

### Directory Structure Overview

The repository is strictly divided into two main areas: `app/` (Routing) and `src/` (Logic & UI).

```text
/
├── app/                 # 📍 Expo Router (Strictly for Navigation & Layouts)
│   ├── (auth)/          # Public routes (login, otp, register)
│   ├── (drawer)/        # Protected routes with Drawer & Tabs (home, profile, settings)
│   └── _layout.tsx      # Root application layout
│
├── docs/                # 📚 Documentation
│   └── adr/             # Architecture Decision Records (Tech choices, Auth flow, Testing)
│
├── src/                 # 🧠 Core Application Code
│   ├── components/      # 🧱 Global Shared UI 
│   │   ├── customDrawer/# Navigation drawer components
│   │   ├── icons/       # SVG/Icon wrappers
│   │   ├── layout/      # Shared wrappers (SafeArea, Screen containers)
│   │   └── ui/          # Generic Primitives (Buttons, Inputs, Modals)
│   │
│   ├── config/          # ⚙️ Global setups (Firebase, Google Auth clients)
│   │                    # Note: Uses `.web.ts` vs `.ts` for cross-platform safety
│   │
│   ├── lib/             # 🔌 Third-party library initializations (Axios, React Query, Storage)
│   │
│   └── features/        # 📦 DOMAIN LOGIC (The most important folder)
│       └── auth/        # 🔐 The Authentication Domain
│           ├── api/     # API request functions (auth.api.ts)
│           ├── components/# Auth-specific UI (Registration forms, OTP inputs)
│           ├── data/    # Static lists (countries, skills, interests)
│           ├── hooks/   # Business logic (useGoogleAuth, usePhoneAuth)
│           ├── schemas/ # Zod validation schemas (register.schema.ts)
│           ├── screens/ # Heavy screen layouts (Imported by `app/` router)
│           ├── stores/  # Zustand state management (auth.store.ts)
│           ├── types/   # TypeScript definitions specific to Auth
│           └── utils/   # Auth-specific helpers (Providers)
│
├── .husky/              # Git hooks for pre-commit (Lint) and pre-push (Tests)
├── .env.example         # Template for required environment variables
├── eas.json             # Expo Application Services build configuration
└── jest.setup.ts        # Testing environment and Native Module mocks
```