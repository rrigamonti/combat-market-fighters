import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/combat-market-logo.svg";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Combat Market" className="h-8" />
        </Link>

        {/* Desktop navigation - Center */}
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
            Home
          </Link>
          <Link to="/#features" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
            Features
          </Link>
          <Link to="/marketplace" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
            Marketplace
          </Link>
          <Link to="/#faq" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
            FAQs
          </Link>
          <Link to="/#for-fighters" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
            For Fighters
          </Link>
          
          {user && (
            <>
              <Link to="/dashboard" className="text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-primary transition-colors hover:text-primary/80">
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* CTA Button - Right (Desktop) */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <Button variant="outline-primary" onClick={handleSignOut}>
              Logout
            </Button>
          ) : (
            <>
              <Link to="/login" className="text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary">
                Login
              </Link>
              <Button asChild variant="outline-primary">
                <Link to="/fighter-signup">Claim Your Storefront</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-6 mt-8">
                <Link 
                  to="/" 
                  onClick={closeMobileMenu}
                  className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                >
                  Home
                </Link>
                <Link 
                  to="/#features" 
                  onClick={closeMobileMenu}
                  className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                >
                  Features
                </Link>
                <Link 
                  to="/marketplace" 
                  onClick={closeMobileMenu}
                  className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                >
                  Marketplace
                </Link>
                <Link 
                  to="/#faq" 
                  onClick={closeMobileMenu}
                  className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                >
                  FAQs
                </Link>
                <Link 
                  to="/#for-fighters" 
                  onClick={closeMobileMenu}
                  className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                >
                  For Fighters
                </Link>
                
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={closeMobileMenu}
                      className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={closeMobileMenu}
                        className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                      >
                        <Shield className="h-5 w-5" />
                        Admin Panel
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      onClick={() => { handleSignOut(); closeMobileMenu(); }}
                      className="justify-start px-0 text-sm font-medium uppercase tracking-widest"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      onClick={closeMobileMenu}
                      className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                    >
                      Login
                    </Link>
                    <Button asChild variant="outline-primary" className="mt-4">
                      <Link to="/fighter-signup" onClick={closeMobileMenu}>
                        Claim Your Storefront
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
