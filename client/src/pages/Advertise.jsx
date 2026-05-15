import React, { useEffect, useMemo, useState } from "react";
import {
  getAdInventory,
  getAdPackages,
  getAdSections,
} from "../services/wcimApi";
import styles from "../styles/Advertise.module.css";

function formatPrice(slot) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: slot.currency || "USD",
    maximumFractionDigits: 0,
  }).format(slot.price || 0);
}

function labelize(value = "") {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Advertise() {
  const [slots, setSlots] = useState([]);
  const [sections, setSections] = useState([]);
  const [packages, setPackages] = useState([]);
  const [filters, setFilters] = useState({
    section: "",
    packageTier: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadInventory(nextFilters = filters) {
    try {
      setLoading(true);
      setMessage("");

      const [slotsResult, sectionsResult, packagesResult] = await Promise.all([
        getAdInventory({
          section: nextFilters.section,
          packageTier: nextFilters.packageTier,
          limit: 30,
        }),
        getAdSections(),
        getAdPackages(),
      ]);

      setSlots(slotsResult.slots || []);
      setSections(sectionsResult || []);
      setPackages(packagesResult || []);
    } catch (error) {
      setMessage(`Could not load ad inventory: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.section, filters.packageTier]);

  const premiumCount = useMemo(
    () => slots.filter((slot) => slot.packageTier === "premium").length,
    [slots]
  );

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div>
          <a href="/" className={styles.backLink}>← Back to site</a>
          <p>World Cup in Miami Advertising</p>
          <h1>Ad packages built for local revenue</h1>
          <span>
            Sell sponsorship placements for homepage visibility, news, events, shop,
            maps, featured businesses, and approved promotions.
          </span>
        </div>

        <aside>
          <strong>{slots.length}</strong>
          <span>available slots</span>
          <small>{premiumCount} premium slot(s)</small>
        </aside>
      </header>

      <section className={styles.salesStrip}>
        <article>
          <span>Step 1</span>
          <strong>Choose placement</strong>
          <p>Businesses pick a package that matches their objective.</p>
        </article>
        <article>
          <span>Step 2</span>
          <strong>Submit inquiry</strong>
          <p>The inquiry routes through the existing promotion submission form.</p>
        </article>
        <article>
          <span>Step 3</span>
          <strong>Approve + publish</strong>
          <p>Admin reviews, approves, and pushes it into public inventory.</p>
        </article>
      </section>

      <section className={styles.filters}>
        <button
          type="button"
          className={!filters.section && !filters.packageTier ? styles.activeFilter : ""}
          onClick={() => setFilters({ section: "", packageTier: "" })}
        >
          All Inventory
        </button>

        {sections.map((section) => (
          <button
            type="button"
            key={section.slug}
            className={filters.section === section.slug ? styles.activeFilter : ""}
            onClick={() => updateFilter("section", section.slug)}
          >
            {section.label} ({section.count})
          </button>
        ))}

        {packages.map((pkg) => (
          <button
            type="button"
            key={pkg.slug}
            className={filters.packageTier === pkg.slug ? styles.activeFilter : ""}
            onClick={() => updateFilter("packageTier", pkg.slug)}
          >
            {pkg.label} Tier
          </button>
        ))}
      </section>

      {message ? <section className={styles.message}>{message}</section> : null}

      <section className={styles.grid}>
        {loading ? (
          <article className={styles.emptyCard}>
            <h2>Loading ad inventory...</h2>
            <p>Pulling ad packages from the WCIM backend.</p>
          </article>
        ) : slots.length === 0 ? (
          <article className={styles.emptyCard}>
            <h2>No matching ad slots found</h2>
            <p>Clear filters or add more inventory to the backend ad catalog.</p>
          </article>
        ) : (
          slots.map((slot) => (
            <article className={styles.adCard} key={slot.id}>
              <div className={styles.adCardTop}>
                <span>{slot.packageTier}</span>
                <small>{slot.status}</small>
              </div>

              <h2>{slot.name}</h2>
              <h3>{slot.headline}</h3>
              <p>{slot.description}</p>

              <div className={styles.priceBox}>
                <strong>{formatPrice(slot)}</strong>
                <span>{slot.durationDays} days</span>
              </div>

              <div className={styles.deliverables}>
                <strong>Deliverables</strong>
                <ul>
                  {(slot.deliverables || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.recommendedFor}>
                {(slot.recommendedFor || []).slice(0, 5).map((item) => (
                  <span key={item}>{labelize(item)}</span>
                ))}
              </div>

              <a href={slot.ctaHref || "/#submit"} onClick={() => trackAdvertiseCtaClicked(slot)}>
                {slot.ctaLabel || "Request Placement"}
              </a>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
