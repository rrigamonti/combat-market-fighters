import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getCountryFlagUrl } from "@/lib/countryFlags";

type FighterCardProps = {
  handle: string | null;
  full_name: string | null;
  sport: string | null;
  country: string | null;
  profile_image_url: string | null;
  hero_image_url?: string | null;
  badge?: string;
  variant?: "directory" | "featured";
};

export const FighterCard = React.forwardRef<HTMLAnchorElement, FighterCardProps>(({
  handle,
  full_name,
  sport,
  country,
  profile_image_url,
  hero_image_url,
  badge,
  variant = "directory",
}, ref) => {
  const flagUrl = getCountryFlagUrl(country);
  const isFeatured = variant === "featured";
  const imageUrl = isFeatured
    ? (hero_image_url || profile_image_url)
    : (profile_image_url || hero_image_url);

  return (
    <Link
      to={`/${handle}`}
      className="group relative block overflow-hidden rounded-lg border border-white/10 bg-card"
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${isFeatured ? "aspect-[3/4]" : "aspect-[16/10]"}`}>
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

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-block rounded bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground border border-primary/60">
              {badge}
            </span>
          </div>
        )}

        {/* Subtle gradient at bottom of image for featured */}
        {isFeatured && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        )}
      </div>

      {/* Info below image */}
      <div className="p-3 lg:p-4">
        <h3 className="font-display text-base lg:text-lg uppercase tracking-tight text-foreground mb-0.5 leading-tight">
          {full_name || "Unknown Fighter"}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          {sport && <span>{sport}</span>}
          {sport && country && <span>·</span>}
          {country && (
            <span className="flex items-center gap-1.5">
              {flagUrl && (
                <img
                  src={flagUrl}
                  alt={`${country} flag`}
                  className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm"
                />
              )}
              {country}
            </span>
          )}
        </div>

        {/* VIEW STOREFRONT button + arrow */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-primary/20">
            View Storefront
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
});

FighterCard.displayName = "FighterCard";
