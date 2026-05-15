import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = {
  name: "World Cup in Miami",
  url: "https://worldcupinmiami.com",
  image: "/images/wcim_soccer_ball_miami_background.png",
};

const PAGE_META = {
  "/": {
    title: "World Cup in Miami | Events, News, Merch, Sponsors",
    description:
      "Discover Miami soccer events, World Cup watch parties, merch drops, local businesses, sponsor packages, and fan updates.",
    noIndex: false,
  },
  "/shop": {
    title: "Miami World Cup Merch Shop | World Cup in Miami",
    description:
      "Shop Miami-inspired soccer fanwear, merch drops, bundles, hats, hoodies, tees, and match-week products.",
    noIndex: false,
  },
  "/advertise": {
    title: "Advertise With World Cup in Miami",
    description:
      "Explore sponsor packages, ad inventory, featured business placements, map pins, news sponsorships, and local advertising opportunities.",
    noIndex: false,
  },
  "/admin/review": {
    title: "Admin Review Queue | World Cup in Miami",
    description:
      "Private WCIM admin review queue for submitted promotions, leads, and sponsor opportunities.",
    noIndex: true,
  },
};

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return SITE.url;

  if (String(pathOrUrl).startsWith("http")) {
    return pathOrUrl;
  }

  return `${SITE.url}${String(pathOrUrl).startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function setMeta(attribute, key, content) {
  if (!content) return;

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export default function SEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = PAGE_META[location.pathname] || PAGE_META["/"];
    const canonicalUrl = absoluteUrl(location.pathname);
    const imageUrl = absoluteUrl(SITE.image);

    document.title = meta.title;

    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.noIndex ? "noindex,nofollow" : "index,follow");

    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", imageUrl);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", imageUrl);

    setCanonical(canonicalUrl);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description: PAGE_META["/"].description,
    };

    let script = document.head.querySelector('script[data-wcim-seo="jsonld"]');

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-wcim-seo", "jsonld");
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(jsonLd);
  }, [location.pathname]);

  return null;
}
