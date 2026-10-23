# 5. Development & Git Workflow

> **"Discipline in our workflow ensures reliability in our service."**

To manage a codebase that supports critical temple operations, we operate with a highly structured, enterprise-grade Git workflow. Predictability is our primary metric for success. No code is written, committed, or merged without following this exact lifecycle.

### Task Tracking & Ticket Lifecycles

Every code change must trace back to a documented requirement. We use an Agile board (Jira/Linear) to track all work. **If there is no ticket, you do not write code.**

**The Ticket Lifecycle:**
1. **Backlog / Triage:** The product team and temple administration propose features or report bugs.
2. **To Do (Ready for Dev):** The Tech Lead has refined the ticket. It now contains:
   * **Context:** *Why* this is needed for the congregation or management.
   * **Acceptance Criteria (AC):** A strict checklist of what defines "Done."
   * **Figma Reference:** A link to the approved UI/UX design.
3. **In Progress:** A developer assigns the ticket to themselves and creates a local branch.
4. **In Review:** The PR is open, and automated CI checks are running.
5. **QA / Staging:** The PR is merged into `develop` and deployed to the Expo Staging environment for real-world testing by coordinators.
6. **Done:** The code is merged into `main` and released to the App Store/Play Store.

---

### Branching Strategy & Protected Environments



We utilize a structured Git Flow model to protect our production environment. Direct commits to `main` or `develop` are cryptographically blocked by GitHub branch protection rules.

**Protected Branches:**
* 🔒 `main`: The Production branch. This mirrors exactly what is on the App Store and Google Play. It is only updated via vetted Release PRs from `develop`.
* 🚧 `develop`: The Integration/Staging branch. All feature branches merge here first. This branch must always be in a deployable state.

**Creating Your Feature Branch:**
Always branch off the latest `develop`. 
```bash
git checkout develop
git pull origin develop
git checkout -b <type>/<ticket-id>-<short-description>
```

### Git Branching & Commit Standards

#### 🌿 Strict Naming Conventions

Use the following branch naming format:

**Feature:** feat/VOL-102-qr-checkin

**Bug Fix:** fix/VOL-204-otp-race-condition

**Refactor:** refactor/VOL-301-auth-store-cleanup

**Chore:** chore/VOL-099-update-expo-sdk


---

# 🧾 Conventional Commits & Husky Guardrails

We enforce **Conventional Commits** to maintain a legible Git history and to power automated semantic versioning and changelog generation.

---

## ✅ Commit Message Format

Every commit message must follow this exact structure:


---

## 🏷 Allowed Types

- `feat` — A new feature for the user  
- `fix` — A bug fix for the user  
- `docs` — Documentation changes only  
- `style` — Formatting, missing semi-colons, etc. (no code logic change)  
- `refactor` — Code rewrite without changing external behavior  
- `perf` — Performance improvements (critical for FlashList/animations)  
- `test` — Adding or correcting tests  
- `chore` — Build tasks, configs, dependency updates  

---

## ⭐ Example of a Perfect Commit
feat(seva): add offline caching for volunteer shifts

Implemented TanStack Query persisted cache so volunteers can view their
assigned kitchen duties even when the temple grounds have poor cellular reception.

Closes VOL-145


---

# 🛡 Husky Guardrails (Automated Enforcement)

To prevent bad code from entering the repository, Husky Git hooks run automatically on your local machine.

---

## 🔍 Pre-commit Hook

**Triggered when:** `git commit` is run

**Action:** lint-staged


**Validation includes:**
- ESLint
- Prettier
- Strict TypeScript type-check (`tsc --noEmit`)
- Only runs on modified files

**Result:** If any lint, type, or formatting error exists → commit is aborted

---

## 🚀 Pre-push Hook

**Triggered when:** `git push` is run

**Action:** Jest Test Suite


**Validation includes:**
- Unit tests
- Integration tests
- Critical paths (Auth, Store logic)

**Result:** If any test fails → push is blocked


---

## ⚠️ Important Policy

Bypassing hooks using the --no-verify is **strictly prohibited** and monitored via GitHub Actions. If you are blocked by a type or test error, contact the team instead of forcing the commit.