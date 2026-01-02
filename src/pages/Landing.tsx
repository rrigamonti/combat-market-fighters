import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Award, ShoppingBag, TrendingUp, Heart, Store, ChevronRight } from "lucide-react";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  useScrollToHash();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-5xl leading-tight tracking-wide md:text-7xl lg:text-8xl">
            Turn Your Fight Career Into{" "}
            <span className="text-gradient">Lifetime Royalties</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Combat Market gives fighters a personal storefront packed with curated affiliate products.
            You promote what you already use. Your fans shop. You get paid.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="glow-primary text-lg">
              <Link to="/fighter-signup">Apply as a Fighter</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link to="/marcus-rodriguez">View Demo Storefront</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="border-t border-border py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-4xl md:text-5xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Get your storefront live in 3 simple steps
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-8 text-center transition-all hover:border-primary/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 font-display text-2xl">1. Apply</h3>
              <p className="mt-3 text-muted-foreground">
                Submit your application with your fight credentials. We verify all fighters to maintain quality.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center transition-all hover:border-primary/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 font-display text-2xl">2. Get Your Store</h3>
              <p className="mt-3 text-muted-foreground">
                Once approved, your personalized storefront goes live with curated products tailored to combat sports.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center transition-all hover:border-primary/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-6 font-display text-2xl">3. Earn</h3>
              <p className="mt-3 text-muted-foreground">
                Share your store link. When fans buy through your store, you earn a commission on every sale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Fighters */}
      <section id="for-fighters" className="border-t border-border bg-card py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center font-display text-4xl md:text-5xl">Built for Fighters</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Whether you're a rising amateur or a world champion, Combat Market helps you monetize your influence
          </p>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-6">
              <TrendingUp className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h4 className="font-semibold">Passive Income</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Earn while you train. Your storefront works 24/7.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-6">
              <ShoppingBag className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h4 className="font-semibold">Curated Products</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  We select products fighters actually use and trust.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-6">
              <Heart className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h4 className="font-semibold">Fan Connection</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give fans a way to support you beyond the cage.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-lg border border-border bg-background p-6">
              <Award className="h-6 w-6 shrink-0 text-primary" />
              <div>
                <h4 className="font-semibold">Your Brand</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  A personalized storefront that represents you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-4xl md:text-5xl">FAQ</h2>

          <div className="mt-12 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold">How much can I earn?</h4>
              <p className="mt-2 text-muted-foreground">
                Earnings depend on your audience size and engagement. Top fighters earn thousands monthly from affiliate commissions alone.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold">What sports do you accept?</h4>
              <p className="mt-2 text-muted-foreground">
                MMA, Boxing, Muay Thai, Brazilian Jiu-Jitsu, Wrestling, Kickboxing, and other combat sports disciplines.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold">How long does approval take?</h4>
              <p className="mt-2 text-muted-foreground">
                We review applications within 48-72 hours. You'll receive an email once your application is processed.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h4 className="font-semibold">Is there a cost to join?</h4>
              <p className="mt-2 text-muted-foreground">
                Combat Market is completely free for fighters. We only earn when you earn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-primary/10 to-transparent py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl">Ready to Start Earning?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join Combat Market today and turn your fight career into a lasting income stream.
          </p>
          <Button asChild size="lg" className="mt-8 glow-primary text-lg">
            <Link to="/fighter-signup">Apply as a Fighter</Link>
          </Button>
        </div>
      </section>

      <Footer />

      {/* Sticky Mobile CTA - only show when not logged in */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-4 md:hidden">
          <Button asChild size="lg" className="w-full glow-primary">
            <Link to="/fighter-signup" className="flex items-center justify-center gap-2">
              Apply as a Fighter
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Landing;
