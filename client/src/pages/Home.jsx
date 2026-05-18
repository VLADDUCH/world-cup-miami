import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getApiStatus,
  getBusinessMapPins,
  getDailyNews,
  getFeaturedBusinesses,
  getNewsByCategory,
  getNewsCategories,
  getStreamingNews,
} from "../services/wcimApi";
import styles from "../styles/Home.module.css";
import EventsFeedPanel from "../components/EventsFeedPanel";
import SubmissionPanel from "../components/SubmissionPanel";
import PublishedPromotionsPanel from "../components/PublishedPromotionsPanel";

import AdInventoryPreview from "../components/AdInventoryPreview";
import EmailCapturePanel from "../components/EmailCapturePanel";

const DEFAULT_BACKGROUND = "/images/wcim_soccer_ball_miami_background.png";
const DEFAULT_NEWS_IMAGE = "/images/hero-skyline.jpg";

const MIAMI_KICKOFF_TARGET = "2026-06-15T18:00:00-04:00";

function getMiamiKickoffCountdown() {
  const targetTime = new Date(MIAMI_KICKOFF_TARGET).getTime();
  const now = Date.now();
  const totalSeconds = Math.max(0, Math.floor((targetTime - now) / 1000));

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isLive: totalSeconds === 0,
  };
}

const FALLBACK_MAP_PINS = [
  {
    id: "bayfront-park-downtown",
    name: "Bayfront Park",
    category: "Fan Festival Area",
    area: "Downtown",
    address: "301 Biscayne Blvd, Miami, FL 33132",
    lat: 25.7743,
    lng: -80.187,
    featured: true,
    sponsorTier: "featured",
  },
  {
    id: "wynwood-marketplace",
    name: "Wynwood Marketplace",
    category: "Watch Party / Events",
    area: "Wynwood",
    address: "2250 NW 2nd Ave, Miami, FL 33127",
    lat: 25.8004,
    lng: -80.1994,
    featured: true,
    sponsorTier: "featured",
  },
  {
    id: "hard-rock-stadium-area",
    name: "Hard Rock Stadium Area",
    category: "Match Area",
    area: "Miami Gardens",
    address: "347 Don Shula Drive, Miami Gardens, FL 33056",
    lat: 25.958,
    lng: -80.2389,
    featured: true,
    sponsorTier: "featured",
  },
];

const FALLBACK_NEWS = [
  {
    id: "fallback-miami-world-cup",
    title: "Miami is getting ready to welcome the world",
    description:
      "From fan zones and watch parties to local restaurants, nightlife, and match-day movement, World Cup in Miami helps you feel where the city is coming alive before you even arrive.",
    source: "World Cup in Miami",
    url: "/",
    imageUrl: DEFAULT_BACKGROUND,
    category: "miami-world-cup",
  },
  {
    id: "fallback-watch-parties",
    title: "Watch parties are becoming part of Miami’s World Cup heartbeat",
    description:
      "Fans can discover the restaurants, sports bars, rooftops, lounges, and neighborhood spots where the match-day energy is already building.",
    source: "World Cup in Miami",
    url: "/#map",
    imageUrl: DEFAULT_BACKGROUND,
    category: "watch-parties",
  },
  {
    id: "fallback-business",
    title: "Local businesses can step into the fan journey",
    description:
      "Restaurants, bars, venues, explores, and fan-focused businesses can get discovered while visitors are choosing where to eat, watch, explore, and celebrate.",
    source: "World Cup in Miami",
    url: "/#business",
    imageUrl: DEFAULT_BACKGROUND,
    category: "business-promotions",
  },
];

const FALLBACK_CATEGORIES = [
  {
    slug: "miami-world-cup",
    label: "Miami World Cup",
    homepageLabel: "Miami World Cup Updates",
  },
  {
    slug: "match-day-updates",
    label: "Match-Day Updates",
    homepageLabel: "Match-Day Updates",
  },
  {
    slug: "watch-parties",
    label: "Watch Parties",
    homepageLabel: "Watch Parties",
  },
  {
    slug: "fan-zone-events",
    label: "Fan Zone Events",
    homepageLabel: "Fan Zone Events",
  },
  {
    slug: "team-fan-communities",
    label: "Team Fan Communities",
    homepageLabel: "Team Fan Communities",
  },
];

