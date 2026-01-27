import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { ArrowLeft, Users } from "lucide-react";

export default function ComingSoon() {
  return (
    <>
      <PageMeta
        title="Fighter Directory - Coming Soon | Combat Market"
        description="The Combat Market Fighter Directory is launching soon. Discover verified combat athletes and their curated storefronts."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 flex items-center justify-center px-4 pt-16">
          <div className="max-w-lg text-center">
            {/* Icon */}
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Users className="h-10 w-10 text-primary" />
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-4">
              Coming Soon
            </h1>
            
            {/* Subtext */}
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              The Fighter Directory is launching soon. You'll be able to discover verified combat athletes and explore their curated storefronts.
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default" size="lg">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline-primary" size="lg">
                <Link to="/paul-weir">
                  View Demo Storefront
                </Link>
              </Button>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
