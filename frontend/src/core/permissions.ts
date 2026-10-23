import { User } from "@/src/types"; // Adjust import path if needed

/**
 * Checks if the current user has the required permission.
 * Automatically grants access if the user is a superadmin.
 * @param user
 * @param requiredPermission
 */
export function hasPermission(
  user: User | null | undefined,
  requiredPermission: string,
): boolean {
  if (!user) return false;

  if (user.role === "superadmin") {
    return true;
  }

  // Fallback to checking the explicit permissions array for standard users
  return (
    Array.isArray(user.permissions) &&
    user.permissions.includes(requiredPermission)
  );
}
