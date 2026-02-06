import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface StorefrontGateProps {
  fighterName: string;
  onUnlock: () => void;
  correctPassword: string;
}

export function StorefrontGate({ fighterName, onUnlock, correctPassword }: StorefrontGateProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simple comparison (case-insensitive for user convenience)
    if (password.toUpperCase().trim() === correctPassword.toUpperCase().trim()) {
      toast.success("Access granted!");
      onUnlock();
    } else {
      toast.error("Incorrect password. Please try again.");
      setPassword("");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl uppercase tracking-tight mb-2">
              Protected Storefront
            </h1>
            <p className="text-muted-foreground text-sm">
              {fighterName}'s storefront is currently password protected.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Access Password</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="Enter password"
                className="text-center font-mono text-lg tracking-widest uppercase"
                autoComplete="off"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isSubmitting}
            >
              {isSubmitting ? "Checking..." : "Unlock Storefront"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Contact the fighter if you don't have the password.
          </p>
        </div>
      </div>
    </div>
  );
}
