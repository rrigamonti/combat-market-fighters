import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Props = {
  heading?: string;
  subtext?: string;
};

export function JoinCTA({
  heading = "ARE YOU A FIGHTER?",
  subtext = "Claim your Combat Market storefront and start earning from your fight life.",
}: Props) {
  return (
    <section className="bg-card py-20 lg:py-28">
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-6">
          {heading}
        </h2>
        <p className="text-lg lg:text-xl text-muted-foreground mb-8">
          {subtext}
        </p>
        <Button asChild size="lg" className="text-base px-8">
          <Link to="/fighter-signup">
            Claim Your Storefront
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
