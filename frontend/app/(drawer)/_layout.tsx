import React from "react";
import { Drawer } from "expo-router/drawer";

import { colors, fonts } from "@/constants/theme";
import CustomSidebar from "@/src/components/customDrawer/CustomSidebar";
import { TabIcon } from "@/src/components/icons/TabIcon";
import { CustomHeader } from "@/src/components/navigation/CustomHeader";

/**
 * **Main Drawer Navigation Layout (`(drawer)/_layout.tsx`)**
 *
 * This component acts as the Root Navigator for the authenticated application structure.
 * It wraps the Tab Navigator and other standalone screens (like Settings) within a
 * side-menu drawer interface.
 *
 * **Key Features:**
 * - **Custom Sidebar:** Renders a bespoke `CustomSidebar` component instead of the default list.
 * - **Navigation Hierarchy:**
 * - `(tabs)`: The main application flow (Home, Profile, etc.).
 * - `settings`: A standalone screen accessible via the drawer.
 * - **Styling:** Configures the drawer's width, fonts (Nunito-Bold), and active/inactive color states.
 *
 * @component
 * @example
 * // This layout is automatically mounted by Expo Router
 * // It is typically the parent of the (tabs) folder.
 *
 * @returns {JSX.Element} The configured Drawer Navigator.
 */
const DrawerLayout = () => {
  return (
    <Drawer
      // 1. Use our Custom Sidebar
      drawerContent={(props) => <CustomSidebar {...props} />}
      screenOptions={{
        headerShown: false, // We hide the default drawer header because Tabs have their own
        drawerStyle: {
          backgroundColor: colors.surface.DEFAULT,
          width: 280,
        },
        drawerActiveTintColor: colors.primary.DEFAULT,
        drawerInactiveTintColor: colors.neutral.light,
        drawerLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 16,
        },
      }}
    >
      {/* 2. MAIN APP (The Tabs) */}
      <Drawer.Screen
        name="(tabs)" // This points to the moved (tabs) folder
        options={{
          drawerLabel: "Home",
          title: "Home",
          drawerIcon: ({ color }) => (
            <TabIcon name="home" size={22} color={color} />
          ),
        }}
      />

      {/* 3. SETTINGS SCREEN */}
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          headerShown: true, // Show header for Settings page
          header: () => <CustomHeader />, // Reuse our custom header
          drawerIcon: ({ color }) => (
            <TabIcon name="settings" size={22} color={color} />
          ),
        }}
      />

      {/* 4. ADMIN SCREEN */}
      <Drawer.Screen
        name="admin"
        options={{
          drawerLabel: "Admin Approval",
          headerShown: false,
          drawerIcon: ({ color }) => (
            <TabIcon name="shield" size={22} color={color} />
          ),
        }}
      />

      {/* 5. EVENT DETAIL — hidden from drawer sidebar (new_vol rich event detail) */}
      <Drawer.Screen
        name="event"
        options={{
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
