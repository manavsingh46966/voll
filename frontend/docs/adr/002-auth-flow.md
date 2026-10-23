# 2. Authentication Strategy (Google + Phone)

Date: 2025-12-23
Status: Accepted

## Context
The app requires users to have verified phone numbers, but we want the ease of Google Login. The previous implementation suffered from "Race Conditions" (double-submit bugs) during OTP verification and lacked clear handling for user conflicts (e.g., trying to Sign Up when an account already exists).

## Decision
We implement a **4-Stage Chained Onboarding Flow**:

1.  **Stage 1: Primary Entry (Google Sign-In)**
    * Google is the *only* initial entry point. We explicitly separate `Login` and `Signup` intents at the UI level to guide the user correctly.

2.  **Stage 2: Conflict Resolution (The Decision Matrix)**
    * We query the backend immediately after Google Auth to determine the next step:
    * **Intent: Login + User Exists:** -> **Success** (Login immediately).
    * **Intent: Login + User Not Found:** -> **Error** (Show "Account Not Found" Modal).
    * **Intent: Signup + New User:** -> **Success** (Proceed to Phone Auth).
    * **Intent: Signup + User Exists:** -> **Error** (Show "Account Already Exists" Modal).

3.  **Stage 3: Phone Verification (Robust)**
    * **Race Condition Fix:** We use a synchronous `useRef` lock to prevent double-firing of the OTP API, which previously caused "Invalid Code" errors on slow networks.
    * **Error Handling:** We explicitly catch and swallow the `auth/provider-already-linked` error, treating it as a success state. This ensures users aren't blocked if the API succeeds on a second invisible attempt.

4.  **Stage 4: Registration (Profile Creation)**
    * User cannot create an account until *both* Email (via Google) and Phone (via OTP) are verified.
    * Registration data is held in a transient Client Store (Zustand) until the final submission.

## Consequences
* **Security:** High. We rely on Google for email verification and our own OTP service for phone.
* **UX:** Seamless. Users never see "Error" alerts for invisible background race conditions.
* **Maintenance:** The "Decision Matrix" and "Race Condition" logic are complex and **must** be guarded by Unit Tests (see ADR 003).