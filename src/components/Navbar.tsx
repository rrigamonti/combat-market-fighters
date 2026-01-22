import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/combat-market-logo.svg";

interface NavbarProps {
  variant?: "default" | "landing";
}

export function Navbar({ variant = "default" }: NavbarProps) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    closeMobileMenu();
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Landing variant navigation items
  const landingNavItems = [
    { label: "HOME", action: () => { closeMobileMenu(); navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
    { label: "FEATURES", action: () => scrollToSection("features") },
    { label: "BRANDS", action: () => scrollToSection("brands") },
    { label: "FAQS", action: () => scrollToSection("faq") },
    { label: "FIGHTER DIRECTORY", href: "/fighter-directory" },
  ];

  // Default variant navigation items
  const defaultNavItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "FAQs", href: "/#faq" },
    { label: "For Fighters", href: "/#for-fighters" },
  ];

  const navItems = variant === "landing" ? landingNavItems : defaultNavItems;

  const linkClasses = "text-xs font-medium uppercase tracking-widest text-white transition-colors hover:text-primary";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Combat Market" className="h-8" />
        </Link>

        {/* Desktop navigation - Center */}
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            "href" in item && item.href ? (
              <Link 
                key={item.label} 
                to={item.href} 
                className={linkClasses}
              >
                {item.label}
              </Link>
            ) : (
              <button 
                key={item.label} 
                onClick={item.action} 
                className={linkClasses}
              >
                {item.label}
              </button>
            )
          ))}
          
          {user && variant === "default" && (
            <>
              <Link to="/dashboard" className={linkClasses}>
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
            <>
              {variant === "landing" && (
                <Link to="/dashboard" className={linkClasses}>
                  Dashboard
                </Link>
              )}
              {isAdmin && variant === "landing" && (
                <Link to="/admin" className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-primary transition-colors hover:text-primary/80">
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Button variant="outline-primary" onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClasses}>
                {variant === "landing" ? "SIGN IN" : "Login"}
              </Link>
              {variant === "default" && (
                <Button asChild variant="outline-primary">
                  <Link to="/fighter-signup">Claim Your Storefront</Link>
                </Button>
              )}
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
                {navItems.map((item) => (
                  "href" in item && item.href ? (
                    <Link 
                      key={item.label}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className="text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button 
                      key={item.label}
                      onClick={item.action}
                      className="text-left text-sm font-medium uppercase tracking-widest text-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </button>
                  )
                ))}
                
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
                      {variant === "landing" ? "Sign In" : "Login"}
                    </Link>
                    {variant === "default" && (
                      <Button asChild variant="outline-primary" className="mt-4">
                        <Link to="/fighter-signup" onClick={closeMobileMenu}>
                          Claim Your Storefront
                        </Link>
                      </Button>
                    )}
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
