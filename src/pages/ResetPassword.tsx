import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import logo from "@/assets/combat-market-logo.svg";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = resetSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: result.error.errors[0].message,
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });
    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Password Updated",
      description: "Your password has been reset successfully.",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Reset Password" description="Set a new password for your Combat Market account." noindex />
      <Navbar />

      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src={logo} alt="Combat Market" className="mx-auto h-12" />
            <h1 className="mt-6 font-display text-3xl uppercase leading-none tracking-normal text-white sm:text-4xl">
              Reset Password
            </h1>
            <p className="mt-2 text-muted-foreground">
              {sessionReady
                ? "Enter your new password below"
                : "Waiting for verification..."}
            </p>
          </div>

          {sessionReady ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  minLength={8}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Set New Password"}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              If you arrived here from a password reset email, please wait a
              moment while we verify your session.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
