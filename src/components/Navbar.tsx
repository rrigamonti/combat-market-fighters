import { forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/combat-market-logo.svg";

export const Navbar = forwardRef<HTMLElement>((props, ref) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Combat Market" className="h-8" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
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

        {/* Mobile menu button */}
        <div className="flex items-center gap-4 md:hidden">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Logout
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/fighter-signup">Apply</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";
