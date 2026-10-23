/**
 *
 */
export default function CreateScreen() {
  // This screen is never actually rendered because the 'create' tab is intercepted
  // by a tabPress listener in _layout.tsx which prevents default navigation
  // and instead opens the CreateBottomSheet.
  return null;
}
