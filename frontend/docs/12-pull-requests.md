# 12. Pull Request & Code Review Process

> **"Code review is our highest form of collaboration. It is where we share knowledge, catch bugs, and uphold our standards."**

The Pull Request (PR) is the final gate before code reaches our shared codebase. It is not just a mechanism for merging; it is a mechanism for *teaching* and *ensuring quality*. We do not merge code just because it "works." We merge code because it is maintainable, readable, and compliant with our architectural vision.

### The PR Template & Developer Checklist

We have configured a default Pull Request Template in `.github/pull_request_template.md`. When you open a PR, this template will automatically populate the description field. You **must** fill it out. A blank PR description is grounds for immediate closure.

**The Mandatory Developer Checklist:**
Before marking your PR as "Ready for Review," you must self-certify the following:

1.  **Linked Ticket:** The PR description includes the Jira/Linear ticket number (e.g., `Closes VOL-123`).
2.  **Self-Review:** You have read through your own "Files Changed" tab on GitHub. You have removed all `console.log`, commented-out code, and temporary TODOs.
3.  **Device Testing:**
    * [ ] Tested on iOS Simulator/Device.
    * [ ] Tested on Android Emulator/Device.
    * [ ] Tested Offline (Airplane Mode) for graceful failure.
4.  **Visual Proof:** For UI changes, you have attached **Screenshots** (Light/Dark mode) or a **Screen Recording** demonstrating the interaction.
5.  **Tests:** You have added or updated Unit Tests for any new business logic.
6.  **No Typos:** You have spell-checked your variable names and user-facing text.

### Reviewer Expectations & Approval SLA

Code review is a service we perform for each other. It requires empathy and rigor.

**Service Level Agreement (SLA):**
* **Response Time:** We aim to review all PRs within **24 hours** (excluding Sundays/Festival days).
* **Staleness:** If a PR has no activity for 7 days, it will be automatically tagged as `stale`.

**Reviewer Responsibilities:**
1.  **Be Constructive:** Never say "This is bad." Say, "This approach might cause performance issues on older Android devices because of X. Have you considered using Y?"
2.  **Distinguish "Blocking" vs. "Nitpick":**
    * **Blocking:** Security risks, logic bugs, architectural violations, or missing tests. (Use "Request Changes").
    * **Nitpick:** Variable naming preferences, minor styling suggestions. (Use "Approve" with comments).
3.  **Verify Logic:** Do not just look at the code style. Trace the logic. Ask yourself: "What happens if this network request fails? What happens if the user double-taps this button?"

**The Approval Threshold:**
* **Merge Requirement:** All PRs require **at least 1 approval** from a core maintainer (Tech Lead or Senior Dev).
* **CI Status:** You cannot merge if the GitHub Actions pipeline (Lint/Test/Build) is failing.