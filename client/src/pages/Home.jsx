import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import styles from "../styles/Home.module.css";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Fan-zone / experience pins (ALL 12)
 */
const LOCATIONS = [
  { name: "Bayfront Park", area: "Downtown", address: "301 Biscayne Blvd, Miami, FL 33132", lat: 25.7743, lng: -80.1870 },
  { name: "Wynwood Marketplace", area: "Wynwood", address: "2250 NW 2nd Ave, Miami, FL 33127", lat: 25.8004, lng: -80.1994 },
  { name: "The Clevelander South Beach", area: "Miami Beach", address: "1020 Ocean Dr, Miami Beach, FL 33139", lat: 25.7813, lng: -80.1300 },
  { name: "Grails Sports Bar", area: "Wynwood", address: "2800 N Miami Ave, Miami, FL 33127", lat: 25.8021, lng: -80.1947 },
  { name: "Fritz & Franz Bierhaus", area: "Coral Gables", address: "60 Merrick Way, Coral Gables, FL 33134", lat: 25.7337, lng: -80.2610 },
  { name: "Cervecería La Tropical", area: "Wynwood", address: "42 NE 25th St, Miami, FL 33137", lat: 25.7992, lng: -80.1928 },
  { name: "The Doral Yard", area: "Doral", address: "8455 NW 53rd St, Suite 106, Doral, FL 33166", lat: 25.8266, lng: -80.3326 },
  { name: "Bayshore Club", area: "Coconut Grove", address: "3391 Pan American Dr, Miami, FL 33133", lat: 25.7285, lng: -80.2362 },
  { name: "American Social", area: "Brickell", address: "690 SW 1st Ct, Miami, FL 33130", lat: 25.7665, lng: -80.1933 },
  { name: "Black Market Miami", area: "Downtown", address: "168 SE 1st St, Miami, FL 33131", lat: 25.7730, lng: -80.1893 },
  { name: "Sports & Social (Dolphin Mall)", area: "Near Stadium", address: "11401 NW 12th St, Miami, FL 33172", lat: 25.7905, lng: -80.3796 },
  { name: "Hard Rock Stadium", area: "Miami Gardens", address: "347 Don Shula Drive, Miami Gardens, FL 33056", lat: 25.9580, lng: -80.2389 },
];

/**
 * Matches in Miami (your list)
 */
const MIAMI_MATCH_SCHEDULE = {
  groupStage: [
    { date: "June 15", time: "6:00 PM", teams: [{ name: "Saudi Arabia", iso2: "sa" }, { name: "Uruguay", iso2: "uy" }] },
    { date: "June 21", time: "6:00 PM", teams: [{ name: "Uruguay", iso2: "uy" }, { name: "Cabo Verde (Cape Verde)", iso2: "cv" }] },
    { date: "June 24", time: "6:00 PM", teams: [{ name: "Scotland", iso2: "sco" }, { name: "Brazil", iso2: "br" }] },
    { date: "June 27", time: "7:30 PM", teams: [{ name: "Colombia", iso2: "co" }, { name: "Portugal", iso2: "pt" }] },
  ],
  knockout: [
    { date: "July 3", time: "6:00 PM", matchup: "Round of 32 (Match 86: 1J vs. 2H)" },
    { date: "July 11", time: "5:00 PM", matchup: "Quarter-final (Match 99)" },
    { date: "July 18", time: "5:00 PM", matchup: "Bronze Final (Match 103)" },
  ],
};

/**
 * 7 Country Fan Zone Finder (your concept)
 */
