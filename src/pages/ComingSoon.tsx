import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/PageMeta";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, MapPin, ArrowUpDown } from "lucide-react";

type Fighter = {
  id: string;
  handle: string | null;
  full_name: string | null;
  sport: string | null;
  country: string | null;
  profile_image_url: string | null;
  short_bio: string | null;
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function FighterDirectory() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const { data: fighters, isLoading } = useQuery({
    queryKey: ["fighters-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fighters")
        .select("id, handle, full_name, sport, country, profile_image_url, short_bio")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      return data as Fighter[];
    },
  });

  const sports = useMemo(() => {
    if (!fighters) return [];
    return [...new Set(fighters.map(f => f.sport).filter(Boolean))].sort() as string[];
  }, [fighters]);

  const countries = useMemo(() => {
    if (!fighters) return [];
    return [...new Set(fighters.map(f => f.country).filter(Boolean))].sort() as string[];
  }, [fighters]);

  const filtered = useMemo(() => {
    if (!fighters) return [];
    const q = search.toLowerCase();
    const result = fighters.filter(f => {
      if (q && !(f.full_name?.toLowerCase().includes(q) || f.short_bio?.toLowerCase().includes(q))) return false;
      if (sportFilter !== "all" && f.sport !== sportFilter) return false;
      if (countryFilter !== "all" && f.country !== countryFilter) return false;
      return true;
    });
    result.sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return (b.full_name || "").localeCompare(a.full_name || "");
        case "sport":
          return (a.sport || "").localeCompare(b.sport || "");
        case "country":
          return (a.country || "").localeCompare(b.country || "");
        default:
          return (a.full_name || "").localeCompare(b.full_name || "");
      }
    });
    return result;
  }, [fighters, search, sportFilter, countryFilter, sortBy]);

  return (
    <>
      <PageMeta
        title="Fighter Directory | Combat Market"
        description="Discover verified combat athletes and explore their curated storefronts on Combat Market."
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight text-foreground mb-3">
                Fighter Directory
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Browse verified combat athletes and discover their curated gear storefronts.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search fighters..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {sports.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No fighters found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(fighter => (
                  <Link key={fighter.id} to={`/${fighter.handle}`} className="group">
                    <Card className="overflow-hidden transition-colors group-hover:border-primary/50">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          <Avatar className="h-14 w-14">
                            {fighter.profile_image_url && (
                              <AvatarImage src={fighter.profile_image_url} alt={fighter.full_name || ""} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(fighter.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {fighter.full_name || "Unknown Fighter"}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {fighter.sport && <Badge variant="secondary" className="text-xs">{fighter.sport}</Badge>}
                              {fighter.country && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {fighter.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {fighter.short_bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{fighter.short_bio}</p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
