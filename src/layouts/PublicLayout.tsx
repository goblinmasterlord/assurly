import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoSvg from "@/assets/assurly_rgb.svg";

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logoSvg} alt="Assurly" className="h-8" />
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/mission" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Our Mission
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link to="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/login">Get Started</Link>
            </Button>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container flex flex-col space-y-3 py-4">
              <Link 
                to="/about" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/mission" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Our Mission
              </Link>
              <Link 
                to="/pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                to="/security" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Security
              </Link>
            </nav>
          </div>
        )}
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="border-t py-12 bg-slate-50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/mission" className="hover:text-foreground transition-colors">Our Mission</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Security</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link to="/dpa" className="hover:text-foreground transition-colors">DPA</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/dpa" className="hover:text-foreground transition-colors">Data Processing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/mission" className="hover:text-foreground transition-colors">Mission</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © 2025 Assurly. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/dpa" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

