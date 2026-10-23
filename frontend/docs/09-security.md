# 9. Security, Privacy & Data Compliance

> **"Trust is the currency of community. We must protect it at all costs."**

In VolStory, we are not just handling "users"; we are serving a congregation. We manage sensitive data including personal schedules, contact details, and sometimes donation records. Security breaches in this context damage the reputation of the temple and the trust of the devotees.

Security is not a feature; it is a foundational requirement.

### Handling Volunteer Data & PII

**1. Data Minimization:**
We collect only what is absolutely necessary for *Seva*.
* *Bad:* Collecting a user's home address, date of birth, and government ID when they just want to wash pots in the kitchen.
* *Good:* Collecting only `displayName`, `phoneNumber` (for coordination), and `servicePreferences`.
* **Rule:** If a field is "nice to have" but not "critical for operations," do not store it.

**2. Encryption & Storage:**
* **At Rest:** All data stored in our backend (Firestore/PostgreSQL) is encrypted at rest.
* **In Transit:** All API communication MUST use TLS 1.2+ (HTTPS). Plain HTTP requests will be rejected by the server.
* **Local Device:** Never store sensitive data (like Auth Tokens or PII) in `AsyncStorage` or unencrypted file systems.
  * **Use:** `expo-secure-store` for small secrets (Tokens, Refresh Tokens).
  * **Use:** `react-native-mmkv` (with encryption key) for larger cached datasets if they contain PII.

**3. Role-Based Access Control (RBAC):**
Access to data is strictly segmented by role.
* **Devotee:** Can only see their own schedule and public events.
* **Department Lead:** Can see volunteers within their specific department (e.g., Kitchen Lead sees Kitchen Volunteers).
* **Temple Admin:** Has broad access but is logged audit-style.
* **Implementation:** We enforce these rules via **Firebase Security Rules** and Backend Middleware. *Never trust the client to filter data.*

---

### Authentication Flows (Google & Firebase OTP)



We utilize a dual-strategy authentication system to balance ease of use with security.

**1. Primary Method: Phone Authentication (OTP)**
Most devotees in India and verified community members rely on phone numbers as their primary identity.
* **Provider:** Firebase Phone Auth.
* **Flow:**
  1. User enters phone number.
  2. Firebase sends a 6-digit SMS code.
  3. App auto-verifies the code (on Android) or asks for manual entry.
  4. On success, Firebase issues a `UserCredential`.

**2. Secondary Method: Google Sign-In (OAuth)**
For convenient access, especially for students and admins.
* **Provider:** Google Identity Services (via `@react-native-google-signin/google-signin`).
* **Critical:** We do *not* use the legacy web-view based Google Auth. We use the native SDK to ensure a secure, phishing-resistant flow.
* **Mapping:** If a user signs in with Google, we may still require a Phone Number verification step to link their account to the temple's volunteer database.

**3. Token Management:**
* **Access Tokens:** Short-lived (1 hour). Stored in memory (Zustand).
* **Refresh Tokens:** Long-lived. Stored securely in `expo-secure-store`.
* **Token Rotation:** The app silently refreshes the access token in the background using Axios interceptors. If the refresh fails, the user is immediately logged out and redirected to the login screen.

```ts
// Example: Secure Token Storage Implementation
import * as SecureStore from 'expo-secure-store';

export async function saveAuthToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK, // iOS Security Level
  });
}
```