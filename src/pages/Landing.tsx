import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, TrendingUp, Check, ChevronRight } from "lucide-react";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { useAuth } from "@/contexts/AuthContext";
import { PageMeta } from "@/components/PageMeta";
import PhotoGrid from "@/components/landing/PhotoGrid";
import heroImage from "@/assets/landing/hero-fighter-silhouette.jpg";
import glovesImage from "@/assets/landing/gloves-product.jpg";
import equipmentImage from "@/assets/landing/equipment-flatlay.jpg";

const Landing = () => {
  useScrollToHash();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta description="Turn your fight gear into income. Claim your personal Combat Market storefront and earn from the brands you already use." />
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Fighter silhouette"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-5xl uppercase leading-tight tracking-wide md:text-7xl lg:text-8xl">
            Turn Your Fight Gear Into{" "}
            <span className="text-gradient">Income</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Claim your personal Combat Market storefront and earn from the brands you already use.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground/80">
            No sponsors. No gatekeepers. Just fighters getting paid.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            <Button asChild size="lg" className="glow-primary text-lg">
              <Link to="/fighter-signup">Claim Your Storefront</Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Invite-only fighter onboarding now open.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl uppercase tracking-wide text-foreground md:text-3xl">
            Built for fighters, coaches, and combat athletes worldwide
          </h2>
          <p className="mt-4 text-sm uppercase tracking-widest text-muted-foreground md:text-base">
            MMA • Boxing • Muay Thai • BJJ • Wrestling • Functional Fitness
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-4xl uppercase tracking-wide md:text-5xl">How It Works</h2>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={glovesImage}
                  alt="Premium combat gloves"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-2xl">1. Claim Your Storefront</h3>
                <p className="mt-3 text-muted-foreground">
                  Your own page on Combat Market, under your name. This becomes your personal hub for the gear you trust.
                </p>
                <p className="mt-3 text-sm text-muted-foreground/80">
                  Simple setup. No tech. No cost.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={equipmentImage}
                  alt="Combat training equipment"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-2xl">2. Add the Brands You Use</h3>
                <p className="mt-3 text-muted-foreground">
                  Gloves, tape, supplements, recovery, apparel. If you already use it, you can earn from it.
                </p>
                <p className="mt-3 text-sm text-muted-foreground/80">
                  We handle tracking and payouts.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <TrendingUp className="h-16 w-16 text-primary/50" />
              </div>
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-2xl">3. Share & Earn – For Life</h3>
                <p className="mt-3 text-muted-foreground">
                  Share your storefront. Earn commissions every time someone buys. Invite other fighters. Earn from their sales too.
                </p>
                <p className="mt-3 text-sm text-muted-foreground/80">
                  This isn't a one-off post. It's lifetime income.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Grid */}
      <PhotoGrid />

      {/* Why Combat Market Exists */}
      <section id="for-fighters" className="border-t border-border bg-card py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-4xl uppercase tracking-wide md:text-5xl">Built for Fighters, Not Advertisers</h2>
          <div className="mt-8 space-y-4 text-lg text-muted-foreground">
            <p>Most fighters train harder than anyone.</p>
            <p>Most brands profit more than fighters do.</p>
            <p className="text-foreground font-medium">Combat Market changes that.</p>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-muted-foreground">
            We're building the world's first fighter-powered commerce platform, where fighters earn from the products they already believe in and the networks they already have.
          </p>
          <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
            <p>No chasing sponsors.</p>
            <p>No fake discount codes.</p>
            <p>No begging for deals.</p>
            <p className="mt-4 text-lg font-semibold text-foreground">Just fighters owning the upside.</p>
          </div>
        </div>
      </section>

      {/* What Makes Combat Market Different */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-4xl uppercase tracking-wide md:text-5xl">More Than Affiliate Links</h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">Earn from your own sales</p>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">Earn from fighters you invite</p>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">Earn as your network grows</p>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium">Get paid for the long term</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">This is how real ecosystems work.</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Value compounds. Ownership matters.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-4xl uppercase tracking-wide md:text-5xl">FAQ</h2>

          <div className="mt-12 space-y-6">
            <div className="rounded-lg border border-border bg-background p-6">
              <h4 className="font-semibold">Is this free?</h4>
              <p className="mt-2 text-muted-foreground">
                Yes. Claiming a storefront is free for fighters.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h4 className="font-semibold">Do I need sponsors or a big following?</h4>
              <p className="mt-2 text-muted-foreground">
                No. You earn from what you already use and share.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h4 className="font-semibold">Who can join?</h4>
              <p className="mt-2 text-muted-foreground">
                Fighters, coaches, and combat athletes at any level.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h4 className="font-semibold">How do payouts work?</h4>
              <p className="mt-2 text-muted-foreground">
                Sales are tracked automatically and paid out directly.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <h4 className="font-semibold">When will fans be able to browse fighters?</h4>
              <p className="mt-2 text-muted-foreground">
                The public fighter directory will be added as the platform expands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl uppercase tracking-wide md:text-5xl">Don't Promote Brands. Build Income.</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Claim your Combat Market storefront and start earning from your fight life.
          </p>
          <Button asChild size="lg" className="mt-8 glow-primary text-lg">
            <Link to="/fighter-signup">Claim Your Storefront</Link>
          </Button>
        </div>
      </section>

      <Footer />

      {/* Sticky Mobile CTA - only show when not logged in */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-4 md:hidden">
          <Button asChild size="lg" className="w-full glow-primary">
            <Link to="/fighter-signup" className="flex items-center justify-center gap-2">
              Claim Your Storefront
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Landing;
