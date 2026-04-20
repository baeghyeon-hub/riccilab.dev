import {
  BASE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  GITHUB_URL,
  TWITTER_URL,
} from "./constants";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    description: SITE_DESCRIPTION,
    // sameAs ties the site to its external social profiles — helps Google
    // resolve the author entity and can surface in Knowledge Graph.
    sameAs: [GITHUB_URL, TWITTER_URL],
  };
}

export function articleJsonLd(post: {
  title: string;
  description: string;
  date: string;
  slug: string;
  tags: string[];
}) {
  const url = `${BASE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date ? new Date(post.date).toISOString() : undefined,
    url,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
    },
    keywords: post.tags.join(", "),
    inLanguage: "ko",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
