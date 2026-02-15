import React, { useEffect, useMemo, useRef, useState } from "react";
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
    // Scotland isn't ISO-2; we use a clean Scotland SVG.
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
 * 7 countries (Miami demographic + the teams playing in Miami)
 */
const FANZONE_COUNTRIES = [
  { name: "Brazil", iso2: "br", primary: "South Beach", secondary: "Wynwood" },
  { name: "Argentina", iso2: "ar", primary: "Brickell", secondary: "Downtown" },
  { name: "Colombia", iso2: "co", primary: "Doral", secondary: "Wynwood" },
  { name: "Mexico", iso2: "mx", primary: "Wynwood", secondary: "Downtown" },
  { name: "Haiti", iso2: "ht", primary: "Little Haiti", secondary: "North Miami" },
  { name: "Uruguay", iso2: "uy", primary: "Coral Gables", secondary: "Downtown" },
  { name: "Portugal", iso2: "pt", primary: "Brickell", secondary: "Miami Beach" },
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
 * ✅ Flags WITHOUT any package
 * - normal countries: flagcdn.com
 * - Scotland: Wikimedia SVG
 */
function Flag({ iso2, label }) {
  const code = (iso2 || "").toLowerCase();
  const isScotland = code === "sco";
  const src = isScotland
    ? "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg"
    : `https://flagcdn.com/w40/${code}.png`;
  const srcSet = isScotland ? undefined : `https://flagcdn.com/w80/${code}.png 2x`;

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

// 30 minutes
const PULSE_ROTATE_MS = 30 * 60 * 1000;

// Momentum Phase (3.5 months out) — no tickets
const LIVE_PULSE_FEED = [
  "🌎 International supporters organizing Miami meetups",
  "🇭🇹 Haiti fan community expanding in South Florida",
  "🇧🇷 Brazil supporters locking in watch party venues",
  "🇦🇷 Argentina rooftop meetups gaining traction",
  "🇫🇷 France fan groups scouting Downtown locations",
  "🌍 New countries joining the Fan Zone Network™",
  "🌆 Brickell rooftops preparing matchday experiences",
  "🏖 South Beach venues designing themed nights",
  "🎶 Wynwood clubs curating World Cup playlists",
  "🍹 Miami lounges planning international fan nights",
  "🗺 New fan locations being added to the map",
  "👥 Fans building their Miami experience early",
  "🌍 Global supporters connecting before kickoff",
  "🔔 Early members joining the Fan Zone Network™",
  "🧭 Visitors mapping out neighborhoods",
  "🌴 Travelers saving Miami hotspots",
  "⚽ Miami preparing for global football energy",
  "🔥 Momentum building across South Florida",
  "🌊 The countdown to Miami continues",
  "🌍 The world is getting ready for Miami",
];

export default function Home() {
  const [showMap, setShowMap] = useState(true);

  // stacked sections (order of clicks)
  const [openSections, setOpenSections] = useState([]);
  const whiteAreaRef = useRef(null);

  // LIVE PULSE index: stable + changes every 30 minutes even if user refreshes
  const [pulseIndex, setPulseIndex] = useState(() => {
    const slot = Math.floor(Date.now() / PULSE_ROTATE_MS);
    return slot % LIVE_PULSE_FEED.length;
  });

  useEffect(() => {
    const tick = () => {
      const slot = Math.floor(Date.now() / PULSE_ROTATE_MS);
      setPulseIndex(slot % LIVE_PULSE_FEED.length);
    };

    const now = Date.now();
    const msToNextBoundary = PULSE_ROTATE_MS - (now % PULSE_ROTATE_MS);
    const timeoutId = setTimeout(() => {
      tick();
      const intervalId = setInterval(tick, PULSE_ROTATE_MS);
      // stash for cleanup
      Home.__pulseInterval = intervalId;
    }, msToNextBoundary);

    return () => {
      clearTimeout(timeoutId);
      if (Home.__pulseInterval) clearInterval(Home.__pulseInterval);
      Home.__pulseInterval = null;
    };
  }, []);

  const bounds = useMemo(() => {
    const b = L.latLngBounds([]);
    LOCATIONS.forEach((p) => b.extend([p.lat, p.lng]));
    return b;
  }, []);

  const scrollToWhiteArea = () => {
    requestAnimationFrame(() => {
      whiteAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => {
      const exists = prev.includes(sectionId);

      // if closing the Fan Zone hub, also close its children
      if (exists && sectionId === "fanHub") {
        const remove = new Set(["fanHub", "fanFind", "fanStart", "venueRegister"]);
        return prev.filter((x) => !remove.has(x));
      }

      const next = exists ? prev.filter((x) => x !== sectionId) : [...prev, sectionId];
      if (!exists) scrollToWhiteArea();
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
      {/* NEW: Live Pulse Bar (replaces old nav) */}
      <header className={styles.liveBar}>
        <div className={styles.liveBarInner}>
          <div className={styles.liveLeft}>
            <div className={styles.liveIndicator} aria-label="Live updates">
              <span className={styles.liveDot} aria-hidden="true" />
              <span className={styles.liveLabel}>LIVE</span>
            </div>

            <Link to="/" className={styles.liveBrand} aria-label="World Cup in Miami">
              <span className={styles.liveBrandMark} aria-hidden="true" />
              <span className={styles.liveBrandText}>WCIM</span>
            </Link>
          </div>

          <div className={styles.liveTicker} aria-live="polite">
            {/* key forces animation restart when item changes */}
            <div key={pulseIndex} className={styles.liveTickerTrack}>
              <span className={styles.liveTickerItem}>{LIVE_PULSE_FEED[pulseIndex]}</span>
              <span className={styles.liveTickerSep} aria-hidden="true">•</span>
              <span className={styles.liveTickerItem}>{LIVE_PULSE_FEED[pulseIndex]}</span>
              <span className={styles.liveTickerSep} aria-hidden="true">•</span>
              <span className={styles.liveTickerItem}>{LIVE_PULSE_FEED[pulseIndex]}</span>
            </div>
          </div>

          <div className={styles.liveRight}>
            <button type="button" className={styles.liveIconBtn} aria-label="Account">
              <span aria-hidden="true">👤</span>
            </button>
            <button type="button" className={styles.liveIconBtn} aria-label="Menu">
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </div>
      </header>

      <section className={styles.hero} style={{ backgroundImage: 'url("/images/miami_skyline.png")' }}>
        <div className={styles.heroOverlay}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>
              WORLD CUP <span className={styles.heroAccent}>IN MIAMI</span>
            </h1>

            <p className={styles.heroSub}>
              Find the best places to watch, meet fans, and turn 2 nights in Miami into 2 nights you&apos;ll never forget.
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
                className={`${styles.primaryBtn} ${styles.fanHubBtn} ${isOpen("fanHub") ? styles.primaryBtnActive : ""}`}
                onClick={() => toggleSection("fanHub")}
                aria-pressed={isOpen("fanHub")}
              >
                {isOpen("fanHub") ? "Hide Fan Zone Network™" : "Fan Zone Network™"}
              </button>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? "Hide Fan Zone Map" : "Show Fan Zone Map"} <span className={styles.caret}>↗</span>
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
                        <Marker key={`${loc.name}-${loc.lat}-${loc.lng}`} position={[loc.lat, loc.lng]} icon={markerIcon}>
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
                      <div key={`${loc.name}-${loc.address}`} className={styles.locationItem}>
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
          </div>
        </div>
      </section>

      {/* WHITE STACK AREA */}
      <section ref={whiteAreaRef} className={styles.whiteArea}>
        <div className={styles.whiteInner}>
          {openSections.length === 0 ? (
            <div className={styles.whiteEmpty}>
              <h2 className={styles.whiteTitle}>Build the full Miami plan</h2>
              <p className={styles.whiteSub}>
                Click <b>Explore Matches</b> or <b>Fan Zone Network™</b> above to open details here. Click again to remove.
              </p>
            </div>
          ) : (
            <div className={styles.sectionStack}>
              {openSections.map((id, idx) => {
                if (id === "matches") {
                  return (
                    <div key={id} className={`${styles.whiteCard} ${styles.whiteCardNlp}`}>
                      <div className={`${styles.whiteCardTop} ${styles.nlpHeader}`}>
                        <div className={styles.nlpTitleBlock}>
                          <div className={styles.nlpKickerRow}>
                            <div className={styles.whiteKicker}>#{idx + 1} — MIAMI SCHEDULE</div>
                            <span className={styles.nlpPill}>Lock your “anchor nights”</span>
                          </div>

                          <h2 className={styles.whiteTitle}>Matches in Miami</h2>

                          <p className={styles.whiteSub}>
                            Pick 1–2 <b>must-see</b> nights now, then build your <b>hotel</b>, <b>transport</b>, and <b>fan-zone</b> plan around them.
                            (Click again to remove.)
                          </p>

                          <div className={styles.nlpCueRow}>
                            <span className={styles.nlpCueDot} aria-hidden="true" />
                            <span className={styles.nlpCueText}>Tip: Choose a “prime night” + a backup night. You’ll feel locked-in.</span>
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
                        <Link to="/schedule" className={styles.whitePrimaryBtn}>Match Guide</Link>
                        <Link to="/venues" className={styles.whiteSecondaryBtn}>Venue Guide</Link>
                      </div>
                    </div>
                  );
                }

                if (id === "fanHub") {
                  return (
                    <div key={id} className={`${styles.whiteCard} ${styles.fanHubCard}`}>
                      <div className={`${styles.whiteCardTop} ${styles.fanHubTop}`}>
                        <div>
                          <div className={styles.whiteKicker}>#{idx + 1} — FAN ZONE</div>
                          <h2 className={styles.whiteTitle}>Fan Zone Network™</h2>
                          <p className={styles.whiteSub}>
                            Choose an option. Each click opens a new section <b>under this one</b> (in the order you click).
                            Click again to remove.
                          </p>
                          <div className={styles.disclaimer}>
                            World Cup in Miami is an <b>independent fan guide</b> and is not affiliated with FIFA or the World Cup.
                          </div>
                        </div>

                        <button className={styles.removeBtn} onClick={() => toggleSection("fanHub")}>
                          Remove
                        </button>
                      </div>

                      <div className={styles.optionGrid}>
                        <button
                          type="button"
                          className={`${styles.optionCard} ${isOpen("fanFind") ? styles.optionCardActive : ""}`}
                          onClick={() => toggleSection("fanFind")}
                        >
                          <div className={styles.optionIcon} aria-hidden="true">🔎</div>
                          <div className={styles.optionTitle}>Find Your Fan Zone</div>
                          <div className={styles.optionSub}>Instantly see where your country’s fans gather.</div>
                          <div className={styles.optionCta}>Open</div>
                        </button>

                        <button
                          type="button"
                          className={`${styles.optionCard} ${isOpen("fanStart") ? styles.optionCardActive : ""}`}
                          onClick={() => toggleSection("fanStart")}
                        >
                          <div className={styles.optionIcon} aria-hidden="true">⚡</div>
                          <div className={styles.optionTitle}>Start a Country Fan Zone</div>
                          <div className={styles.optionSub}>Lead the meetup. Own the vibe.</div>
                          <div className={styles.optionCta}>Open</div>
                        </button>

                        <button
                          type="button"
                          className={`${styles.optionCard} ${isOpen("venueRegister") ? styles.optionCardActive : ""}`}
                          onClick={() => toggleSection("venueRegister")}
                        >
                          <div className={styles.optionIcon} aria-hidden="true">🏟️</div>
                          <div className={styles.optionTitle}>Register Your Venue</div>
                          <div className={styles.optionSub}>Get listed as a fan-zone location.</div>
                          <div className={styles.optionCta}>Open</div>
                        </button>
                      </div>
                    </div>
                  );
                }

                if (id === "fanFind") {
                  return (
                    <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                      <div className={styles.whiteCardTop}>
                        <div>
                          <div className={styles.whiteKicker}>#{idx + 1} — FIND YOUR FAN ZONE</div>
                          <h2 className={styles.whiteTitle}>Where Each Country’s Fans Hang Out</h2>
                          <p className={styles.whiteSub}>
                            Pick your country, then we’ll send you the best matchday spots + last-minute “drops.”
                          </p>
                        </div>
                        <button className={styles.removeBtn} onClick={() => toggleSection("fanFind")}>
                          Remove
                        </button>
                      </div>

                      <div className={styles.countryGrid}>
                        {FANZONE_COUNTRIES.map((c) => (
                          <div key={c.name} className={styles.countryCard}>
                            <div className={styles.countryCardTop}>
                              <Flag iso2={c.iso2} label={c.name} />
                              <div className={styles.countryCardName}>{c.name}</div>
                            </div>
                            <div className={styles.countryCardMeta}>
                              <span className={styles.countryChip}>{c.primary}</span>
                              <span className={styles.countryChipMuted}>{c.secondary}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>Email</span>
                          <input className={styles.input} placeholder="you@email.com" />
                        </label>
                        <label className={styles.field}>
                          <span>Country</span>
                          <select className={styles.input} defaultValue="Brazil">
                            {FANZONE_COUNTRIES.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <button type="button" className={styles.formCta}>Get Matchday Alerts</button>
                      </div>
                    </div>
                  );
                }

                if (id === "fanStart") {
                  return (
                    <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                      <div className={styles.whiteCardTop}>
                        <div>
                          <div className={styles.whiteKicker}>#{idx + 1} — START A FAN ZONE</div>
                          <h2 className={styles.whiteTitle}>Start a Country Fan Zone</h2>
                          <p className={styles.whiteSub}>
                            Become the organizer. We’ll help you recruit fans + match with venues.
                          </p>
                        </div>
                        <button className={styles.removeBtn} onClick={() => toggleSection("fanStart")}>
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
                          <select className={styles.input} defaultValue="Brazil">
                            {FANZONE_COUNTRIES.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className={styles.field}>
                          <span>Preferred Area</span>
                          <input className={styles.input} placeholder="e.g., Brickell, Wynwood, Little Haiti" />
                        </label>
                        <button type="button" className={styles.formCta}>Launch My Fan Zone</button>
                      </div>
                    </div>
                  );
                }

                if (id === "venueRegister") {
                  return (
                    <div key={id} className={`${styles.whiteCard} ${styles.fanFormCard}`}>
                      <div className={styles.whiteCardTop}>
                        <div>
                          <div className={styles.whiteKicker}>#{idx + 1} — REGISTER YOUR VENUE</div>
                          <h2 className={styles.whiteTitle}>Register a Fan Zone Location</h2>
                          <p className={styles.whiteSub}>
                            Clubs and bars can sponsor country fan zones. Get discovered during match week.
                          </p>
                        </div>
                        <button className={styles.removeBtn} onClick={() => toggleSection("venueRegister")}>
                          Remove
                        </button>
                      </div>

                      <div className={styles.formGrid}>
                        <label className={styles.field}>
                          <span>Venue Name</span>
                          <input className={styles.input} placeholder="Your venue" />
                        </label>
                        <label className={styles.field}>
                          <span>Neighborhood</span>
                          <input className={styles.input} placeholder="e.g., Wynwood" />
                        </label>
                        <label className={styles.field}>
                          <span>Email</span>
                          <input className={styles.input} placeholder="manager@venue.com" />
                        </label>
                        <label className={styles.field}>
                          <span>Sponsor Country</span>
                          <select className={styles.input} defaultValue="Brazil">
                            {FANZONE_COUNTRIES.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <button type="button" className={styles.formCta}>Submit Venue</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={id} className={styles.whiteCard}>
                    <div className={styles.whiteCardTop}>
                      <div>
                        <div className={styles.whiteKicker}>#{idx + 1}</div>
                        <h2 className={styles.whiteTitle}>Section</h2>
                        <p className={styles.whiteSub}>Unknown section: {id}</p>
                      </div>
                      <button className={styles.removeBtn} onClick={() => toggleSection(id)}>Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
