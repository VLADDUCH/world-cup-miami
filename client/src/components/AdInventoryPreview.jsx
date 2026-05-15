import React, { useEffect, useState } from "react";
import { getFeaturedAdSlots } from "../services/wcimApi";
import { trackAdvertiseCtaClicked } from "../services/analyticsTracker";
import styles from "../styles/Home.module.css";

function formatPrice(slot) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: slot.currency || "USD",
    maximumFractionDigits: 0,
  }).format(slot.price || 0);
}

export default function AdInventoryPreview() {
  const [slots, setSlots] = useState([]);
  const [mode, setMode] = useState("loading");

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      try {
        const data = await getFeaturedAdSlots(4);

        if (!ignore) {
          setSlots(data.slots || []);
          setMode("ready");
        }
      } catch (error) {
        if (!ignore) {
          setMode("fallback");
        }
      }
    }

    loadSlots();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className={styles.adPreviewSection} id="advertise">
      <div className={styles.sectionHeading}>
        <div>
          <p>Advertise With WCIM</p>
          <h2>Sell clear sponsor placements to Miami businesses</h2>
        </div>
        <a href="/advertise">View Ad Packages</a>
      </div>

      <div className={styles.adPreviewStatus}>
        <span className={styles.statusDot} />
        <strong>Ad inventory:</strong>
        <span>{mode}</span>
        <small>Manual inquiry flow connected to the existing submission form.</small>
      </div>

      <div className={styles.adPreviewGrid}>
        {slots.map((slot) => (
          <article className={styles.adPreviewCard} key={slot.id}>
            <span>{slot.packageTier}</span>
            <h3>{slot.name}</h3>
            <p>{slot.description}</p>

            <div className={styles.adPreviewMeta}>
              <strong>{formatPrice(slot)}</strong>
              <small>{slot.durationDays} days • {slot.status}</small>
            </div>

            <a href={slot.ctaHref || "/#submit"} onClick={() => trackAdvertiseCtaClicked(slot)}>{slot.ctaLabel || "Request Placement"}</a>
          </article>
        ))}
      </div>
    </section>
  );
}
