import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FighterCard } from "@/components/landing/FighterCard";
import { FeaturedFightersCarousel } from "@/components/landing/FeaturedFightersCarousel";
import { JoinCTA } from "@/components/landing/JoinCTA";
import { Search, ChevronRight } from "lucide-react";
import heroImage from "@/assets/landing/mma-action.jpg";

type Fighter = {
  id: string;
  handle: string | null;
  full_name: string | null;
  sport: string | null;
  country: string | null;
  profile_image_url: string | null;
  hero_image_url: string | null;
};

const PAGE_SIZE = 12;

export default function FighterDirectory() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data: fighters, isLoading } = useQuery({
    queryKey: ["fighters-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("id, handle, full_name, sport, country, profile_image_url, hero_image_url")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      return data as Fighter[];
    },
  });

  // Exclude Personal Trainers
  const directoryFighters = useMemo(() => {
    if (!fighters) return [];
    return fighters.filter(f => f.sport?.toLowerCase() !== "personal trainer");
  }, [fighters]);

  const sports = useMemo(() => {
    return [...new Set(directoryFighters.map(f => f.sport).filter(Boolean))].sort() as string[];
  }, [directoryFighters]);

  const countries = useMemo(() => {
    return [...new Set(directoryFighters.map(f => f.country).filter(Boolean))].sort() as string[];
  }, [directoryFighters]);

  const filtered = useMemo(() => {
    if (!directoryFighters) return [];
    const q = search.toLowerCase();
    return directoryFighters.filter(f => {
      if (q && !f.full_name?.toLowerCase().includes(q)) return false;
      if (sportFilter !== "all" && f.sport !== sportFilter) return false;
      if (countryFilter !== "all" && f.country !== countryFilter) return false;
      return true;
    });
  }, [directoryFighters, search, sportFilter, countryFilter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE);
  }, []);

  return (
    <>
      <PageMeta
        title="Fighter Directory | Combat Market"
        description="Discover verified combat athletes and explore their curated storefronts on Combat Market."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        {/* ── Directory Hero ── */}
        <section className="relative pt-16 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Combat athletes"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative container mx-auto px-4 py-24 lg:py-36 text-center">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-tight text-white mb-4">
              Find Your Fighter.
            </h1>
            <p className="text-lg lg:text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Discover professional and rising combat athletes building their storefronts on Combat Market.
            </p>
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/fighter-signup">
                Claim Your Storefront
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <main className="flex-1">
          {/* ── Featured Fighters ── */}
          <section className="bg-background py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <FeaturedFightersCarousel
                showBadge
                heading="FEATURED FIGHTERS"
                subtitle="Athletes building their storefronts on Combat Market."
                showDirectoryLink={false}
              />
            </div>
          </section>

          {/* ── Filter Bar ── */}
          <section className="bg-card border-y border-border sticky top-16 z-30">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                    className="pl-10"
                  />
                </div>
                <Select value={sportFilter} onValueChange={v => { setSportFilter(v); setVisibleCount(PAGE_SIZE); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Disciplines</SelectItem>
                    {sports.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={countryFilter} onValueChange={v => { setCountryFilter(v); setVisibleCount(PAGE_SIZE); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* ── Fighter Grid ── */}
          <section className="bg-background py-12 lg:py-20">
            <div className="container mx-auto px-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No fighters found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visible.map(fighter => (
                      <FighterCard
                        key={fighter.id}
                        handle={fighter.handle}
                        full_name={fighter.full_name}
                        sport={fighter.sport}
                        country={fighter.country}
                        profile_image_url={fighter.profile_image_url}
                        hero_image_url={fighter.hero_image_url}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mt-12">
                      <Button variant="outline-primary" size="lg" onClick={loadMore}>
                        Load More Fighters
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {/* Count */}
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Showing {visible.length} of {filtered.length} fighters
                  </p>
                </>
              )}
            </div>
          </section>

          {/* ── Join CTA ── */}
          <JoinCTA />
        </main>

        <Footer />
      </div>
    </>
  );
}
