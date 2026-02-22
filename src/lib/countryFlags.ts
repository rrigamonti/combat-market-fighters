// Map country names to flag emojis
const countryFlagMap: Record<string, string> = {
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "Ireland": "🇮🇪",
  "Brazil": "🇧🇷",
  "Mexico": "🇲🇽",
  "Thailand": "🇹🇭",
  "Japan": "🇯🇵",
  "Russia": "🇷🇺",
  "Australia": "🇦🇺",
  "Canada": "🇨🇦",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Netherlands": "🇳🇱",
  "Philippines": "🇵🇭",
  "South Korea": "🇰🇷",
  "Poland": "🇵🇱",
  "Nigeria": "🇳🇬",
  "Cameroon": "🇨🇲",
  "New Zealand": "🇳🇿",
  "Spain": "🇪🇸",
  "Italy": "🇮🇹",
  "Sweden": "🇸🇪",
  "Cuba": "🇨🇺",
  "Argentina": "🇦🇷",
  "Colombia": "🇨🇴",
  "South Africa": "🇿🇦",
  "China": "🇨🇳",
  "India": "🇮🇳",
  "Ukraine": "🇺🇦",
  "Kazakhstan": "🇰🇿",
  "Uzbekistan": "🇺🇿",
  "Other": "🌍",
};

export function getCountryFlag(country: string | null): string {
  if (!country) return "🌍";
  return countryFlagMap[country] || "🌍";
}
