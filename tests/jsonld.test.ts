import assert from "node:assert/strict";
import test from "node:test";
import { articleJsonLd, organizationJsonLd } from "../src/lib/jsonld";
import {
  BASE_URL,
  GITHUB_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_URL,
} from "../src/lib/constants";

test("organizationJsonLd reflects site identity constants", () => {
  assert.deepEqual(organizationJsonLd(), {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    description: SITE_DESCRIPTION,
    sameAs: [GITHUB_URL, TWITTER_URL],
  });
});

test("articleJsonLd builds canonical blog article metadata", () => {
  const jsonLd = articleJsonLd({
    title: "동역학적 시스템 학습",
    description: "A post description",
    date: "2026-04-20",
    slug: "동역학적-시스템-학습",
    tags: ["systems", "math"],
  });

  const url = `${BASE_URL}/blog/동역학적-시스템-학습`;

  assert.deepEqual(jsonLd, {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "동역학적 시스템 학습",
    description: "A post description",
    datePublished: "2026-04-20T00:00:00.000Z",
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
    keywords: "systems, math",
    inLanguage: "ko",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  });
});

test("articleJsonLd leaves datePublished undefined when date is empty", () => {
  const jsonLd = articleJsonLd({
    title: "Untimed post",
    description: "",
    date: "",
    slug: "untimed-post",
    tags: [],
  });

  assert.equal(jsonLd.datePublished, undefined);
  assert.equal(jsonLd.keywords, "");
});
