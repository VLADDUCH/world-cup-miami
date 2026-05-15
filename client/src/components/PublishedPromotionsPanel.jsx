import React, { useEffect, useState } from "react";
import {
  getPublishedPromotionBusinesses,
  getPublishedPromotionEvents,
  getPublishedPromotionMapPins,
  getPublishedPromotionSponsors,
} from "../services/wcimApi";
import styles from "../styles/Home.module.css";

const DEFAULT_IMAGE = "/images/wcim_soccer_ball_miami_background.png";

function PromoImage({ src, alt }) {
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

export default function PublishedPromotionsPanel() {
  const [businesses, setBusinesses] = useState([]);
  const [events, setEvents] = useState([]);
  const [pins, setPins] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let ignore = false;

    async function loadPublishedPromotions() {
      try {
        const [businessResult, eventResult, pinResult, sponsorResult] = await Promise.allSettled([
          getPublishedPromotionBusinesses(),
          getPublishedPromotionEvents(),
          getPublishedPromotionMapPins(),
          getPublishedPromotionSponsors(),
        ]);

        if (ignore) return;

        if (businessResult.status === "fulfilled") {
          setBusinesses(businessResult.value || []);
        }

        if (eventResult.status === "fulfilled") {
          setEvents(eventResult.value.events || []);
        }

        if (pinResult.status === "fulfilled") {
          setPins(pinResult.value || []);
        }

        if (sponsorResult.status === "fulfilled") {
          setSponsors(sponsorResult.value || []);
        }

        setMode("ready");
      } catch (error) {
        if (!ignore) {
          setMode("fallback");
        }
      }
    }

    loadPublishedPromotions();

    return () => {
      ignore = true;
    };
  }, []);

  const totalPublished = businesses.length + events.length + pins.length + sponsors.length;

  return (
    <section className={styles.publishedPromotionsSection} id="published-promotions">
      <div className={styles.sectionHeading}>
        <div>
          <p>Approved Promotions</p>
          <h2>Published local businesses, events, map pins, and sponsor placements</h2>
        </div>
        <a href="#submit">Submit Your Business</a>
      </div>

      <div className={styles.publishedStatsBar}>
        <div>
          <span>Status</span>
          <strong>{mode}</strong>
        </div>
        <div>
          <span>Total Published</span>
          <strong>{totalPublished}</strong>
        </div>
        <div>
          <span>Businesses</span>
          <strong>{businesses.length}</strong>
        </div>
        <div>
          <span>Events</span>
          <strong>{events.length}</strong>
        </div>
        <div>
          <span>Sponsors</span>
          <strong>{sponsors.length}</strong>
        </div>
      </div>

      {totalPublished === 0 ? (
        <article className={styles.publishedEmptyCard}>
          <span>Revenue inventory pending</span>
          <h3>No approved promotions published yet</h3>
          <p>
            Once submissions are approved in the admin review dashboard, they will be available
            as public business listings, event cards, map pins, and sponsor placements.
          </p>
          <a href="#submit">Add Your Flyer / Business</a>
        </article>
      ) : (
        <div className={styles.publishedGrid}>
          {businesses.slice(0, 4).map((business) => (
            <article className={styles.publishedCard} key={business.id}>
              <span>{business.sponsorTier || "business"}</span>
              <h3>{business.name}</h3>
              <p>{business.description}</p>
              <small>{business.category} • {business.area}</small>
              {business.website ? <a href={business.website}>Visit Business</a> : null}
            </article>
          ))}

          {events.slice(0, 4).map((event) => (
            <article className={styles.publishedCard} key={event.id}>
              <div className={styles.publishedImage}>
                <PromoImage src={event.imageUrl} alt={event.title} />
              </div>
              <span>{event.category}</span>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <small>{event.startDate} {event.startTime ? `• ${event.startTime}` : ""}</small>
              <a href={event.url || "#"}>View Event</a>
            </article>
          ))}

          {sponsors.slice(0, 4).map((sponsor) => (
            <article className={styles.publishedCard} key={sponsor.id}>
              <span>{sponsor.approvedPlacement}</span>
              <h3>{sponsor.businessName}</h3>
              <p>{sponsor.message}</p>
              <small>{sponsor.category} • {sponsor.budgetLabel}</small>
              <a href="#submit">Sponsor Placement</a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
