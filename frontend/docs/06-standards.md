# 6. Coding Standards & Best Practices

> **"Code is read far more often than it is written. Optimize for the reader."**

To build a reliable application for temple operations, our codebase must be highly predictable. We enforce strict coding standards not to limit creativity, but to eliminate entire classes of bugs before the app ever reaches a volunteer's device.

### TypeScript Strictness & Type Definitions

We treat TypeScript as our first line of defense. The compiler is your pair programmer; do not bypass it. We operate with `strict: true` enabled in our `tsconfig.json`.

**1. The Absolute Ban on `any`:**
Using `any` disables type checking and is strictly forbidden. 
* *Bad:* `const handleData = (data: any) => { ... }`
* *Good:* If the shape of incoming data is truly unknown (e.g., a dynamic API response), use `unknown` and explicitly narrow the type using type guards or validation libraries like Zod.
  ```typescript
  // Good: Validating unknown data at the boundary
  import { z } from 'zod';
  
  const UserSchema = z.object({ id: z.string(), name: z.string() });
  const handleData = (data: unknown) => {
    const user = UserSchema.parse(data); // Throws if invalid, otherwise strongly typed
    console.log(user.name);
  };

**2. Interfaces vs. Types:**

Use `type` for React component props, unions, intersections, and simple aliases.

Use `interface` strictly for defining object shapes that may require declaration merging (e.g., extending global Expo Router types).

**3. Explicit Return Types:**

All exported functions, custom hooks, and React components must have explicit return types. This prevents slow compiler inference and accidental type widening.

```ts
// Bad: Relying on inference
export const Header = ({ title }) => <Text>{title}</Text>;

// Good: Explicit definitions
type HeaderProps = { title: string };

export const Header = ({ title }: HeaderProps): React.JSX.Element => {
  return <Text>{title}</Text>;
};
```

### React Native & Expo SDK Guidelines

We strictly adhere to the Expo Managed Workflow (SDK 54+). We do not touch bare iOS or Android native code (/ios or /android folders) unless absolutely required, and even then, we use Expo Config Plugins.

1. Performance First (The 60 FPS Rule): Temple devices range from flagship iPhones to budget Androids. Smooth performance is mandatory.

   - Lists: Never use the standard FlatList or ScrollView for rendering dynamic datasets (like a list of 500 festival attendees). You must use Shopify's FlashList. It recycles views and prevents memory crashes.

   - Animations: Use react-native-reanimated for all animations. It executes on the UI thread. Never use the core Animated API, which bridges over the JS thread and drops frames during heavy operations.

   - Re-renders: Wrap heavy components in React.memo. Use useMemo for expensive calculations (e.g., filtering a volunteer schedule) and useCallback for functions passed to child components.

2. Safe Area & Layouts:
Never hardcode padding for the status bar or iPhone notches. Always use react-native-safe-area-context.

      ```ts
      // Good: Respecting hardware insets
      import { useSafeAreaInsets } from 'react-native-safe-area-context';

      export const ScreenWrapper = ({ children }: { children: React.ReactNode }) => {
      const insets = useSafeAreaInsets();
      return <View style={{ paddingTop: insets.top }}>{children}</View>;
      };
      ```

### Offline-First Resilience & Error Boundaries

During major festivals like Ratha Yatra, temple grounds experience severe cellular congestion. VolStory must remain functional when the network drops.

1. TanStack Query for Caching: All server state must be fetched using TanStack Query.

   - Configure generous staleTime for data that changes infrequently (e.g., Temple location details, general announcements).

   - Implement Optimistic Updates: When a volunteer taps "Accept Shift", instantly update the UI to show success, then execute the API call in the background. If the API fails, TanStack Query will automatically roll back the UI.

2. Persistent Local Storage: For critical global state (like Auth tokens or user preferences), we persist our Zustand stores using secure local storage (e.g., expo-secure-store for sensitive data, or react-native-mmkv for high-speed cache).

3. React Error Boundaries: A white screen is the ultimate failure. Every major feature (and the root app layout) must be wrapped in an Error Boundary.

   - If a component crashes due to malformed data, the Error Boundary catches it and displays a friendly fallback UI (e.g., "Something went wrong loading this schedule.") along with a "Retry" button.

   - Errors caught by the boundary must be silently logged to our crash reporting service (e.g., Sentry) so the engineering team can fix them without the user having to submit a manual bug report.

   ```ts
   // Example of required Error Boundary usage in Expo Router layouts
   import { ErrorBoundary } from 'react-error-boundary';
   import { FallbackUI } from '@/src/components/ui/FallbackUI';

   export default function SevaFeatureLayout() {
      return (
         <ErrorBoundary FallbackComponent={FallbackUI}>
            <Slot /> {/* Expo Router children */}
         </ErrorBoundary>
      );
   }
   ```