const FANZONE_COUNTRIES = [
  { name: "Brazil", iso2: "br", vibe: "South Beach / Little Havana crossover energy" },
  { name: "Argentina", iso2: "ar", vibe: "Brickell watch-party crowd" },
  { name: "Colombia", iso2: "co", vibe: "Doral + Wynwood nightlife flow" },
  { name: "Mexico", iso2: "mx", vibe: "Wynwood + Downtown rally zones" },
  { name: "Haiti", iso2: "ht", vibe: "Little Haiti + North Miami pulse" },
  { name: "Uruguay", iso2: "uy", vibe: "Coral Gables / Downtown match nights" },
  { name: "Portugal", iso2: "pt", vibe: "Brickell + Miami Beach late matches" },
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

/**
 * ✅ Flags WITHOUT any package:
 * - Normal countries: flagcdn.com (iso2)
 * - Scotland: use Wikimedia SVG
 */
function Flag({ iso2, label }) {
  const code = (iso2 || "").toLowerCase();

  const isScotland = code === "sco";
  const src = isScotland
    ? "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg"
    : `https://flagcdn.com/w40/${code}.png`;

  const srcSet = isScotland
    ? undefined
    : `https://flagcdn.com/w80/${code}.png 2x`;

  return (
    <img
      className={styles.flagIcon}
      src={src}
      srcSet={srcSet}
      alt={`${label} flag`}
      title={label}
      loading="lazy"
    />
  );
}

export default function Home() {
  const [showMap, setShowMap] = useState(true);

  // stacked sections (order of clicks)
  const [openSections, setOpenSections] = useState([]);
  const whiteAreaRef = useRef(null);

  const bounds = useMemo(() => {
    const b = L.latLngBounds([]);
    LOCATIONS.forEach((p) => b.extend([p.lat, p.lng]));
    return b;
  }, []);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => {
      const exists = prev.includes(sectionId);
      const next = exists ? prev.filter((x) => x !== sectionId) : [...prev, sectionId];

      // when opening a new section, scroll to white area
      if (!exists) {
        requestAnimationFrame(() => {
          whiteAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const isOpen = (sectionId) => openSections.includes(sectionId);

  const renderTeams = (m) => {
    if (!m?.teams || m.teams.length !== 2) return null;
    const [a, b] = m.teams;

    return (
      <span className={styles.matchTeams}>
        <span className={styles.team}>
          <Flag iso2={a.iso2} label={a.name} />
          <span className={styles.teamName}>{a.name}</span>
        </span>

        <span className={styles.vsText}>vs.</span>

        <span className={styles.team}>
          <Flag iso2={b.iso2} label={b.name} />
          <span className={styles.teamName}>{b.name}</span>
        </span>
      </span>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandText}>
              <div className={styles.brandTop}>WORLD CUP</div>
              <div className={styles.brandBottom}>IN MIAMI</div>
            </span>
          </Link>

          <nav className={styles.navLinks}>
            <Link className={styles.navLink} to="/matches">Matches</Link>
            <Link className={styles.navLink} to="/tickets">Tickets</Link>
            <Link className={styles.navLink} to="/venues">Venues</Link>
            <Link className={styles.navLink} to="/fan-zone">Fan Zone</Link>
          </nav>

          <Link to="/tickets" className={styles.navCta}>Get Tickets</Link>
        </div>
      </header>

      <section
        className={styles.hero}
        style={{ backgroundImage: `url("/images/hero-miami-skyline.jpg")` }}
      >
        <div className={styles.heroOverlay}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              WORLD CUP <span className={styles.heroAccent}>IN MIAMI</span>
            </h1>

            <p className={styles.heroSub}>
              Matchday energy. Fan zones. Venues. The full Miami experience.
            </p>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={`${styles.primaryBtn} ${isOpen("matches") ? styles.primaryBtnActive : ""}`}
                onClick={() => toggleSection("matches")}
                aria-pressed={isOpen("matches")}
              >
                {isOpen("matches") ? "Hide Matches" : "Explore Matches"}
              </button>

              <button
                type="button"
                className={`${styles.primaryBtn} ${styles.fanFinderBtn} ${isOpen("fanFinder") ? styles.primaryBtnActive : ""}`}
                onClick={() => toggleSection("fanFinder")}
                aria-pressed={isOpen("fanFinder")}
              >
                {isOpen("fanFinder") ? "Hide Fan Zone Finder™" : "Fan Zone Finder™"}
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? "Hide Fan Zone Map" : "Show Fan Zone Map"}{" "}
                <span className={styles.caret}>↗</span>
              </button>
            </div>

            {showMap && (
              <div className={styles.mapCard}>
                <div className={styles.mapHeader}>
                  <div>
                    <div className={styles.mapTitle}>Fan Zone Map</div>
                    <div className={styles.mapMeta}>Pins loaded: {LOCATIONS.length}/{LOCATIONS.length}</div>
                  </div>
                </div>

                <div className={styles.mapGrid}>
                  <div className={styles.mapWrap}>
                    <MapContainer
                      className={styles.leafletMap}
                      bounds={bounds}
                      boundsOptions={{ padding: [35, 35] }}
                      zoomControl={false}
                      scrollWheelZoom
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                      />

                      <ZoomControl position="topright" />

                      {LOCATIONS.map((loc) => (
                        <Marker
                          key={`${loc.name}-${loc.lat}-${loc.lng}`}
                          position={[loc.lat, loc.lng]}
                          icon={markerIcon}
                        >
                          <Popup className={styles.popup}>
                            <div className={styles.popupTitle}>{loc.name}</div>
                            <div className={styles.popupMeta}>{loc.area}</div>
                            <div className={styles.popupAddr}>{loc.address}</div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  <div className={styles.locationList}>
                    {LOCATIONS.map((loc) => (
                      <div key={loc.name} className={styles.locationItem}>
                        <div className={styles.locationTop}>
                          <div className={styles.locationName}>{loc.name}</div>
                          <div className={styles.locationTag}>{loc.area}</div>
                        </div>
                        <div className={styles.locationAddr}>{loc.address}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* WHITE STACK AREA */}
            <div ref={whiteAreaRef} className={styles.whiteArea}>
              <div className={styles.whiteInner}>
                {openSections.length === 0 ? (
                  <div className={styles.whiteEmpty}>
                    Click <b>Explore Matches</b> or <b>Fan Zone Finder™</b> above to open details here.
                  </div>
                ) : (
                  <div className={styles.sectionStack}>
                    {openSections.map((id, idx) => {
                      // =========================
                      // MATCHES SECTION
                      // =========================
                      if (id === "matches") {
                        return (
                          <div key={id} className={`${styles.whiteCard} ${styles.whiteCardNlp}`}>
                            <div className={`${styles.whiteCardTop} ${styles.nlpHeader}`}>
                              <div className={styles.nlpTitleBlock}>
                                <div className={styles.nlpKickerRow}>
                                  <div className={styles.whiteKicker}>#{idx + 1} — MIAMI SCHEDULE</div>
                                  <span className={styles.nlpPill}>Plan your “anchor nights”</span>
                                </div>

                                <h2 className={styles.whiteTitle}>Matches in Miami</h2>

                                <p className={styles.whiteSub}>
                                  Pick 1–2 <b>must-see</b> nights now, then build your <b>hotel</b>, <b>transport</b>, and <b>fan-zone</b> plan around them.
                                  (Click again to remove.)
                                </p>

                                <div className={styles.nlpCueRow}>
                                  <span className={styles.nlpCueDot} aria-hidden="true" />
                                  <span className={styles.nlpCueText}>
                                    Tip: Choose a “prime night” + a backup night. You’ll feel locked-in.
                                  </span>
                                </div>
                              </div>

                              <button className={styles.removeBtn} onClick={() => toggleSection("matches")}>
                                Remove
                              </button>
                            </div>

                            <div className={styles.matchesGrid}>
                              <div className={styles.matchesBlock}>
                                <div className={styles.blockTitle}>Group Stage Matches</div>
                                <ul className={styles.matchList}>
                                  {MIAMI_MATCH_SCHEDULE.groupStage.map((m) => (
                                    <li key={`${m.date}-${m.time}-${m.teams?.[0]?.name || ""}`} className={styles.matchRow}>
                                      <span className={styles.matchDate}>{m.date}</span>
                                      <span className={styles.matchTime}>{m.time}</span>
                                      <span className={styles.matchVs}>{renderTeams(m)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className={styles.matchesBlock}>
                                <div className={styles.blockTitle}>Knockout & Final Matches</div>
                                <ul className={styles.matchList}>
                                  {MIAMI_MATCH_SCHEDULE.knockout.map((m) => (
                                    <li key={`${m.date}-${m.time}-${m.matchup}`} className={styles.matchRow}>
                                      <span className={styles.matchDate}>{m.date}</span>
                                      <span className={styles.matchTime}>{m.time}</span>
                                      <span className={styles.matchVs}>{m.matchup}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className={styles.whiteActions}>
                              <Link to="/tickets" className={styles.whitePrimaryBtn}>
                                Get Tickets
                              </Link>
                              <Link to="/venues" className={styles.whiteSecondaryBtn}>
                                Venue Guide
                              </Link>
                            </div>
                          </div>
                        );
                      }

                      // =========================
                      // FAN ZONE FINDER (HUB)
                      // =========================
                      if (id === "fanFinder") {
                        return (
                          <div key={id} className={`${styles.whiteCard} ${styles.fanFinderCard}`}>
                            <div className={styles.whiteCardTop}>
                              <div>
                                <div className={styles.whiteKicker}>#{idx + 1} — FAN ZONE</div>
                                <h2 className={styles.whiteTitle}>Fan Zone Finder™</h2>
                                <p className={styles.whiteSub}>
                                  Choose what you want to do below. Each choice opens a new section under this one.
                                  Click again to remove.
                                </p>
                              </div>
                              <button className={styles.removeBtn} onClick={() => toggleSection("fanFinder")}>
                                Remove
                              </button>
                            </div>

                            <div className={styles.optionGrid}>
                              <button
                                type="button"
                                className={`${styles.optionCard} ${isOpen("fanSignup") ? styles.optionCardActive : ""}`}
                                onClick={() => toggleSection("fanSignup")}
                              >
                                <div className={styles.optionTitle}>Find Your Country Crowd</div>
                                <div className={styles.optionSub}>Join a fan zone near you (fast).</div>
                                <div className={styles.optionCta}>Open</div>
                              </button>

                              <button
                                type="button"
                                className={`${styles.optionCard} ${isOpen("startCountryZone") ? styles.optionCardActive : ""}`}
                                onClick={() => toggleSection("startCountryZone")}
                              >
                                <div className={styles.optionTitle}>Start a Country Fan Zone</div>
                                <div className={styles.optionSub}>Lead the meetup. Own the energy.</div>
                                <div className={styles.optionCta}>Open</div>
                              </button>

                              <button
                                type="button"
                                className={`${styles.optionCard} ${isOpen("registerVenue") ? styles.optionCardActive : ""}`}
                                onClick={() => toggleSection("registerVenue")}
                              >
                                <div className={styles.optionTitle}>Register Your Venue</div>
                                <div className={styles.optionSub}>Get listed as an official hangout.</div>
                                <div className={styles.optionCta}>Open</div>
                              </button>
                            </div>

                            <div className={styles.fanCountryStrip}>
                              {FANZONE_COUNTRIES.map((c) => (
                                <div key={c.name} className={styles.countryPill}>
                                  <Flag iso2={c.iso2} label={c.name} />
                                  <span className={styles.countryName}>{c.name}</span>
                                </div>
                              ))}
                            </div>

                            <div className={styles.fanNote}>
                              <b>Copyright Notice:</b> Fan Zone Finder™ is a branded experience concept for World Cup in Miami.
                            </div>
                          </div>
                        );
                      }

                      // =========================
                      // OPTION 1: FAN SIGNUP
                      // =========================
                      if (id === "fanSignup") {
                        return (
                          <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                            <div className={styles.whiteCardTop}>
                              <div>
                                <div className={styles.whiteKicker}>#{idx + 1} — JOIN</div>
                                <h2 className={styles.whiteTitle}>Join a Fan Zone</h2>
                                <p className={styles.whiteSub}>
                                  Pick your country, drop your email, and we’ll route you to the best hangout zones.
                                </p>
                              </div>
                              <button className={styles.removeBtn} onClick={() => toggleSection("fanSignup")}>
                                Remove
                              </button>
                            </div>

                            <div className={styles.formGrid}>
                              <label className={styles.field}>
                                <span>Name</span>
                                <input className={styles.input} placeholder="Your name" />
                              </label>

                              <label className={styles.field}>
                                <span>Email</span>
                                <input className={styles.input} placeholder="you@email.com" />
                              </label>

                              <label className={styles.field}>
                                <span>Country</span>
                                <select className={styles.input}>
                                  {FANZONE_COUNTRIES.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              </label>

                              <button type="button" className={styles.formCta}>
                                Save My Spot
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // =========================
                      // OPTION 2: START COUNTRY ZONE
                      // =========================
                      if (id === "startCountryZone") {
                        return (
                          <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                            <div className={styles.whiteCardTop}>
                              <div>
                                <div className={styles.whiteKicker}>#{idx + 1} — LEAD</div>
                                <h2 className={styles.whiteTitle}>Start a Country Fan Zone</h2>
                                <p className={styles.whiteSub}>
                                  Become the organizer. We’ll feature your zone and help it grow.
                                </p>
                              </div>
                              <button className={styles.removeBtn} onClick={() => toggleSection("startCountryZone")}>
                                Remove
                              </button>
                            </div>

                            <div className={styles.formGrid}>
                              <label className={styles.field}>
                                <span>Organizer Name</span>
                                <input className={styles.input} placeholder="Your name" />
                              </label>

                              <label className={styles.field}>
                                <span>Email</span>
                                <input className={styles.input} placeholder="you@email.com" />
                              </label>

                              <label className={styles.field}>
                                <span>Country</span>
                                <select className={styles.input}>
                                  {FANZONE_COUNTRIES.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              </label>

                              <label className={styles.field}>
                                <span>Preferred Area</span>
                                <input className={styles.input} placeholder="e.g., Brickell, Wynwood, Little Haiti" />
                              </label>

                              <button type="button" className={styles.formCta}>
                                Launch My Fan Zone
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // =========================
                      // OPTION 3: REGISTER VENUE
                      // =========================
                      if (id === "registerVenue") {
                        return (
                          <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                            <div className={styles.whiteCardTop}>
                              <div>
                                <div className={styles.whiteKicker}>#{idx + 1} — LIST</div>
                                <h2 className={styles.whiteTitle}>Register a Venue as a Fan Zone</h2>
                                <p className={styles.whiteSub}>
                                  Bars, rooftops, lounges—get listed where fans are actually searching.
                                </p>
                              </div>
                              <button className={styles.removeBtn} onClick={() => toggleSection("registerVenue")}>
                                Remove
                              </button>
                            </div>

                            <div className={styles.formGrid}>
                              <label className={styles.field}>
                                <span>Venue Name</span>
                                <input className={styles.input} placeholder="Your venue name" />
                              </label>

                              <label className={styles.field}>
                                <span>Address</span>
                                <input className={styles.input} placeholder="Street, Miami, FL" />
                              </label>

                              <label className={styles.field}>
                                <span>Contact Email</span>
                                <input className={styles.input} placeholder="manager@venue.com" />
                              </label>

                              <label className={styles.field}>
                                <span>Primary Country Crowd</span>
                                <select className={styles.input}>
                                  {FANZONE_COUNTRIES.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              </label>

                              <button type="button" className={styles.formCta}>
                                Request Listing
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // fallback
                      return (
                        <div key={id} className={styles.whiteCard}>
                          <div className={styles.whiteCardTop}>
                            <div>
                              <div className={styles.whiteKicker}>#{idx + 1}</div>
                              <h2 className={styles.whiteTitle}>Section</h2>
                              <p className={styles.whiteSub}>Unknown section: {id}</p>
                            </div>
                            <button className={styles.removeBtn} onClick={() => toggleSection(id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            {/* END WHITE AREA */}
          </div>
        </div>
      </section>
    </div>
  );
}
