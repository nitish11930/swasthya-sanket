import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import SettingsProvider from "./SettingsProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <SettingsProvider />
      {/* Desktop Sidebar (hidden on mobile) */}
      <SideNav />

      {/* Main Content Column */}
      <main className="main-area">
        {/* Mobile Header (hidden on desktop) */}
        <AppHeader />

        {/* Page Content */}
        {children}
      </main>

      {/* Mobile Bottom Nav (hidden on desktop) */}
      <BottomNav />
    </div>
  );
}
