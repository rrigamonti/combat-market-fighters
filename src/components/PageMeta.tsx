import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getCanonicalUrl, PRODUCTION_DOMAIN } from "@/lib/config";

interface PageMetaProps {
  title?: string;
  description?: string;
  path?: string; // Optional override for canonical path
  image?: string; // OG image URL
  noindex?: boolean; // Prevent indexing
}

const DEFAULT_DESCRIPTION = "Combat Market - The fighter-focused affiliate platform. Fighters earn royalties by promoting curated combat sports products to their fans.";
const DEFAULT_OG_IMAGE = `${PRODUCTION_DOMAIN}/og-image.jpg`;

export function PageMeta({ title, description, path, image, noindex }: PageMetaProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} | Combat Market` : "Combat Market";
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = getCanonicalUrl(path ?? location.pathname);
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