const MIAMI_MATCHES = [
  {
    date: "June 15",
    time: "6:00 PM",
    match: "Saudi Arabia vs Uruguay",
    label: "Miami’s first wave of global match energy",
  },
  {
    date: "June 21",
    time: "6:00 PM",
    match: "Uruguay vs Cape Verde",
    label: "A night for cultures, colors, chants, and new fan connections",
  },
  {
    date: "June 24",
    time: "6:00 PM",
    match: "Scotland vs Brazil",
    label: "Brazil energy meets Miami heat — expect color, music, and movement",
  },
  {
    date: "June 27",
    time: "7:30 PM",
    match: "Colombia vs Portugal",
    label: "A massive South Florida fan moment with pride on every side",
  },
  {
    date: "July 3",
    time: "6:00 PM",
    match: "Round of 32",
    label: "The pressure rises, the city tightens, and every fan starts watching closer",
  },
  {
    date: "July 11",
    time: "5:00 PM",
    match: "Quarter-final",
    label: "A premium football moment where Miami feels like the center of the world",
  },
  {
    date: "July 18",
    time: "5:00 PM",
    match: "Bronze Final",
    label: "One final weekend wave of fans, memories, photos, and citywide celebration",
  },
];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function isExternalUrl(url = "") {
  return url.startsWith("http://") || url.startsWith("https://");
}

function ArticleImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(src || DEFAULT_BACKGROUND);

  useEffect(() => {
    setImageSrc(src || DEFAULT_BACKGROUND);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImageSrc(DEFAULT_BACKGROUND)}
    />
  );
}

