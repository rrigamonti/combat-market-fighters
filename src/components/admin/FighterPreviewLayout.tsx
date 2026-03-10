import { ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard, Target, ExternalLink, LogOut, ArrowLeft, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logo from "@/assets/combat-market-logo.svg";

interface FighterPreviewLayoutProps {
  children: ReactNode;
  fighterName: string;
  fighterHandle: string | null;
  fighterProfileImage: string | null;
}

export function FighterPreviewLayout({
  children,
  fighterName,
  fighterHandle,
  fighterProfileImage,
}: FighterPreviewLayoutProps) {
  const location = useLocation();
  const { fighterId } = useParams<{ fighterId: string }>();

  const basePath = `/admin/fighters/${fighterId}/preview`;

  const navItems = [
    { to: basePath, label: "Dashboard", icon: LayoutDashboard },
    { to: `${basePath}/missions`, label: "Missions", icon: Target },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Combat Market" className="h-8 w-auto" />
          </Link>
        </div>

        {/* Admin preview banner */}
        <div className="mx-3 mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 text-primary">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Preview Mode</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            Viewing as <strong>{fighterName}</strong>
          </p>
        </div>

        {/* Fighter identity */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border mt-2">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary bg-muted shrink-0">
            {fighterProfileImage ? (
              <img src={fighterProfileImage} alt={fighterName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-display text-primary">
                {fighterName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fighterName}</p>
            {fighterHandle && (
              <p className="text-xs text-muted-foreground truncate">/{fighterHandle}</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Storefront link */}
          {fighterHandle && (
            <a
              href={`/${fighterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              View Storefront
            </a>
          )}
        </nav>

        {/* Footer — Back to admin */}
        <div className="border-t border-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/admin/fighters">
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
