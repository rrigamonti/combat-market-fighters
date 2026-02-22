import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { OrganizationSchema, WebSiteSchema, FAQSchema } from "@/components/StructuredData";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { PlatformStatsStrip } from "@/components/landing/PlatformStatsStrip";
import { FeaturedFightersCarousel } from "@/components/landing/FeaturedFightersCarousel";
import { JoinCTA } from "@/components/landing/JoinCTA";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, ChevronRight, ArrowRight } from "lucide-react";

// Assets
import mmaAction from "@/assets/landing/mma-action.jpg";
import boxingActionReal from "@/assets/landing/boxing-action-real.jpg";
import muaythaiReal from "@/assets/landing/muaythai-real.jpg";
import kickboxingReal from "@/assets/landing/kickboxing-real.jpg";
import bareknuckleReal from "@/assets/landing/bareknuckle-real.jpg";
import step1Storefront from "@/assets/landing/step-1-storefront.png";
import step2Brands from "@/assets/landing/step-2-brands.png";
import step3Earn from "@/assets/landing/step-3-earn.png";
import fighterTraining from "@/assets/landing/fighter-training.png";
import { getCountryFlag } from "@/lib/countryFlags";

// Hardcoded featured fighter for the hero
const heroFighter = {
  name: "Jono Carroll",
  sport: "Boxing",
  country: "Ireland",
  handle: "jono-carroll",
  image: "https://mhmoxwmxnojljehbigtp.supabase.co/storage/v1/object/public/fighter-heroes/8cdfd911-9804-4e2b-91f3-e00a84a02e8d-1771324823588.jpg",
};

const faqItems = [
  {
    question: "How do I get invited to Combat Market?",
    answer: "Combat Market is currently invite-only for verified combat sports athletes. Apply through our signup form and we'll review your profile. We're looking for active fighters, coaches, and combat sports professionals with an engaged audience."
  },
  {
    question: "What brands can I add to my storefront?",
    answer: "You can promote any brand from our curated catalog of combat sports equipment, apparel, and supplements. We partner with trusted brands that fighters actually use. You can also request brands to be added to the platform."
  },
  {
    question: "How do earnings work?",
    answer: "You earn a commission on every sale made through your storefront. Payments are processed monthly once you reach the minimum threshold. You also earn royalties when fighters you refer make sales, creating passive income as your network grows."
  },
  {
    question: "Is this just another affiliate program?",
    answer: "No. Combat Market is built specifically for fighters, not influencers. You own your storefront, control what you promote, and earn from both direct sales and referrals. It's designed to give fighters financial independence, not just one-off commissions."
  }
];

const sportsCategories = [
  { name: "MMA", image: mmaAction },
  { name: "BOXING", image: boxingActionReal },
  { name: "MUAY THAI", image: muaythaiReal },
  { name: "BJJ", image: "https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=600&q=80" },
  { name: "WRESTLING", image: kickboxingReal },
  { name: "BARE KNUCKLE", image: bareknuckleReal }
];

const howItWorksSteps = [
  {
    image: step1Storefront,
    title: "Claim Your Storefront",
    bullets: [
      "Apply to join the invite-only network",
      "Get your personal Combat Market URL",
      "Customize your profile and branding"
    ]
  },
  {
    image: step2Brands,
    title: "Add Brands You Use",
    bullets: [
      "Browse our curated catalog",
      "Select products you actually train with",
      "Organize your storefront your way"
    ]
  },
  {
    image: step3Earn,
    title: "Share and Earn",
    bullets: [
      "Share your storefront link everywhere",
      "Earn commission on every sale",
      "Get royalties from referred fighters"
    ]
  }
];

const whyCombatMarketBullets = [
  "Combat athletes influence thousands of purchasing decisions every year.",
  "Most of that influence goes unpaid.",
  "Combat Market gives fighters a structured way to earn from the brands they already trust."
];

const forBrandsBullets = [
  "Access a network of verified combat athletes",
  "Authentic product promotion from real users",
  "Performance-based partnerships with transparent tracking",
  "Reach engaged combat sports audiences globally"
];

