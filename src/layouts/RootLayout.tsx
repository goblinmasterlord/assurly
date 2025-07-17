import { Link, Outlet } from "react-router-dom";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { ClipboardList, LogIn } from "lucide-react";
import { TopLoader } from "@/components/ui/top-loader";
import { KeyboardHint } from "@/components/ui/keyboard-hint";
import { useState } from "react";
import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function RootLayout() {
  const { role } = useUser();
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onShowShortcuts: () => setShowShortcuts(true)
  });
  
  return (
    <div className="relative flex min-h-screen flex-col">
      <TopLoader />
      <KeyboardShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="text-xl font-bold">Assurly</span>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Button variant="link" size="sm" asChild>
                <Link to="/assessments" className="flex items-center">
                  <ClipboardList className="mr-1 h-4 w-4" /> 
                  {role === "mat-admin" ? "All Ratings" : "My Ratings"}
                </Link>
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <RoleSwitcher />
            <Button size="sm" asChild>
              <a 
                href="https://app.goconfigur.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Data Management Portal
              </a>
            </Button>
          </div>
        </div>
      </header>
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
    </div>
  );
} 