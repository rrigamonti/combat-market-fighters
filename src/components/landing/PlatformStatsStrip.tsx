const stats = [
  { value: "$20B+", label: "Global Combat Sports Market" },
  { value: "450M+", label: "Fans Worldwide" },
  { value: "5M+", label: "Athletes Globally" },
  { value: "150+", label: "Countries" },
];

const brandNames = [
  "Venum",
  "Nike",
  "Everlast",
  "RDX",
  "Adidas",
  "Hayabusa",
  "Kong",
  "WHOOP",
  "Onnit",
  "Under Armour",
  "Gymshark",
  "Therabody",
];

// Map of brands that have logo files
const brandLogos: Record<string, string> = {
  Venum: "/brand-logos/venum.png",
  Everlast: "/brand-logos/everlast.png",
};

export function PlatformStatsStrip() {
  // Double the list for seamless infinite scroll
  const doubled = [...brandNames, ...brandNames];

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

      {/* Brand logos — infinite scroll */}
      <div className="border-t border-border">
        <div className="py-8 overflow-hidden">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
            Trusted Brands
          </p>
          <div className="relative">
            <div className="flex animate-scroll-brands whitespace-nowrap gap-12 md:gap-16 w-max">
              {doubled.map((name, i) => {
                const logo = brandLogos[name];
                return logo ? (
                  <img
                    key={`${name}-${i}`}
                    src={logo}
                    alt={name}
                    className="h-8 md:h-10 object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 flex-shrink-0"
                  />
                ) : (
                  <span
                    key={`${name}-${i}`}
                    className="font-display text-lg md:text-xl uppercase tracking-wider text-muted-foreground/50 hover:text-foreground transition-colors duration-300 flex-shrink-0 select-none"
                  >
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
