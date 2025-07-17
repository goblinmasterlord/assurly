import { Link, Outlet } from "react-router-dom";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { ClipboardList, LogIn } from "lucide-react";
import { TopLoader } from "@/components/ui/top-loader";
import { KeyboardHint } from "@/components/ui/keyboard-hint";

export function RootLayout() {
  const { role } = useUser();
  
  return (
    <div className="relative flex min-h-screen flex-col">
      <TopLoader />
      <KeyboardHint />
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
      <footer className="border-t py-6 md:py-0 bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 Assurly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 