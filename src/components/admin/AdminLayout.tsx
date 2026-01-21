import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, LinkIcon, LogOut, ShieldCheck, BarChart3, Tags, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/combat-market-logo.svg";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/fighters", label: "Fighters", icon: Users },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/brands", label: "Brands", icon: Tags },
  { to: "/admin/assignments", label: "Assignments", icon: LinkIcon },
  { to: "/admin/sales", label: "Sales", icon: DollarSign },
  { to: "/admin/commissions", label: "Commissions", icon: Percent },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/users", label: "Admins", icon: ShieldCheck },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Combat Market" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Admin Label */}
          <div className="px-6 py-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Admin Panel
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3">
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
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
