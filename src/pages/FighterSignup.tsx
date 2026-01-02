import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Upload, User } from "lucide-react";
import logo from "@/assets/combat-market-logo.svg";

// Reserved handles that cannot be used by fighters
const RESERVED_HANDLES = [
  "login", "dashboard", "admin", "fighter-signup", "terms", "privacy-policy",
  "api", "about", "contact", "help", "support", "settings", "profile",
  "p", "products", "fighters", "search", "explore"
];

const signupSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  fullName: z.string().min(2, "Full name is required").max(100),
  handle: z.string()
    .min(3, "Handle must be at least 3 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Handle can only contain lowercase letters, numbers, and hyphens")
    .refine((val) => !RESERVED_HANDLES.includes(val), "This handle is reserved"),
  sport: z.string().min(1, "Please select a sport"),
  country: z.string().min(1, "Please select a country"),
  appUsername: z.string().min(2, "App username is required").max(50),
  shortBio: z.string().min(50, "Bio must be at least 50 characters").max(500, "Bio must be 500 characters or less"),
});

const sports = [
  "MMA",
  "Boxing",
  "Muay Thai",
  "Brazilian Jiu-Jitsu",
  "Wrestling",
  "Kickboxing",
  "Karate",
  "Judo",
  "Taekwondo",
];

const countries = [
  "United States",
  "Brazil",
  "United Kingdom",
  "Ireland",
  "Russia",
  "Thailand",
  "Japan",
  "Australia",
  "Canada",
  "Mexico",
  "Netherlands",
  "France",
  "Germany",
  "Poland",
  "Other",
];

export default function FighterSignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    handle: "",
    sport: "",
    country: "",
    appUsername: "",
    shortBio: "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image.",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be less than 5MB.",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate image is uploaded
    if (!imageFile) {
      toast({
        variant: "destructive",
        title: "Profile Picture Required",
        description: "Please upload a profile picture.",
      });
      return;
    }

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: result.error.errors[0].message,
      });
      return;
    }

    setLoading(true);

    // Check if handle is already taken
    const { data: existingHandle } = await supabase
      .from("fighters")
      .select("handle")
      .eq("handle", formData.handle)
      .maybeSingle();

    if (existingHandle) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Handle Taken",
        description: "This handle is already in use. Please choose another.",
      });
      return;
    }

    // Create user account
    const redirectUrl = `${window.location.origin}/`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: authError.message === "User already registered"
          ? "An account with this email already exists. Please login instead."
          : authError.message,
      });
      return;
    }

    if (!authData.user) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: "Something went wrong. Please try again.",
      });
      return;
    }

    // Upload profile image
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `${authData.user.id}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("fighter-avatars")
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Image Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
      });
      return;
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from("fighter-avatars")
      .getPublicUrl(filePath);

    // Add fighter role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: "fighter" });

    if (roleError) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set user role. Please contact support.",
      });
      return;
    }

    // Create fighter profile
    const { error: fighterError } = await supabase
      .from("fighters")
      .insert({
        user_id: authData.user.id,
        handle: formData.handle,
        full_name: formData.fullName,
        sport: formData.sport,
        country: formData.country,
        short_bio: formData.shortBio,
        app_username: formData.appUsername,
        profile_image_url: publicUrlData.publicUrl,
        status: "pending",
      });

    setLoading(false);

    if (fighterError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create fighter profile. Please contact support.",
      });
      return;
    }

    toast({
      title: "Application Submitted!",
      description: "Your fighter application is now pending review.",
    });
    
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <img src={logo} alt="Combat Market" className="mx-auto h-12" />
            <h1 className="mt-6 font-display text-4xl">Apply as a Fighter</h1>
            <p className="mt-2 text-muted-foreground">
              Join Combat Market and start earning from your influence
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Liam 'The Reaper' Johnson"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Handle (URL)</Label>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground mr-1">/</span>
                  <Input
                    id="handle"
                    placeholder="liam-the-reaper"
                    value={formData.handle}
                    onChange={(e) => setFormData({ ...formData, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sport">Sport / Discipline</Label>
                <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appUsername">Combat Market App Username</Label>
              <Input
                id="appUsername"
                placeholder="Your username on the Combat Market app"
                value={formData.appUsername}
                onChange={(e) => setFormData({ ...formData, appUsername: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll use this to verify your subscription
              </p>
            </div>

            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div 
                  className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/50 bg-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortBio">Short Bio</Label>
              <Textarea
                id="shortBio"
                placeholder="Tell fans about your fighting career, achievements, and what drives you..."
                value={formData.shortBio}
                onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.shortBio.length}/500 characters (minimum 50)
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting Application..." : "Submit Application"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
