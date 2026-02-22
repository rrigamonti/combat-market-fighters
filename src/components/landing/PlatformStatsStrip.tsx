const stats = [
  { value: "$20B+", label: "Global Combat Sports Market" },
  { value: "450M+", label: "Fans Worldwide" },
  { value: "5M+", label: "Athletes Globally" },
  { value: "150+", label: "Countries" },
];

const brandLogos = [
  { name: "Venum", src: "/brand-logos/venum.png" },
  { name: "Everlast", src: "/brand-logos/everlast.png" },
  { name: "Fairtex", src: "/brand-logos/fairtex.png" },
  { name: "Sanabul", src: "/brand-logos/sanabul.svg" },
  { name: "Scramble", src: "/brand-logos/scramble.png" },
  { name: "COROS", src: "/brand-logos/coros.png" },
];

export function PlatformStatsStrip() {
  return (
    <section className="bg-card border-y border-border">
      {/* Stats */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl lg:text-4xl uppercase text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brand logos */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Trusted Brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {brandLogos.map((brand) => (
              <img
                key={brand.name}
                src={brand.src}
                alt={brand.name}
                className="h-8 md:h-10 object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
