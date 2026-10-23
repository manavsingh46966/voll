import React from "react";

import AdminApprovalScreen from "@/src/features/admin/screens/AdminApprovalScreen";

/**
 * **Admin Route (`(drawer)/admin.tsx`)**
 * Delegates to the AdminApprovalScreen from the admin feature.
 *
 * @returns The admin approval screen.
 */
export default function AdminRoute(): React.JSX.Element {
  return <AdminApprovalScreen />;
}
