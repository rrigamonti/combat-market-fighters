import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface MerchantRouteProps {
  children: ReactNode;
}

export function MerchantRoute({ children }: MerchantRouteProps) {
  const { user, isMerchant, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admins can also access merchant routes
  if (!isMerchant && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <h1 className="font-display text-4xl text-primary">Access Denied</h1>
        <p className="mt-4 text-muted-foreground">You don't have permission to access this area.</p>
      </div>
    );
  }

  return <>{children}</>;
}
