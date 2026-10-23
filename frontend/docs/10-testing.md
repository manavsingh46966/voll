# 10. Testing & Quality Assurance

> **"We do not write tests for the sake of coverage. We write tests to sleep at night."**

In a volunteer-driven organization, our software updates must be boring. "Excitement" in production usually means a crash during a festival. To ensure stability without slowing down development, we employ a strict, **ROI-Driven Testing Strategy**.

### ROI-Driven Testing Strategy

We acknowledge that maintaining 100% code coverage on a mobile UI is often a poor use of engineering time. Instead, we focus our testing efforts where the risk is highest.

| Feature Type | Testing Requirement | Rationale |
| :--- | :--- | :--- |
| **Authentication** | 🔴 **Critical (Mandatory)** | If users can't log in, the app is useless. Must cover happy paths, error states, and token refresh logic. |
| **Business Logic** | 🔴 **Critical (Mandatory)** | Complex calculations (e.g., total donation amount, shift hours) must be unit tested. |
| **State Management** | 🟡 **High (Recommended)** | Zustand stores and complex Reducers should be tested to ensure state transitions are predictable. |
| **UI Components** | 🟢 **Low (Optional)** | Simple "dumb" components (Buttons, Cards) do not need tests unless they have complex internal logic. |
| **Pixel Perfection** | ⚪ **Manual** | We rely on design review and manual QA for visual regression, not snapshot tests (which are brittle). |

---

### Unit Testing (Jest) & Mocking Native Modules

We use **Jest** as our test runner. Because we are using React Native (which relies on native iOS/Android code), you **cannot** run standard tests without mocking native modules.

**1. The `jest.setup.ts` File:**
This file is the backbone of our test suite. It mocks libraries like `react-native-reanimated`, `expo-secure-store`, and `@react-native-firebase/auth`. 
* **Rule:** If you add a new library that uses native code, you *must* add a mock to `jest.setup.ts` or the CI pipeline will crash.

**2. Writing a Unit Test:**
Focus on pure functions and hooks.
```ts
// Example: Testing a custom hook
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Integration Testing for Critical Paths
For critical user flows (like "Sign Up" or "Book Shift"), we use **React Native Testing Library (RNTL)**. We test behavior, not implementation details.

**The Golden Rule:**
* **Bad:** expect(component.state.isOpen).toBe(true) (Testing internal state)
* **Good:** expect(screen.getByText('Shift Confirmed')).toBeTruthy() (Testing what the user sees)

**Example: Critical Auth Flow Test**

```ts
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

test('shows error message on failed login', async () => {
  const { getByPlaceholderText, getByText } = render(<LoginScreen />);

  // 1. User types invalid credentials
  fireEvent.changeText(getByPlaceholderText('Email'), 'invalid@iskcon.net');
  fireEvent.press(getByText('Login'));

  // 2. Wait for async error message (Mocked API rejection)
  await waitFor(() => {
    expect(getByText('Invalid credentials')).toBeTruthy();
  });
});
```