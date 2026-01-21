import { Helmet } from "react-helmet-async";

// Organization Schema for the entire site
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Combat Market",
    url: "https://cm.automationsuite.ai",
    logo: "https://cm.automationsuite.ai/favicon.ico",
    description: "Fighter-focused affiliate platform where combat athletes earn from the brands they trust.",
    sameAs: ["https://twitter.com/CombatMarket"],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// FAQ Schema for landing page
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Product Schema for product detail pages
interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string;
  brand?: string;
  price?: string;
  url: string;
}

export function ProductSchema({ name, description, image, brand, price, url }: ProductSchemaProps) {
  // Parse price - assume USD if just a number with $ symbol
  const numericPrice = price?.replace(/[^0-9.]/g, "") || "0";
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `${name} available on Combat Market`,
    ...(image && { image }),
    ...(brand && {
      brand: {
        "@type": "Brand",
        name: brand,
      },
    }),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "USD",
      price: numericPrice,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// Person Schema for fighter storefronts
interface PersonSchemaProps {
  name: string;
  description?: string;
  image?: string;
  url: string;
  sameAs?: string[];
  jobTitle?: string;
  nationality?: string;
}

export function PersonSchema({ name, description, image, url, sameAs, jobTitle, nationality }: PersonSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url,
    ...(description && { description }),
    ...(image && { image }),
    ...(jobTitle && { jobTitle }),
    ...(nationality && { nationality }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

// WebSite Schema with search action
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Combat Market",
    url: "https://cm.automationsuite.ai",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://cm.automationsuite.ai/marketplace?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
