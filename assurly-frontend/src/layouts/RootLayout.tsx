import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { ClipboardList, LogIn, BarChart3, FileDown, Users } from "lucide-react";
import { TopLoader } from "@/components/ui/top-loader";
import { KeyboardHint } from "@/components/ui/keyboard-hint";
import { useState, useEffect } from "react";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import logoSvg from "@/assets/assurly_rgb.svg";

export function RootLayout() {
  const { role } = useUser();
  const { user, logout } = useAuth();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true)
  });

  // Redirect Department Heads away from restricted pages
  useEffect(() => {
    if (role === 'department-head' && user) {
      const restrictedPaths = ['/app/analytics', '/app/export', '/app/admin/standards', '/app/admin/users'];
      const isOnRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path));
      
      if (isOnRestrictedPath) {
        console.log('[RootLayout] Department Head accessing restricted path, redirecting to /app/assessments');
        navigate('/app/assessments', { replace: true });
      }
    }
  }, [role, location.pathname, navigate, user]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <TopLoader />
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/app" className="mr-6 flex items-center space-x-2">
              <img src={logoSvg} alt="Assurly" className="h-40 w-auto" />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Button variant="link" size="sm" asChild>
                <Link to="/app/assessments" className="flex items-center">
                  <ClipboardList className="mr-1 h-4 w-4" /> 
                  {role === "mat-admin" ? "All Ratings" : "My Ratings"}
                </Link>
              </Button>
              {role === "mat-admin" && (
                <>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/app/analytics" className="flex items-center">
                      <BarChart3 className="mr-1 h-4 w-4" /> 
                      Analytics
                    </Link>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/app/export" className="flex items-center">
                      <FileDown className="mr-1 h-4 w-4" /> 
                      Export
                    </Link>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/app/admin/standards" className="flex items-center">
                      <ClipboardList className="mr-1 h-4 w-4" />
                      Standards
                    </Link>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/app/admin/users" className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      Users
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Role switcher for development */}
            {user && (
              <div className="hidden md:block">
                <RoleSwitcher />
              </div>
            )}

            {/* Data Management Portal Button */}
            <Button size="sm" asChild>
              <a
                href="https://app.goconfigur.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Data Management Portal</span>
              </a>
            </Button>

            {/* Profile Dropdown - rightmost */}
            {user && <ProfileDropdown />}
          </div>
        </div >
      </header >
      <main className="flex-1 bg-slate-50">
        <Outlet />
      </main>
      <footer className="border-t py-4 md:py-0 bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <KeyboardHint onClick={() => setShowShortcuts(true)} />
          <p className="text-center text-xs leading-loose text-muted-foreground md:text-right">
            © 2025 Assurly. All rights reserved.
          </p>
        </div>
      </footer>
    </div >
  );
} 