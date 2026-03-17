import { Link } from "react-router-dom";
import logo from "@/assets/combat-market-logo.svg";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 sm:gap-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Combat Market" className="h-5 opacity-60 sm:h-6" />
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground sm:gap-6 sm:text-sm">
            <a href="https://wa.me/971557590129" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              wa.me/971557590129
            </a>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-6 text-center text-[10px] text-muted-foreground sm:mt-8 sm:pt-8 sm:text-xs">
          <p>
            © {new Date().getFullYear()} Combat Market. All rights reserved.
          </p>
          <p className="mt-1.5 sm:mt-2">
            Affiliate Disclosure: Combat Market earns a commission from qualifying purchases made through product links on fighter storefronts.
          </p>
        </div>
      </div>
    </footer>
  );
}
