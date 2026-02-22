// Map country names to ISO 3166-1 alpha-2 codes for flag images
const countryCodeMap: Record<string, string> = {
  "United States": "us",
  "United Kingdom": "gb",
  "Ireland": "ie",
  "Brazil": "br",
  "Mexico": "mx",
  "Thailand": "th",
  "Japan": "jp",
  "Russia": "ru",
  "Australia": "au",
  "Canada": "ca",
  "France": "fr",
  "Germany": "de",
  "Netherlands": "nl",
  "Philippines": "ph",
  "South Korea": "kr",
  "Poland": "pl",
  "Nigeria": "ng",
  "Cameroon": "cm",
  "New Zealand": "nz",
  "Spain": "es",
  "Italy": "it",
  "Sweden": "se",
  "Cuba": "cu",
  "Argentina": "ar",
  "Colombia": "co",
  "South Africa": "za",
  "China": "cn",
  "India": "in",
  "Ukraine": "ua",
  "Kazakhstan": "kz",
  "Uzbekistan": "uz",
};

/**
 * Returns the ISO country code for a given country name.
 */
export function getCountryCode(country: string | null): string | null {
  if (!country) return null;
  return countryCodeMap[country] || null;
}

/**
 * Returns a flag image URL from flagcdn.com for the given country.
 */
export function getCountryFlagUrl(country: string | null): string | null {
  const code = getCountryCode(country);
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

/**
 * Legacy emoji flag helper (kept for compatibility).
 */
export function getCountryFlag(country: string | null): string {
  if (!country) return "🌍";
  const emojiMap: Record<string, string> = {
    "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Ireland": "🇮🇪",
    "Brazil": "🇧🇷", "Mexico": "🇲🇽", "Thailand": "🇹🇭", "Japan": "🇯🇵",
    "Russia": "🇷🇺", "Australia": "🇦🇺", "Canada": "🇨🇦", "France": "🇫🇷",
    "Germany": "🇩🇪", "Netherlands": "🇳🇱", "Philippines": "🇵🇭",
    "South Korea": "🇰🇷", "Poland": "🇵🇱", "Nigeria": "🇳🇬",
    "Cameroon": "🇨🇲", "New Zealand": "🇳🇿", "Spain": "🇪🇸",
    "Italy": "🇮🇹", "Sweden": "🇸🇪", "Cuba": "🇨🇺", "Argentina": "🇦🇷",
    "Colombia": "🇨🇴", "South Africa": "🇿🇦", "China": "🇨🇳",
    "India": "🇮🇳", "Ukraine": "🇺🇦", "Kazakhstan": "🇰🇿",
    "Uzbekistan": "🇺🇿",
  };
  return emojiMap[country] || "🌍";
}
