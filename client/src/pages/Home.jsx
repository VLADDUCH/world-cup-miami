import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../styles/Home.module.css";

import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ IMPORTANT: image is in /public/images/skyline.png
// Public assets are referenced by URL — NOT imported
const SKYLINE_URL = "/images/skyline.png";

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ✅ FULL LOCATIONS LIST (your missing locations included)
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

function toBounds() {
  return L.latLngBounds(LOCATIONS.map((m) => [m.lat, m.lng]));
}

export default function Home() {
  const [showMap, setShowMap] = useState(true);
  const mapRef = useRef(null);

  // Fit all pins once map is visible & created
  useEffect(() => {
    if (!showMap) return;
    if (!mapRef.current) return;

    const bounds = toBounds();
    mapRef.current.fitBounds(bounds, { padding: [35, 35] });
  }, [showMap]);

  const pinsCount = useMemo(() => LOCATIONS.length, []);

  return (
    <div className={styles.page}>
      {/* NAVBAR */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a className={styles.brand} href="#home">
            <div className={styles.brandMark} aria-hidden="true" />
            <div className={styles.brandText}>
              <div className={styles.brandTop}>WORLD CUP</div>
              <div className={styles.brandBottom}>IN MIAMI</div>
            </div>
          </a>

          <nav className={styles.navLinks}>
            <a className={styles.navLink} href="#schedule">Schedule</a>
            <a className={styles.navLink} href="#fan-zones">Fan Zones</a>
            <a className={styles.navLink} href="#venues">Venues</a>
            <a className={styles.navLink} href="#tickets">Tickets</a>
            <a className={styles.navLink} href="#news">News</a>
          </nav>

          <a className={styles.navCta} href="#tickets">
            Get Tickets
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        id="home"
        className={styles.hero}
        style={{ backgroundImage: `url(${SKYLINE_URL})` }}
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
              <a className={styles.primaryBtn} href="#schedule">
                Explore Matches
              </a>

              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowMap((v) => !v)}
              >
                {showMap ? "Hide Fan Zone Map" : "Show Fan Zone Map"}{" "}
                <span className={styles.caret}>{showMap ? "▴" : "▾"}</span>
              </button>
            </div>

            {/* COLLAPSIBLE MAP */}
            {showMap && (
              <div className={styles.mapCard} id="fan-zones">
                <div className={styles.mapHeader}>
                  <div>
                    <div className={styles.mapTitle}>Fan Zone Map</div>
                    <div className={styles.mapMeta}>
                      Pins loaded: {pinsCount}/{pinsCount}
                    </div>
                  </div>
                </div>

                <div className={styles.mapGrid}>
                  {/* MAP */}
                  <div className={styles.mapWrap}>
                    <MapContainer
                      className={styles.leafletMap}
                      center={[25.7617, -80.1918]}
                      zoom={11}
                      zoomControl={false}
                      whenCreated={(map) => {
                        mapRef.current = map;
                        // important for maps inside collapsible containers
                        setTimeout(() => {
                          map.invalidateSize();
                          try {
                            map.fitBounds(toBounds(), { padding: [35, 35] });
                          } catch (e) {}
                        }, 0);
                      }}
                    >
                      <ZoomControl position="topright" />
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
                      />

                      {LOCATIONS.map((m) => (
                        <Marker key={m.address} position={[m.lat, m.lng]}>
                          <Popup>
                            <div className={styles.popup}>
                              <div className={styles.popupTitle}>{m.name}</div>
                              <div className={styles.popupMeta}>{m.area}</div>
                              <div className={styles.popupAddr}>{m.address}</div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  {/* LIST */}
                  <div className={styles.locationList}>
                    {LOCATIONS.map((loc) => (
                      <div className={styles.locationItem} key={loc.address}>
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

      {/* STUB SECTIONS */}
      <section id="schedule" className={styles.sectionStub}>
        <h2>Schedule</h2>
        <p>(Next: wire real fixtures + ticket CTA.)</p>
      </section>

      <section id="venues" className={styles.sectionStub}>
        <h2>Venues</h2>
        <p>(Next: venue guide + transport + nearby hotels.)</p>
      </section>

      <section id="tickets" className={styles.sectionStub}>
        <h2>Tickets</h2>
        <p>(Next: ticket CTA + integrations.)</p>
      </section>

      <section id="news" className={styles.sectionStub}>
        <h2>News</h2>
        <p>(Next: CMS-driven news feed.)</p>
      </section>
    </div>
  );
}
