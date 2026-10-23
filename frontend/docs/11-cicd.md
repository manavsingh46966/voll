# 11. CI/CD & Release Pipeline

> **"Our deployment process is the bridge between code and community."**

VolStory utilizes a fully automated Continuous Integration and Continuous Deployment (CI/CD) pipeline. We do not manually build APKs or IPAs on developer machines. All releases are strictly versioned, reproducible, and deployed via the cloud to ensure stability across the organization.

### GitHub Actions Pre-Merge Checks



Before any code enters the `develop` or `main` branches, it must survive the gauntlet of our CI pipeline. We use **GitHub Actions** to enforce quality standards automatically.

**The Workflow (`.github/workflows/ci.yml`):**
1. **Trigger:** Push to any branch or Open Pull Request.
2. **Job 1: Lint & Type Check:**
   * Runs `npm run type-check` (tsc) to ensure 0% type errors.
   * Runs `npm run lint` (ESLint + Prettier) to enforce style.
3. **Job 2: Test Suite:**
   * Runs `npm test` (Jest) to verify business logic and critical paths.
4. **Result:** If any job fails, the Pull Request "Merge" button is disabled.

**Developer Responsibility:**
If the CI fails, do not ask for an override. Check the "Actions" tab in GitHub, read the error logs, reproduce the issue locally, fix it, and push again.

---

### Expo Application Services (EAS) Builds

We use **EAS Build** (Expo Application Services) to generate our native binaries (Android `.apk`/`.aab` and iOS `.ipa`). This ensures that the build environment is consistent and not dependent on a specific developer's laptop configuration.

**Build Profiles (`eas.json`):**
We have three distinct build environments configured:

1. **Development (`development`):**
   * **Purpose:** For local development with native code.
   * **Command:** `eas build --profile development --platform android`
   * **Result:** A custom "Expo Go" client that includes our specific native modules (Google Sign-In, Firebase).

2. **Preview (`preview`):**
   * **Purpose:** Internal testing by Temple Coordinators and QA.
   * **Command:** `eas build --profile preview --platform all`
   * **Result:** A distinct app installable alongside the production app. Connects to the **Staging** backend.

3. **Production (`production`):**
   * **Purpose:** Public release to App Store & Play Store.
   * **Command:** `eas build --profile production --platform all`
   * **Result:** Optimized, signed, and minified binaries ready for store submission. Connects to **Production** backend.

---

### Over-The-Air (OTA) Updates via EAS Update
One of our most powerful tools is **EAS Update**. This allows us to fix critical JavaScript bugs instantly without waiting for the 24-48 hour Apple/Google review process—vital during multi-day festivals.

**How it Works:**
If we find a typo or a logic bug in the JS bundle (e.g., a wrong date on the Ratha Yatra schedule), we can push a fix immediately.
```bash
eas update --branch production --message "Fix: Corrected festival start time"
```

### The Safety Rules (Critical):
* **JS Only:** You can only OTA update JavaScript, assets (images/fonts), and styling.
* **No Native Changes:** If you add a new Native Library (e.g., changing package.json to add a camera SDK), you cannot use OTA. You must run a full eas build and submit a new binary to the stores.
* **Semantic Versioning:** We strictly link updates to the native runtime version in app.json. An update targeting runtimeVersion: 1.0.0 will never accidentally download to an app running runtimeVersion: 2.0.0, preventing startup crashes.