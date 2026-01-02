import { Helmet } from "react-helmet-async";

interface PageMetaProps {
  title?: string;
  description?: string;
}

const DEFAULT_DESCRIPTION = "Combat Market - The fighter-focused affiliate platform. Fighters earn royalties by promoting curated combat sports products to their fans.";

export function PageMeta({ title, description }: PageMetaProps) {
  const fullTitle = title ? `${title} | Combat Market` : "Combat Market";
  const metaDescription = description || DEFAULT_DESCRIPTION;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
    </Helmet>
  );
}