function ArticleLink({ article, className, children }) {
  const href = article?.url || "#";

  if (isExternalUrl(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [mapPins, setMapPins] = useState(FALLBACK_MAP_PINS);
  const [streamingNews, setStreamingNews] = useState(FALLBACK_NEWS);
  const [dailyArticle, setDailyArticle] = useState(FALLBACK_NEWS[0]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("miami-world-cup");
  const [categoryArticles, setCategoryArticles] = useState(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState("fallback");
  const [apiError, setApiError] = useState("");
  const [kickoffCountdown, setKickoffCountdown] = useState(() => getMiamiKickoffCountdown());

  useEffect(() => {
    setKickoffCountdown(getMiamiKickoffCountdown());

    const timer = window.setInterval(() => {
      setKickoffCountdown(getMiamiKickoffCountdown());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadHomepageData() {
      try {
        setLoading(true);
        setApiError("");

        const [
          statusResult,
          businessesResult,
          pinsResult,
          newsResult,
          dailyResult,
          categoriesResult,
        ] = await Promise.allSettled([
          getApiStatus(),
          getFeaturedBusinesses(),
          getBusinessMapPins(),
          getStreamingNews(6),
          getDailyNews(),
          getNewsCategories(),
        ]);

        if (ignore) return;

        if (statusResult.status === "fulfilled") {
          setApiStatus(statusResult.value);
        }

        if (businessesResult.status === "fulfilled") {
          setFeaturedBusinesses(businessesResult.value);
        }

        if (pinsResult.status === "fulfilled" && pinsResult.value.length > 0) {
          setMapPins(pinsResult.value);
        }

        if (newsResult.status === "fulfilled") {
          setStreamingNews(newsResult.value.articles || FALLBACK_NEWS);
          setFeedMode(newsResult.value.mode || "fallback");
        }

        if (dailyResult.status === "fulfilled" && dailyResult.value.article) {
          setDailyArticle(dailyResult.value.article);
        }

        if (categoriesResult.status === "fulfilled" && categoriesResult.value.length > 0) {
          setCategories(categoriesResult.value);
          setActiveCategory(categoriesResult.value[0].slug);
        }
      } catch (error) {
        if (!ignore) {
          setApiError("Miami is warming up. Showing local highlights while fresh city updates continue to load.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadHomepageData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadCategoryArticles() {
      try {
        const result = await getNewsByCategory(activeCategory, 4);

        if (!ignore) {
          setCategoryArticles(result.articles || FALLBACK_NEWS);
        }
      } catch (error) {
        if (!ignore) {
          setCategoryArticles(
            FALLBACK_NEWS.filter((article) => article.category === activeCategory).length > 0
              ? FALLBACK_NEWS.filter((article) => article.category === activeCategory)
              : FALLBACK_NEWS
          );
        }
      }
    }

    if (activeCategory) {
      loadCategoryArticles();
    }

    return () => {
      ignore = true;
    };
  }, [activeCategory]);

  const bounds = useMemo(() => {
    const validPins = mapPins.filter(
      (location) => Number.isFinite(location.lat) && Number.isFinite(location.lng)
    );

    if (validPins.length === 0) {
      return L.latLngBounds(FALLBACK_MAP_PINS.map((pin) => [pin.lat, pin.lng]));
    }

    return L.latLngBounds(validPins.map((pin) => [pin.lat, pin.lng]));
  }, [mapPins]);

  const activeCategoryLabel =
    categories.find((category) => category.slug === activeCategory)?.homepageLabel ||
    "Miami World Cup Updates";

  return (
    <main className={styles.page}>
      <header className={styles.nav}>
        <Link to="/" className={styles.brand} aria-label="World Cup in Miami home">
          <span className={styles.logoOrb}>
            <span className={styles.logoBall}>⚽</span>
          </span>
          <span className={styles.brandText}>
            <strong>WORLD CUP</strong>
            <span>IN MIAMI</span>
          </span>
        </Link>

        <nav className={styles.navLinks} aria-label="Main navigation">
          <a href="#matches">Matches</a>
          <a href="#map">Map</a>
          <a href="#business">Businesses</a>
          <a href="#explore">explore fan culture</a>
          <a href="#news">Miami Is Getting Ready</a>
        </nav>

        <a className={styles.advertiseTopBtn} href="#business">
          Claim a Featured Spot
        </a>
      </header>

      <section className={styles.heroShell}>
        <section className={styles.heroText}>
          <div className={styles.kicker}>Your Miami matchweek guide • live updates • fan experiences • places to celebrate</div>

          <h1>
            The World Is Coming to <span>Miami</span> — Feel It First
          </h1>

          <p className={styles.heroCopy}>
            One city. One energy. One unforgettable football experience. Find matches,
            fan zones, Miami updates, local businesses, watch parties, and Miami-first fan experiences.
          </p>

          <div className={styles.heroActions}>
            <a href="#matches" className={styles.primaryBtn}>View the Miami Match Schedule</a>
            <a href="#business" className={styles.secondaryBtn}>Get Seen by Miami Fans</a>
          </div>

          <div className={styles.apiFeedStatus}>
            <span className={styles.statusDot} />
            <span>
              Miami update system: {apiStatus?.status === "ok" ? "connected" : "warming up"} • News: {feedMode}
            </span>
          </div>

          {apiError ? <p className={styles.feedWarning}>{apiError}</p> : null}

          <div className={styles.countdownCard}>
            <p>{kickoffCountdown.isLive ? "Miami kickoff is live" : "The countdown to Miami’s football takeover has begun"}</p>
            <div className={styles.countdownGrid}>
              <span><strong>{kickoffCountdown.days}</strong><small>Days</small></span>
              <span><strong>{String(kickoffCountdown.hours).padStart(2, "0")}</strong><small>Hrs</small></span>
              <span><strong>{String(kickoffCountdown.minutes).padStart(2, "0")}</strong><small>Mins</small></span>
              <span><strong>{String(kickoffCountdown.seconds).padStart(2, "0")}</strong><small>Secs</small></span>
            </div>
          </div>
        </section>

        <section className={styles.heroVisual} aria-label="Miami skyline soccer ball background">
          <div className={styles.heroImage} />
          <div className={styles.heroImageGlow} />
        </section>

        <aside className={styles.sidePanel} id="news">
          <div className={styles.panelHeader}>
            <h2>Miami Is Getting Ready</h2>
            <a href="#newsTabs">{loading ? "Loading" : "City Pulse"}</a>
          </div>

          <article className={styles.dailyArticleCard}>
            <div className={styles.dailyImageWrap}>
              <ArticleImage src={dailyArticle?.imageUrl} alt={dailyArticle?.title || "Daily Miami update"} />
            </div>
            <div>
              <span>Featured Miami Moment</span>
              <h3>{dailyArticle?.title}</h3>
              <p>{dailyArticle?.description}</p>
              <ArticleLink article={dailyArticle}>Explore the Update</ArticleLink>
            </div>
          </article>

          <div className={styles.newsList}>
            {streamingNews.slice(0, 3).map((article) => (
              <article className={styles.newsItem} key={article.id || article.title}>
                <div className={styles.newsThumbImage}>
                  <ArticleImage src={article.imageUrl} alt={article.title} />
                </div>
                <div>
                  <h3>{article.title}</h3>
                  <p>{article.source || "World Cup in Miami"}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.businessCallout} id="business">
            <h2>Bring Fans to Your Door</h2>
            <p>
              Reach fans looking for watch parties, food, nightlife, fan experiences, local events,
              and match-day places to go.
            </p>
            <a href="mailto:info@worldcupinmiami.com?subject=Add%20My%20Business%20to%20World%20Cup%20in%20Miami">
              Get Seen by Miami Fans
            </a>
          </div>
        </aside>
      </section>

      <section className={styles.quickCards}>
        <article className={styles.card} id="matches">
          <div className={styles.cardTopline}>Next Miami Match Moment</div>
          <h2>Saudi Arabia vs Uruguay</h2>
          <p>June 15 • 6:00 PM • Miami Gardens</p>
          <a href="#schedule">Plan Around This Match</a>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTopline}>Always Moving With Miami</div>
          <h2>Fresh Updates + Local Discoveries</h2>
          <p>Every update, featured place, and fan experience is designed to help visitors move through Miami with confidence, excitement, and something new to discover.</p>
          <a href="#newsTabs">See What’s Happening</a>
        </article>

        <article className={styles.card} id="explore">
          <div className={styles.cardTopline}>explore fan culture</div>
          <h2>Put Miami on Your Chest</h2>
          <p>This is more than a visit. It is the photo, the watch party, the stadium walk, the memory, and the feeling of saying: I was in Miami when the world showed up.</p>
          <a href="#explore">explore fan culture</a>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTopline}>Be Where Fans Decide</div>
          <h2>Featured Local Moments</h2>
          <p>Place your brand in the path of fans who are already looking for where to go, what to eat, what to experience, and where to celebrate next.</p>
          <a href="#submit">Claim a Featured Spot</a>
        </article>
      </section>

      <section className={styles.newsTabsSection} id="newsTabs">
        <div className={styles.sectionHeading}>
          <div>
            <p>The Miami Matchweek Pulse</p>
            <h2>Feel the rhythm of Miami matchweek — from big matches and watch parties to local events, fan hotspots, and the places everyone will be talking about.</h2>
          </div>
        </div>

        <div className={styles.categoryTabs} role="tablist" aria-label="News categories">
          {categories.map((category) => (
            <button
              type="button"
              key={category.slug}
              className={`${styles.categoryButton} ${
                activeCategory === category.slug ? styles.categoryButtonActive : ""
              }`}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.homepageLabel || category.label}
            </button>
          ))}
        </div>

        <div className={styles.categoryFeedGrid}>
          <article className={styles.categoryLeadCard}>
            <p>{activeCategoryLabel}</p>
            <h2>{categoryArticles[0]?.title || "Miami World Cup Updates"}</h2>
            <span>{categoryArticles[0]?.description}</span>
            <ArticleLink article={categoryArticles[0]} className={styles.inlineReadMore}>
              Open the Moment
            </ArticleLink>
          </article>

          <div className={styles.categoryArticleList}>
            {categoryArticles.slice(0, 4).map((article) => (
              <article className={styles.categoryArticle} key={article.id || article.title}>
                <ArticleImage src={article.imageUrl} alt={article.title} />
                <div>
                  <h3>{article.title}</h3>
                  <p>{article.source || "World Cup in Miami"}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      <EventsFeedPanel />

      <PublishedPromotionsPanel />

      <AdInventoryPreview />

      <EmailCapturePanel />









      <section className={styles.mapSection} id="map">
        <div className={styles.sectionHeading}>
          <div>
            <p>Explore Miami Through the World Cup Map</p>
            <h2>Move through Miami before you arrive — discover fan zones, watch parties, featured businesses, stadium areas, and places where the city will feel alive.</h2>
          </div>
          <a href="#submit">Add Your Spot</a>
        </div>

        <div className={styles.mapLayout}>
          <div className={styles.mapFrame}>
            <MapContainer
              className={styles.leafletMap}
              bounds={bounds}
              boundsOptions={{ padding: [35, 35] }}
              zoomControl={false}
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              />
              <ZoomControl position="topright" />

              {mapPins.map((location) => (
                <Marker
                  key={`${location.id || location.name}-${location.lat}-${location.lng}`}
                  position={[location.lat, location.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <strong>{location.name}</strong>
                    <br />
                    {location.category}
                    <br />
                    {location.area}
                    <br />
                    {location.address}
                    <br />
                    {location.featured ? "Featured listing" : "Standard listing"}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className={styles.locationPanel}>
            <h3>Miami Hotspots Loaded</h3>
            <p>{mapPins.length} Miami locations loaded from the WCIM backend map feed.</p>

            <div className={styles.locationList}>
              {mapPins.map((location) => (
                <div className={styles.locationItem} key={location.id || location.name}>
                  <div>
                    <strong>{location.name}</strong>
                    <span>{location.area} • {location.category}</span>
                  </div>
                  <small>{Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      <SubmissionPanel />

      <section className={styles.featuredBusinessSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p>Miami Places Fans Can Discover</p>
            <h2>Featured local spots where fans can gather, celebrate, explore, and turn matchday into a full Miami experience.</h2>
          </div>
          <a href="#submit">Feature My Business</a>
        </div>

        <div className={styles.featuredBusinessGrid}>
          {(featuredBusinesses.length > 0 ? featuredBusinesses : mapPins.filter((pin) => pin.featured)).slice(0, 5).map((business) => (
            <article className={styles.featuredBusinessCard} key={business.id || business.name}>
              <span>{business.sponsorTier || "featured"}</span>
              <h3>{business.name}</h3>
              <p>{business.category} • {business.area}</p>
              <small>{business.address}</small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.scheduleSection} id="schedule">
        <div className={styles.sectionHeading}>
          <div>
            <p>Plan Your Miami Matchweek</p>
            <h2>Every match is more than a kickoff. It is a reason to plan the day, choose the spot, wear the colors, meet the crowd, and feel Miami before the whistle blows.</h2>
          </div>
        </div>

        <div className={styles.scheduleGrid}>
          {MIAMI_MATCHES.map((match) => (
            <article className={styles.matchCard} key={`${match.date}-${match.match}`}>
              <div className={styles.matchDate}>{match.date}</div>
              <h3>{match.match}</h3>
              <p>{match.time}</p>
              <span>{match.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.emailBar}>
        <div>
          <h2>Stay Close to the Miami Moment</h2>
          <p>Get match alerts, local event updates, and Miami experiences before the crowd catches on.</p>
        </div>

        <form className={styles.emailForm}>
          <input type="email" placeholder="Your best email" aria-label="Email address" />
          <button type="submit">Keep Me Updated</button>
        </form>
      </section>

      <footer className={styles.footer}>
        <p>
          World Cup in Miami is an independent fan and city guide. It is not affiliated
          with any tournament organizer, stadium, federation, or official event owner.
        </p>
        <div>
          <a href="#matches">Matches</a>
          <a href="#map">Map</a>
          <a href="#business">Advertise</a>
          <a href="#explore">explore</a>
        </div>
      </footer>
    </main>
  );
}
