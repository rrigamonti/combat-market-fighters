import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FighterCard } from "./FighterCard";
import { Skeleton } from "@/components/ui/skeleton";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  showBadge?: boolean;
  heading?: string;
  subtitle?: string;
  showDirectoryLink?: boolean;
};

export function FeaturedFightersCarousel({
  showBadge = false,
  heading = "FEATURED FIGHTERS",
  subtitle = "Athletes building their storefronts on Combat Market.",
  showDirectoryLink = true,
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const { data: fighters, isLoading } = useQuery({
    queryKey: ["featured-fighters"],
    queryFn: async () => {
      // First try featured fighters, fall back to any approved with hero images
      const { data, error } = await supabase
        .from("fighters")
        .select("id, handle, full_name, sport, country, profile_image_url, hero_image_url")
        .eq("status", "approved")
        .not("hero_image_url", "is", null)
        .order("full_name")
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Auto-rotate every 5s
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(interval);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-foreground mb-2">
            {heading}
          </h2>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {fighters?.map((fighter) => (
              <div
                key={fighter.id}
                className="flex-none w-[85%] sm:w-[45%] lg:w-[31%]"
              >
                <FighterCard
                  handle={fighter.handle}
                  full_name={fighter.full_name}
                  sport={fighter.sport}
                  country={fighter.country}
                  profile_image_url={fighter.profile_image_url}
                  hero_image_url={fighter.hero_image_url}
                  badge={showBadge ? "JUST JOINED" : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Directory link */}
      {showDirectoryLink && (
        <div className="text-center mt-8">
          <Button asChild variant="outline-primary" size="lg">
            <Link to="/fighter-directory">
              View Full Directory
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
