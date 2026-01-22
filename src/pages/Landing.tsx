import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, TrendingUp, Check, ChevronRight } from "lucide-react";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { useAuth } from "@/contexts/AuthContext";
import { PageMeta } from "@/components/PageMeta";
import { OrganizationSchema, FAQSchema, WebSiteSchema } from "@/components/StructuredData";
import PhotoGrid from "@/components/landing/PhotoGrid";
import glovesImage from "@/assets/landing/gloves-product.jpg";
import equipmentImage from "@/assets/landing/equipment-flatlay.jpg";

// FAQ data for schema
const faqItems = [
  { question: "Is this free?", answer: "Yes. Claiming a storefront is free for fighters." },
  { question: "Do I need sponsors or a big following?", answer: "No. You earn from what you already use and share." },
  { question: "Who can join?", answer: "Fighters, coaches, and combat athletes at any level." },
  { question: "How do payouts work?", answer: "Sales are tracked automatically and paid out directly." },
  { question: "When will fans be able to browse fighters?", answer: "The public fighter directory will be added as the platform expands." },
];

const Landing = () => {
  useScrollToHash();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta description="Turn your fight gear into income. Claim your personal Combat Market storefront and earn from the brands you already use." />
      <OrganizationSchema />
      <WebSiteSchema />
      <FAQSchema items={faqItems} />
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-16">
        
        <div className="container relative z-10 mx-auto px-4 py-16 text-center sm:py-20">
          <h1 className="font-display text-4xl uppercase leading-none tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
            Turn Your Fight Gear Into{" "}
            <span className="text-primary">Income</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
            Claim your personal Combat Market storefront and earn from the brands you already use.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground/80 sm:mt-3 sm:text-base">
            No sponsors. No gatekeepers. Just fighters getting paid.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <Button asChild size="lg" className="glow-primary text-base sm:text-lg">
              <Link to="/fighter-signup">Claim Your Storefront</Link>
            </Button>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Invite-only fighter onboarding now open.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-t border-border py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-xl uppercase leading-none tracking-normal text-white sm:text-2xl md:text-3xl">
            Built for fighters, coaches, and combat athletes worldwide
          </h2>
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground sm:mt-4 sm:text-sm md:text-base">
            MMA • Boxing • Muay Thai • BJJ • Wrestling • Functional Fitness
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="border-t border-border py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-2xl uppercase leading-none tracking-normal text-white sm:text-3xl md:text-4xl lg:text-5xl">How It Works</h2>

          <div className="mt-10 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={glovesImage}
                  alt="Premium combat gloves for boxing and MMA training"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                  <Store className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 font-display text-lg uppercase leading-tight tracking-normal text-white sm:mt-4 sm:text-xl md:text-2xl">1. Claim Your Storefront</h3>
                <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
                  Your own page on Combat Market, under your name. This becomes your personal hub for the gear you trust.
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80 sm:mt-3 sm:text-sm">
                  Simple setup. No tech. No cost.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={equipmentImage}
                  alt="Combat training equipment flatlay with gloves, wraps, and gear"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                  <ShoppingBag className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 font-display text-lg uppercase leading-tight tracking-normal text-white sm:mt-4 sm:text-xl md:text-2xl">2. Add the Brands You Use</h3>
                <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
                  Gloves, tape, supplements, recovery, apparel. If you already use it, you can earn from it.
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80 sm:mt-3 sm:text-sm">
                  We handle tracking and payouts.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50">
              <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <TrendingUp className="h-12 w-12 text-primary/50 sm:h-16 sm:w-16" />
              </div>
              <div className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <h3 className="mt-3 font-display text-lg uppercase leading-tight tracking-normal text-white sm:mt-4 sm:text-xl md:text-2xl">3. Share & Earn – For Life</h3>
                <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
                  Share your storefront. Earn commissions every time someone buys. Invite other fighters. Earn from their sales too.
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80 sm:mt-3 sm:text-sm">
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
      <section id="for-fighters" className="border-t border-border bg-card py-16 sm:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-2xl uppercase leading-none tracking-normal text-white sm:text-3xl md:text-4xl lg:text-5xl">Built for Fighters, Not Advertisers</h2>
          <div className="mt-6 space-y-3 text-base text-muted-foreground sm:mt-8 sm:space-y-4 sm:text-lg">
            <p>Most fighters train harder than anyone.</p>
            <p>Most brands profit more than fighters do.</p>
            <p className="text-foreground font-medium">Combat Market changes that.</p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-sm text-muted-foreground sm:mt-8 sm:text-base">
            We're building the world's first fighter-powered commerce platform, where fighters earn from the products they already believe in and the networks they already have.
          </p>
          <div className="mt-6 flex flex-col items-center gap-1.5 text-sm text-muted-foreground sm:mt-8 sm:gap-2 sm:text-base">
            <p>No chasing sponsors.</p>
            <p>No fake discount codes.</p>
            <p>No begging for deals.</p>
            <p className="mt-3 text-base font-semibold text-foreground sm:mt-4 sm:text-lg">Just fighters owning the upside.</p>
          </div>
        </div>
      </section>

      {/* What Makes Combat Market Different */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-2xl uppercase leading-none tracking-normal text-white sm:text-3xl md:text-4xl lg:text-5xl">More Than Affiliate Links</h2>

          <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:gap-4 sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                <Check className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <p className="text-sm font-medium sm:text-base">Earn from your own sales</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:gap-4 sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                <Check className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <p className="text-sm font-medium sm:text-base">Earn from fighters you invite</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:gap-4 sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                <Check className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <p className="text-sm font-medium sm:text-base">Earn as your network grows</p>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:gap-4 sm:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-10 sm:w-10">
                <Check className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>
              <p className="text-sm font-medium sm:text-base">Get paid for the long term</p>
            </div>
          </div>

          <div className="mt-8 text-center sm:mt-10">
            <p className="text-sm text-muted-foreground sm:text-base">This is how real ecosystems work.</p>
            <p className="mt-1.5 text-base font-semibold text-foreground sm:mt-2 sm:text-lg">Value compounds. Ownership matters.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card py-16 sm:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-2xl uppercase leading-none tracking-normal text-white sm:text-3xl md:text-4xl lg:text-5xl">FAQ</h2>

          <div className="mt-8 space-y-4 sm:mt-12 sm:space-y-6">
            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              <h4 className="text-sm font-semibold sm:text-base">Is this free?</h4>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                Yes. Claiming a storefront is free for fighters.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              <h4 className="text-sm font-semibold sm:text-base">Do I need sponsors or a big following?</h4>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                No. You earn from what you already use and share.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              <h4 className="text-sm font-semibold sm:text-base">Who can join?</h4>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                Fighters, coaches, and combat athletes at any level.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              <h4 className="text-sm font-semibold sm:text-base">How do payouts work?</h4>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                Sales are tracked automatically and paid out directly.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:p-6">
              <h4 className="text-sm font-semibold sm:text-base">When will fans be able to browse fighters?</h4>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2 sm:text-base">
                The public fighter directory will be added as the platform expands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl uppercase leading-none tracking-normal text-white sm:text-3xl md:text-4xl lg:text-5xl">Don't Promote Brands. Build Income.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Claim your Combat Market storefront and start earning from your fight life.
          </p>
          <Button asChild size="lg" className="mt-6 glow-primary text-base sm:mt-8 sm:text-lg">
            <Link to="/fighter-signup">Claim Your Storefront</Link>
          </Button>
        </div>
      </section>

      <Footer />

      {/* Sticky Mobile CTA - only show when not logged in */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 safe-area-inset-bottom md:hidden">
          <Button asChild size="lg" className="w-full glow-primary">
            <Link to="/fighter-signup" className="flex items-center justify-center gap-2">
              Claim Your Storefront
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {/* Add padding at bottom for sticky CTA on mobile */}
      {!user && <div className="h-20 md:hidden" />}
    </div>
  );
};

export default Landing;
