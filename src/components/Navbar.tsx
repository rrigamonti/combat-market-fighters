import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/combat-market-logo.svg";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Combat Market" className="h-8" />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Home
          </Link>
          <Link to="/#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </Link>
          <Link to="/#for-fighters" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            For Fighters
          </Link>
          <Link to="/#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            FAQ
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Button variant="ghost" onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Login
              </Link>
              <Button asChild className="glow-primary">
                <Link to="/fighter-signup">Apply as a Fighter</Link>
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
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  Home
                </Link>
                <Link 
                  to="/#features" 
                  onClick={closeMobileMenu}
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  Features
                </Link>
                <Link 
                  to="/#for-fighters" 
                  onClick={closeMobileMenu}
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  For Fighters
                </Link>
                <Link 
                  to="/#faq" 
                  onClick={closeMobileMenu}
                  className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                >
                  FAQ
                </Link>
                
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={closeMobileMenu}
                      className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Dashboard
                    </Link>
                    <Button 
                      variant="ghost" 
                      onClick={() => { handleSignOut(); closeMobileMenu(); }}
                      className="justify-start px-0 text-lg font-medium"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      onClick={closeMobileMenu}
                      className="text-lg font-medium text-foreground transition-colors hover:text-primary"
                    >
                      Login
                    </Link>
                    <Button asChild className="glow-primary mt-4">
                      <Link to="/fighter-signup" onClick={closeMobileMenu}>
                        Apply as a Fighter
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
