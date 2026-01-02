import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExternalLink, MapPin, Trophy } from "lucide-react";

const demoFighter = {
  fullName: "Marcus 'The Hammer' Rodriguez",
  sport: "MMA",
  country: "United States",
  bio: "Professional MMA fighter with a 15-3 record. Former regional champion, now competing on the world stage. Training out of American Top Team, I've dedicated my life to martial arts and helping others achieve their fitness goals.",
};

const demoProducts = [
  {
    id: 1,
    name: "Premium Boxing Gloves",
    brand: "Venum",
    price: "$89.99",
    image: "https://images.unsplash.com/photo-1583473848882-f9a5a70ee199?w=400&h=400&fit=crop",
    link: "#",
  },
  {
    id: 2,
    name: "Compression Rash Guard",
    brand: "Hayabusa",
    price: "$54.99",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop",
    link: "#",
  },
  {
    id: 3,
    name: "Fight Shorts Pro",
    brand: "Fairtex",
    price: "$45.99",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
    link: "#",
  },
  {
    id: 4,
    name: "Whey Protein Isolate",
    brand: "Optimum Nutrition",
    price: "$64.99",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop",
    link: "#",
  },
  {
    id: 5,
    name: "Training Hand Wraps",
    brand: "Everlast",
    price: "$12.99",
    image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400&h=400&fit=crop",
    link: "#",
  },
  {
    id: 6,
    name: "Recovery Foam Roller",
    brand: "TriggerPoint",
    price: "$34.99",
    image: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=400&fit=crop",
    link: "#",
  },
];

export default function DemoStorefront() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative border-b border-border bg-gradient-to-b from-primary/10 to-transparent pt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left md:gap-8">
            <div className="h-32 w-32 shrink-0 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-4xl font-display text-primary-foreground">
              MR
            </div>
            <div className="mt-6 md:mt-0">
              <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
                DEMO STOREFRONT
              </div>
              <h1 className="font-display text-4xl md:text-5xl">{demoFighter.fullName}</h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-muted-foreground md:justify-start">
                <span className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {demoFighter.sport}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {demoFighter.country}
                </span>
              </div>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                {demoFighter.bio}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl">My Gear & Recommendations</h2>
          <p className="mt-2 text-muted-foreground">
            Products I use and trust. When you shop through my links, you support my fight career.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {demoProducts.map((product) => (
              <div
                key={product.id}
                className="group rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <h3 className="mt-1 font-semibold">{product.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{product.price}</span>
                    <Button size="sm" asChild>
                      <a href={product.link} target="_blank" rel="noopener noreferrer">
                        Shop Here
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Disclaimer */}
      <section className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Affiliate Disclosure: I earn a commission from qualifying purchases made through the product links on this page.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
