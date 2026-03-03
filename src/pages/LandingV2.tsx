import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { OrganizationSchema, WebSiteSchema, FAQSchema } from "@/components/StructuredData";
import { useScrollToHash } from "@/hooks/useScrollToHash";
import { PlatformStatsStrip } from "@/components/landing/PlatformStatsStrip";
import { FeaturedFightersCarousel } from "@/components/landing/FeaturedFightersCarousel";
import { FighterCard } from "@/components/landing/FighterCard";
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


// Default hero fighter fallback
const defaultHeroFighter = {
  name: "Paul Weir",
  sport: "Boxing",
  country: "United Kingdom",
  handle: "paul-weir",
  image: "",
};

const faqItems = [
  {
    question: "What is Combat Market?",
    answer: "Combat Market gives fighters their own online storefront featuring the products they already use — gloves, wraps, supplements, recovery tools, apparel, and training gear. When someone buys through your page, you earn commission."
  },
  {
    question: "How do I get invited?",
    answer: "Combat Market is invite-only for professional fighters, amateur competitors, coaches, gym owners, and combat influencers. If you compete, coach, or influence buying decisions in combat sports, you can apply. Once approved, we help build your storefront."
  },
  {
    question: "What brands can I add to my storefront?",
    answer: "The brands you already use. We work with over 20,000 retailers and brands globally. If we have a commission agreement in place, we activate it instantly. If not, we contact the brand and negotiate a deal on your behalf."
  },
  {
    question: "How do earnings work?",
    answer: "When someone buys through your storefront, you earn commission based on what the brand offers. Every sale is tracked automatically, and your earnings from multiple brands are combined into one dashboard and one payout system."
  },
  {
    question: "How do I get paid?",
    answer: "Sales are tracked, the retailer confirms the order after the return window closes, commission is approved, and you receive payout. Most retailers operate on a 30–60 day confirmation cycle. No invoicing, no chasing brands, no multiple affiliate logins."
  },
  {
    question: "Do I need to change the products I use?",
    answer: "No. Your storefront is built around your real training setup. If you already use it and believe in it, we add it. If a product isn't monetised yet, we approach the brand and try to secure commission for you."
  },
  {
    question: "Is this just another affiliate program?",
    answer: "No. Traditional affiliate programs mean one brand at a time, multiple logins, and you negotiate yourself. Combat Market gives you one storefront, multiple brands, one dashboard, one payout — and we negotiate deals for you."
  },
  {
    question: "Can I refer other fighters and earn commission?",
    answer: "Yes, on selected Level 1 brands. If you introduce another fighter and they start earning, you earn a percentage from their activity. This allows you to build a multi-tier earning structure. Referral is optional — you can earn purely from your own storefront."
  },
  {
    question: "How do I promote my storefront?",
    answer: "Add it to your Instagram bio, replace random links with combat.market/yourname, pin a post about your fight gear, or share stories during fight camp about the products you're using. It works because it's built around what you already talk about."
  },
  {
    question: "Do I need to constantly sell to make money?",
    answer: "No. Share your storefront consistently, mention it naturally, and keep it updated. When people ask what gloves, supplements, or gear you use, just direct them to your store link in your bio."
  },
  {
    question: "Who handles brand negotiations?",
    answer: "We do. If you use a brand that isn't yet monetised, we reach out, negotiate commission, and add it to your storefront once agreed. You shouldn't have to chase sponsors just to earn from your influence."
  },
  {
    question: "Do I get ongoing support?",
    answer: "Yes. Every fighter has an assigned account manager who helps with setting up your storefront, adding products, approaching brands, promotion ideas, tracking performance, and maximising your earnings."
  },
  {
    question: "Do I receive products?",
    answer: "No. Combat Market does not supply, handle, or ship any products. Your storefront is a clean, professional page that showcases the products you use. When someone purchases through it, you earn commission without managing stock or fulfilment."
  },
  {
    question: "How much does it cost to join?",
    answer: "Nothing. Joining Combat Market is completely free. There are no setup fees, monthly fees, or hidden costs."
  },
  {
    question: "How do you know what products I use?",
    answer: "Once your application is approved, you can request the products you use directly through your dashboard. You can also message Combat Market on WhatsApp or via Instagram, and our team will assist with adding them to your storefront."
  },
  {
    question: "Is Combat Market a sponsorship?",
    answer: "No. Combat Market gives you your own personal storefront where you earn commission from the products you already use. You don't need to switch brands or promote anything you don't believe in."
  },
  {
    question: "Can I still work with other brands and sponsors?",
    answer: "Yes. Combat Market is not exclusive, and you are free to work with any brands, sponsors, or partnerships you choose. There is no cost, no contract, and no obligation."
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

  const { data: heroData } = useQuery({
    queryKey: ["hero-fighter", "paul-weir"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fighters")
        .select("full_name, sport, country, handle, hero_image_url, profile_image_url")
        .eq("handle", "paul-weir")
        .eq("status", "approved")
        .single();
      return data;
    },
  });

  const heroFighter = {
    name: heroData?.full_name || defaultHeroFighter.name,
    sport: heroData?.sport || defaultHeroFighter.sport,
    country: heroData?.country || defaultHeroFighter.country,
    handle: heroData?.handle || defaultHeroFighter.handle,
    image: heroData?.profile_image_url || heroData?.hero_image_url || defaultHeroFighter.image,
  };

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

              {/* Right - Featured Fighter Card (matches directory style) */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md lg:max-w-lg">
                  <FighterCard
                    handle={heroFighter.handle}
                    full_name={heroFighter.name}
                    sport={heroFighter.sport}
                    country={heroFighter.country}
                    profile_image_url={heroFighter.image}
                    variant="featured"
                  />
                </div>
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
