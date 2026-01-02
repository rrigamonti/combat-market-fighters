import { forwardRef } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/combat-market-logo.svg";

export const Footer = forwardRef<HTMLElement>((props, ref) => {
  return (
    <footer ref={ref} className="border-t border-border bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Combat Market" className="h-6 opacity-60" />
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Combat Market. All rights reserved.
          </p>
          <p className="mt-2">
            Affiliate Disclosure: Combat Market earns a commission from qualifying purchases made through product links on fighter storefronts.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
