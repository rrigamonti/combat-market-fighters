import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { PageMeta } from "@/components/PageMeta";
import logo from "@/assets/combat-market-logo.svg";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: result.error.errors[0].message,
      });
      return;
    }

    setLoading(true);
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
      });
      return;
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: authData.user.id,
      _role: "admin",
    });

    setLoading(false);

    toast({
      title: "Welcome back!",
      description: "You have successfully logged in.",
    });
    
    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Login" description="Sign in to your Combat Market fighter dashboard to manage your storefront and track earnings." noindex />
      <Navbar />
      
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <img src={logo} alt="Combat Market" className="mx-auto h-12" />
            <h1 className="mt-6 font-display text-4xl">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your fighter dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="fighter@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/fighter-signup" className="text-primary hover:underline">
              Apply as a Fighter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
