# Auth Feature

## Overview
Handles user onboarding via a **Google-First** flow. 
We strictly avoid separate login/signup paths. The system intelligently detects if the user is new or returning.

## The "New Approach" Flow
1.  **Google Sign-In:** User clicks the Google button.
    * *Existing User:* Logs in -> Redirects to Home.
    * *New User:* Redirects to Phone Verification.
2.  **Phone Verification:** User verifies mobile number via OTP.
3.  **Registration:** User completes profile (Name, City, etc.). Email & Phone are pre-filled and locked.

## Project Structure
- `api/`: wrappers for `axios` calls (Login, OTP, Register).
- `hooks/`: `useGoogleAuth` (Login Logic), `usePhoneAuth` (OTP Logic).
- `components/`: UI parts for the Registration form (broken down to keep files small).

## Key State
- **Session:** Managed by `src/core/auth/store.ts`.
- **Temp Data:** Signup flow data (Google info + Phone) is held in the store until registration is complete.