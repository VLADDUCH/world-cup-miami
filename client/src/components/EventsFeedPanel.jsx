import React, { useEffect, useState } from "react";
import {
  getEventCategories,
  getEventsByCategory,
  getEventsFeed,
} from "../services/wcimApi";
import styles from "../styles/Home.module.css";

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

const FALLBACK_CATEGORIES = [
  { slug: "watch-parties", homepageLabel: "Watch Parties", label: "Watch Parties" },
  { slug: "fan-zone-events", homepageLabel: "Fan Zone Events", label: "Fan Zone Events" },
  { slug: "nightlife-music", homepageLabel: "Nightlife & Music", label: "Nightlife & Music" },
  { slug: "family-community", homepageLabel: "Family & Community", label: "Family & Community" },
];

const FALLBACK_EVENTS = [
  {
    id: "fallback-watch-party",
    title: "Wynwood Watch Party Energy Guide",
    description:
      "Follow the energy through Wynwood — from packed watch parties and restaurants to music, murals, nightlife, and fans turning every block into part of the celebration.",
    imageUrl: DEFAULT_IMAGE,
    startDate: "2026-06-15",
    startTime: "18:00",
    venueName: "Wynwood Area",
    city: "Miami",
    category: "watch-parties",
    provider: "wcim",
    url: "/#map",
  },
];

function EventImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(src || DEFAULT_IMAGE);

  useEffect(() => {
    setImageSrc(src || DEFAULT_IMAGE);
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      onError={() => setImageSrc(DEFAULT_IMAGE)}
    />
  );
}

function formatEventDate(event) {
  const date = event.startDate || "Match week";
  const time = event.startTime || "";
  return time ? `${date} • ${time}` : date;
}

export default function EventsFeedPanel() {
  const [events, setEvents] = useState(FALLBACK_EVENTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("watch-parties");
  const [categoryEvents, setActiveCategoryEvents] = useState(FALLBACK_EVENTS);
  const [mode, setMode] = useState("fallback");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      try {
        setLoading(true);

        const [eventsResult, categoriesResult] = await Promise.allSettled([
          getEventsFeed(6, true),
          getEventCategories(),
        ]);

        if (ignore) return;

        if (eventsResult.status === "fulfilled") {
          setEvents(eventsResult.value.events || FALLBACK_EVENTS);
          setMode(eventsResult.value.mode || "fallback");
        }

        if (categoriesResult.status === "fulfilled" && categoriesResult.value.length > 0) {
          setCategories(categoriesResult.value);
          setActiveCategory(categoriesResult.value[0].slug);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadCategoryEvents() {
      try {
        const result = await getEventsByCategory(activeCategory, 4, true);

        if (!ignore) {
          setActiveCategoryEvents(result.events || FALLBACK_EVENTS);
        }
      } catch (error) {
        if (!ignore) {
          const fallback = events.filter((event) => event.category === activeCategory);
          setActiveCategoryEvents(fallback.length > 0 ? fallback : FALLBACK_EVENTS);
        }
      }
    }

    if (activeCategory) {
      loadCategoryEvents();
    }

    return () => {
      ignore = true;
    };
  }, [activeCategory, events]);

  return (
    <section className={styles.eventsSection} id="events">
      <div className={styles.sectionHeading}>
        <div>
          <p>Where Miami Comes Alive</p>
          <h2>Find the watch parties, fan zones, nightlife, family events, and neighborhood moments that turn matchday into a Miami memory.</h2>
        </div>
        <a href="#business">Promote Your Event</a>
      </div>

      <div className={styles.eventsStatusBar}>
        <span className={styles.statusDot} />
        <strong>Local event pulse:</strong>
        <span>{loading ? "loading" : mode}</span>
        <small>Showing local WCIM event highlights now. More live event sources can connect as Miami’s matchweek calendar grows.</small>
      </div>

      <div className={styles.eventTabs} role="tablist" aria-label="Event categories">
        {categories.map((category) => (
          <button
            type="button"
            key={category.slug}
            className={`${styles.eventTabButton} ${
              activeCategory === category.slug ? styles.eventTabButtonActive : ""
            }`}
            onClick={() => setActiveCategory(category.slug)}
          >
            {category.homepageLabel || category.label}
          </button>
        ))}
      </div>

      <div className={styles.eventsLayout}>
        <article className={styles.eventLeadCard}>
          <p>{categoryEvents[0]?.venueName || "Miami Event"}</p>
          <h3>{categoryEvents[0]?.title || "Miami Match Week Events"}</h3>
          <span>{categoryEvents[0]?.description}</span>
          <small>{formatEventDate(categoryEvents[0] || {})}</small>
        </article>

        <div className={styles.eventCardGrid}>
          {categoryEvents.slice(0, 4).map((event) => (
            <article className={styles.eventCard} key={event.id || event.title}>
              <div className={styles.eventImageWrap}>
                <EventImage src={event.imageUrl} alt={event.title} />
              </div>

              <div className={styles.eventCardBody}>
                <span>{event.category || "event"}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>

                <div className={styles.eventMeta}>
                  <strong>{formatEventDate(event)}</strong>
                  <small>{event.venueName} • {event.city}</small>
                </div>

                <a href={event.url || "#"}>Explore This Moment</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
