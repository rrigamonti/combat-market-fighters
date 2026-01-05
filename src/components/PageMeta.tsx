import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getCanonicalUrl } from "@/lib/config";

interface PageMetaProps {
  title?: string;
  description?: string;
  path?: string; // Optional override for canonical path
}

const DEFAULT_DESCRIPTION = "Combat Market - The fighter-focused affiliate platform. Fighters earn royalties by promoting curated combat sports products to their fans.";

export function PageMeta({ title, description, path }: PageMetaProps) {
  const location = useLocation();
  const fullTitle = title ? `${title} | Combat Market` : "Combat Market";
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = getCanonicalUrl(path ?? location.pathname);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </Helmet>
  );
}
