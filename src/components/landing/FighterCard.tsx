import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCountryFlag } from "@/lib/countryFlags";

type FighterCardProps = {
  handle: string | null;
  full_name: string | null;
  sport: string | null;
  country: string | null;
  profile_image_url: string | null;
  hero_image_url?: string | null;
  badge?: string;
};

export function FighterCard({ handle, full_name, sport, country, profile_image_url, hero_image_url, badge }: FighterCardProps) {
  const imageUrl = hero_image_url || profile_image_url;
  const firstName = full_name?.split(" ")[0] || "Fighter";
  const flag = getCountryFlag(country);

  return (
    <Link
      to={`/${handle}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-muted"
    >
      {/* Image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={full_name || "Fighter"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <span className="text-4xl font-display text-muted-foreground">
            {full_name?.charAt(0) || "?"}
          </span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Badge */}
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
            {badge}
          </span>
        </div>
      )}

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
        <h3 className="font-display text-lg lg:text-xl uppercase tracking-tight text-white mb-1">
          {full_name || "Unknown Fighter"}
        </h3>
        <div className="flex items-center gap-2 text-sm text-white/70 mb-3">
          {sport && <span>{sport}</span>}
          {sport && country && <span>·</span>}
          {country && (
            <span className="flex items-center gap-1">
              {flag} {country}
            </span>
          )}
        </div>

        {/* Frosted store button */}
        <div className="flex items-center justify-between rounded-lg bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 transition-colors group-hover:bg-primary/80 group-hover:border-primary/60">
          <span className="text-sm font-medium text-white">
            {firstName}'s Store
          </span>
          <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