export default function LandingV2() {
  useScrollToHash();

  return (
    <>
      <PageMeta
        title="Combat Market | Turn Your Routine Into Revenue"
        description="Claim your personal Combat Market storefront and earn from the brands you already use. Built for fighters, not advertisers."
      />
      <OrganizationSchema />
      <WebSiteSchema />
      <FAQSchema
        items={faqItems.map((item) => ({
          question: item.question,
          answer: item.answer,
        }))}
      />

      <div className="min-h-screen bg-background">
        <Navbar variant="landing" />

        {/* ── SECTION 1: Hero (Split Layout) ── */}
        <section className="relative pt-16 overflow-hidden cm-hero-surface">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Text */}
              <div className="text-center lg:text-left">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-tight leading-none text-white mb-6">
                  Turn Your Routine Into Revenue
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                  Claim your personal Combat Market storefront and earn from the brands you already use.
                </p>
                <Button asChild size="lg" className="text-base px-8">
                  <Link to="/fighter-signup">
                    Claim Your Storefront
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Right - Featured Fighter Image */}
              <div className="flex justify-center lg:justify-end">
                <Link
                  to={`/${heroFighter.handle}`}
                  className="group relative block w-full max-w-md lg:max-w-lg overflow-hidden rounded-2xl aspect-[3/4]"
                >
                  <img
                    src={heroFighter.image}
                    alt={heroFighter.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl uppercase tracking-tight text-white mb-1">
                      {heroFighter.name}
                    </h3>
                    <p className="text-sm text-white/70 mb-4">
                      {heroFighter.sport} · {getCountryFlag(heroFighter.country)} {heroFighter.country}
                    </p>
                    <div className="flex items-center justify-between rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 transition-colors group-hover:bg-primary/80 group-hover:border-primary/60">
                      <span className="text-sm font-medium text-white">
                        {heroFighter.name.split(" ")[0]}'s Store
                      </span>
                      <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Platform Scale Strip ── */}
        <PlatformStatsStrip />

        {/* ── SECTION 3: Featured Fighters Carousel ── */}
        <section className="bg-background py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <FeaturedFightersCarousel showDirectoryLink />
          </div>
        </section>

        {/* ── SECTION 4: Why Combat Market ── */}
        <section className="bg-card py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <img
                  src={fighterTraining}
                  alt="Fighter training in gym"
                  className="w-full rounded-lg"
                />
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-6">
                  Why Combat Market?
                </h2>
                <ul className="space-y-4 mb-8">
                  {whyCombatMarketBullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-4 text-lg text-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      {bullet}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg">
                  <Link to="/fighter-signup">
                    Claim Your Storefront
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: How It Works ── */}
        <section id="features" className="bg-background py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Get started in minutes. No complicated setup, no hidden fees.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {howItWorksSteps.map((step, index) => (
                <div key={step.title} className="text-center">
                  <div className="relative mb-6">
                    <div className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg z-10">
                      {index + 1}
                    </div>
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full max-w-xs mx-auto rounded-lg"
                    />
                  </div>
                  <h3 className="font-display text-xl lg:text-2xl uppercase tracking-tight text-foreground mb-4">
                    {step.title}
                  </h3>
                  <ul className="space-y-2 text-left max-w-xs mx-auto">
                    {step.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-muted-foreground">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6: Built For Every Discipline ── */}
        <section id="brands" className="bg-card py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-4">
                Built For Every Discipline
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                From MMA to Boxing to BJJ, we support athletes across all combat disciplines.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {sportsCategories.map((sport) => (
                <div
                  key={sport.name}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer"
                >
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
                    <h3 className="font-display text-xl lg:text-2xl uppercase tracking-wide text-white">
                      {sport.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 7: For Brands ── */}
        <section className="bg-background py-20 lg:py-28">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-4">
                For Brands
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Partner with real athletes who genuinely use and recommend your products.
              </p>
            </div>
            <ul className="grid sm:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
              {forBrandsBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="text-center">
              <Button asChild variant="outline-primary" size="lg">
                <Link to="/fighter-signup">
                  Partner With Fighters
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── SECTION 8: Final CTA ── */}
        <JoinCTA />

        {/* ── SECTION 9: FAQ ── */}
        <section id="faq" className="bg-background py-20 lg:py-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-border">
                  <AccordionTrigger className="text-left text-lg font-medium text-foreground hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
