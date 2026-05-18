import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = {
  name: "World Cup in Miami",
  url: "https://www.worldcupinmiami.com",
  image: "/images/wcim_soccer_ball_miami_background.png",
};

const ROUTE_META = {
  "/": {
    title: "World Cup in Miami | Events, News, Sponsors",
    description:
      "Discover Miami soccer events, World Cup watch parties, local businesses, sponsor opportunities, and fan updates.",
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

function absoluteUrl(value) {
  if (!value) return SITE.url;
  const normalized = String(value);
  if (normalized.startsWith("http")) return normalized;
  return `${SITE.url}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}

function setMeta(attribute, key, content) {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

export default function SEO() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] || ROUTE_META["/"];
    const pageUrl = absoluteUrl(location.pathname);
    const imageUrl = absoluteUrl(SITE.image);

    document.title = meta.title;

    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.noIndex ? "noindex,nofollow" : "index,follow");

    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:image", imageUrl);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", imageUrl);

    setCanonical(pageUrl);

    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      description: ROUTE_META["/"].description,
    };

    let script = document.head.querySelector('script[data-wcim-seo="jsonld"]');

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-wcim-seo", "jsonld");
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
  }, [location.pathname]);

  return null;
}
