# 7. State Management Matrix

> **"State is the root of all complexity. Isolate it, cache it, and derive it."**

In a mobile application serving thousands of devotees, mismanaged state leads to race conditions, phantom UI bugs, and data loss during weak network connectivity. VolStory employs a strict **State Management Matrix**. You must categorize your data before you write a single line of stateful code.

Do not put server responses into global UI stores. Do not put local form inputs into global UI stores. Follow this matrix strictly.

### Server State (TanStack Query)

**Definition:** Any data that lives on our backend databases (e.g., Firebase, PostgreSQL) and requires an asynchronous API call to fetch or update.
**Tool:** `TanStack Query` (formerly React Query)

If you are fetching a list of upcoming Seva shifts, reading a user's donation history, or downloading the Ratha Yatra festival schedule, it **must** be managed by TanStack Query. 

* **The Ban on `useEffect` for Fetching:** You are strictly forbidden from using `useEffect` combined with `useState` to fetch data. This pattern lacks caching, retry logic, and background synchronization.
* **Offline-First Resilience:** We configure Query Clients with aggressive caching. If a devotee opens the app in the temple basement (zero reception), TanStack Query will instantly serve the cached Seva schedule from local storage while silently attempting a background fetch.
* **Optimistic Updates:** When a volunteer taps "Sign up for Kitchen Seva", the UI must reflect the success instantly. Use TanStack Query's `onMutate` to artificially update the cache before the network request finishes. If the request fails, roll back the cache automatically.

```ts
// Good: Declarative, cached, and resilient server state
import { useQuery } from '@tanstack/react-query';
import { fetchSevaShifts } from '../api/seva.api';

export const useSevaShifts = (festivalId: string) => {
  return useQuery({
    queryKey: ['seva-shifts', festivalId],
    queryFn: () => fetchSevaShifts(festivalId),
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
  });
};
```

### Global Client State (Zustand)

**Definition:** Synchronous data that strictly lives on the user's device and must be accessed by multiple, disconnected components across different feature domains.
* **Tool:** Zustand

Zustand is our lightweight alternative to Redux. It is used exclusively for global UI and application states.

* **Acceptable Use Cases:**
    * Authentication session status (e.g., userToken, isGuest).
    * Global UI flags (e.g., isBarcodeScannerActive, hasSeenOnboarding).
    * Device preferences (e.g., theme: 'dark' | 'light', language: 'en' | 'hi' | 'mr').
* **Store Modularity:** Do not create one massive store. Create small, domain-specific stores (e.g., useAuthStore, usePreferenceStore).
* **Persistence:** Use Zustand's persist middleware backed by react-native-mmkv or expo-secure-store to ensure the devotee doesn't have to log in every time they open the app.

```ts
// Good: A highly focused, persistent global store
import { create } from 'zustand';

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
  logout: () => set({ token: null }),
}));
```

### Local Component & Derived State

**Definition:** Transient state that only matters to a single component or its immediate children.

**Tools:** useState, useReducer, useMemo

If a piece of state does not need to be shared across the app, or if it doesn't come from the server, keep it as close to where it is used as possible.

* **React useState:** Use this for ephemeral UI states.
    * Example: Toggling an accordion open/closed on the Festival FAQ screen.
    * Example: Capturing the text input inside a search bar before submission.
* **Derived State (useMemo):** Do not duplicate state if it can be calculated on the fly.
    * Bad: Storing both volunteers and activeVolunteers in state.
    * Good: Storing volunteers in state, and deriving const activeVolunteers = useMemo(() => volunteers.filter(v => v.isActive), [volunteers]).
* **Complex Local State (useReducer):** If a single component has multiple intersecting booleans (e.g., a complex donation form with multiple steps, validation states, and payment methods), upgrade from useState to useReducer to consolidate the logic.