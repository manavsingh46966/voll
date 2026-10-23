# 🤝 Contributing to VolStory

> **"Seva (Service) in Code."**

First off, thank you for considering contributing to VolStory! You are helping build the digital infrastructure for the ISKCON community.

This repository is massive and follows strict enterprise standards. To keep things organized, our documentation is split into focused guides. **Please read the relevant section below before opening a Pull Request.**

## 📚 Documentation Index

### 🚀 Getting Started
* **[1. Project Vision & Mission](./docs/01-vision.md)** *Read this to understand *why* we are building this platform and the spiritual values driving our engineering.*
* **[2. Engineering Culture](./docs/02-culture.md)** *Our core principles: Ego-free reviews, Offline-First resilience, and Extreme Empathy for the devotee.*
* **[3. Local Environment Setup](./docs/03-setup.md)** *Step-by-step guide to installing Node.js, Expo Go, and configuring your `.env` secrets.*

### 🏗 Architecture & Code
* **[4. Domain-Driven Architecture](./docs/04-architecture.md)** *How we organize code by feature (Auth, Seva, Events) instead of file type.*
* **[5. Development Workflow](./docs/05-workflow.md)** *Git Flow, Branching Strategy, and Conventional Commits.*
* **[6. Coding Standards](./docs/06-standards.md)** *TypeScript strictness, React Native best practices, and Error Boundaries.*
* **[7. State Management Matrix](./docs/07-state-management.md)** *When to use TanStack Query (Server) vs. Zustand (Global) vs. useState (Local).*

### 🎨 Design & Quality
* **[8. UI/UX & Design Handoff](./docs/08-ui-ux.md)** *Figma sync, NativeWind utility classes, Lottie animations, and Accessibility (a11y).*
* **[9. Security & Privacy](./docs/09-security.md)** *Handling Volunteer PII, Firebase Auth flows, and data compliance.*
* **[10. Testing Strategy](./docs/10-testing.md)** *Our ROI-driven testing approach. Unit tests (Jest) and Critical Path integration tests.*

### 🚢 Release & Review
* **[11. CI/CD Pipeline](./docs/11-cicd.md)** *How GitHub Actions, EAS Build, and OTA Updates work.*
* **[12. Pull Request Process](./docs/12-pull-requests.md)** *The mandatory checklist, PR templates, and code review SLAs.*

---

## ⚡ Quick Start (TL;DR)

1.  **Clone & Install:**
    ```bash
    git clone [https://github.com/YOUR_ORG/volstory.git](https://github.com/YOUR_ORG/volstory.git)
    npm install
    ```
2.  **Setup Secrets:**
    ```bash
    cp .env.example .env
    # Ask Tech Lead for keys
    ```
3.  **Run the App:**
    ```bash
    npx expo start
    ```
4.  **Create a Branch:**
    ```bash
    git checkout -b feat/VOL-123-feature-name
    ```
5.  **Commit:**
    ```bash
    git commit -m "feat(auth): add google login"
    ```

**Need Help?** Reach out in the `#dev-volstory` channel on Discord or tag the `@TechLead` in your Pull Request.
