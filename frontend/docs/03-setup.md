# 3. Onboarding & Local Environment Setup

Welcome to the VolStory repository! Getting your local environment set up correctly is the first step to contributing. Because we use a modern React Native stack (Expo SDK 54 + NativeWind v4), adhering strictly to these versions ensures you won't encounter "it works on my machine" bugs.

### System Requirements & Toolchain

Before cloning the repository, ensure your machine meets the following prerequisites. 

**1. Core Dependencies:**
* **Node.js:** `v20.x LTS` (Active LTS). We highly recommend using `nvm` (Node Version Manager) or `fnm` to manage your Node versions.
* **Package Manager:** `npm` (v10+). *Do not use Yarn or pnpm for this project to maintain lockfile consistency.*
* **Git:** v2.30 or higher.

**2. Mobile Simulators & Devices:**
* **For iOS Development:** macOS is required. Install **Xcode** (v15+) from the Mac App Store and install the iOS Simulator components.
* **For Android Development:** Install **Android Studio**. Configure a Virtual Device (AVD) running at least API Level 33 (Android 13), or connect a physical Android device with USB Debugging enabled.
* **Physical Device Testing:** Download the **Expo Go** app from the iOS App Store or Google Play Store.

**3. Recommended IDE & Extensions:**
We standardize on **Visual Studio Code (VS Code)**. Please install the following extensions to sync with our workspace settings:
* **ESLint** (Microsoft)
* **Prettier - Code formatter** (Prettier)
* **Tailwind CSS IntelliSense** (Tailwind Labs) - *Crucial for NativeWind v4*
* **Expo Tools** (Expo)

---

### Environment Variables & Secrets Management

VolStory relies on external services like Firebase (for Auth and Database) and Google Cloud (for OAuth). These services require API keys to function. 

**Security Rule #1: NEVER commit `.env` files.** Our Husky hooks and `.gitignore` are configured to block this, but you must remain vigilant. Leaking database keys is a critical security breach.

**Setup Instructions:**
1. Locate the `.env.example` file in the root directory. This file contains the *keys* we need, but safely leaves the values blank.
2. Create your local environment file:
   ```bash
   cp .env.example .env