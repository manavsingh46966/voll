<img src="assets/images/logo.png"> 

# VolStory

> Official app for VolStory — a community volunteering platform  
> Built with **Expo**, **React Native** and **NativeWind**

<div align="center">

![Framework](https://img.shields.io/badge/Framework-Expo_SDK_54-blue?style=flat-square)
![Language](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)

</div>


## 🛠 Tech Stack

- **Framework**: Expo SDK 54 (managed workflow)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State**: Zustand (client/UI) + TanStack Query (server/API)
- **Auth**: Firebase Authentication (Google + Phone OTP)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Icons**: lucide-react-native
- **Lists**: @shopify/flash-list
- **Testing**: Jest + React Native Testing Library
- **Quality**: ESLint + Prettier + Husky

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- **Expo Go SDK 24** installed on your phone (for Android)

### Installation

```bash
# Clone repo
git clone https://github.com/YOUR_ORG/volstory.git
cd volstory

# Install dependencies
npm install

# Create local environment file
cp .env.example .env

# Start Expo dev server
npm start

# Create local environment file
cp .env.example .env

# Start Expo dev server
npm start

# Press 'a' for Android, 'i' for iOS, 'w' for web, or scan the QR code.
```

## ✅ Quality Checks & Automated Guardrails

To maintain a high-quality codebase and prevent broken builds, we use **Husky** (Git hooks). **You cannot commit or push broken code to this repository.**

### How the Guardrails Work
When you try to use Git, Husky automatically steps in to verify your code:

1. **Pre-commit (`git commit`):** Husky runs TypeScript and ESLint on the files you just changed. 
   * 🛑 **If there are type errors or style violations:** The commit is immediately **canceled**. You must fix the errors before you can commit.
2. **Pre-push (`git push`):** Husky runs the entire Jest test suite.
   * 🛑 **If any test fails:** The push to GitHub is **canceled**. This ensures no broken logic ever makes it to the shared repository.

### Fixing Blocked Commits (Run Manually)
If Husky blocks you, run these commands manually in your terminal to see the exact errors, fix them, and then try committing again:

```bash
# 1. Type check (Find TypeScript errors)
npm run type-check

# 2. Lint + auto fix (Find and fix style violations)
npm run lint
npm run lint:fix

# 3. Tests (Find broken logic)
npm test
# or run in watch mode during active development
npm run test:watch
```

## 🤝 Contributing

Thank you for helping build this platform!  
Detailed guidelines are available in our

👉 **[Contributing Guide](./CONTRIBUTING.md)**

Jai Shri Krishna 🕉️
