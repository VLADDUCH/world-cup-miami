import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../styles/Home.module.css";

const WCIM_LOCATIONS = [
  {
    name: "Bayfront Park",
    type: "Fan Festival Area",
    area: "Downtown",
    address: "301 Biscayne Blvd, Miami, FL 33132",
    lat: 25.7743,
    lng: -80.1870,
  },
  {
    name: "Wynwood Marketplace",
    type: "Watch Party / Events",
    area: "Wynwood",
    address: "2250 NW 2nd Ave, Miami, FL 33127",
    lat: 25.8004,
    lng: -80.1994,
  },
  {
    name: "The Clevelander South Beach",
    type: "Nightlife / Watch Party",
    area: "Miami Beach",
    address: "1020 Ocean Dr, Miami Beach, FL 33139",
    lat: 25.7813,
    lng: -80.1300,
  },
  {
    name: "Grails Sports Bar",
    type: "Sports Bar",
    area: "Wynwood",
    address: "2800 N Miami Ave, Miami, FL 33127",
    lat: 25.8021,
    lng: -80.1947,
  },
  {
    name: "Fritz & Franz Bierhaus",
    type: "International Watch Party",
    area: "Coral Gables",
    address: "60 Merrick Way, Coral Gables, FL 33134",
    lat: 25.7337,
    lng: -80.2610,
  },
  {
    name: "Cervecería La Tropical",
    type: "Restaurant / Events",
    area: "Wynwood",
    address: "42 NE 25th St, Miami, FL 33137",
    lat: 25.7992,
    lng: -80.1928,
  },
  {
    name: "The Doral Yard",
    type: "Food Hall / Fan Meetup",
    area: "Doral",
    address: "8455 NW 53rd St, Suite 106, Doral, FL 33166",
    lat: 25.8266,
    lng: -80.3326,
  },
  {
    name: "Bayshore Club",
    type: "Waterfront Viewing",
    area: "Coconut Grove",
    address: "3391 Pan American Dr, Miami, FL 33133",
    lat: 25.7285,
    lng: -80.2362,
  },
  {
    name: "American Social",
    type: "Bar / Restaurant",
    area: "Brickell",
    address: "690 SW 1st Ct, Miami, FL 33130",
    lat: 25.7665,
    lng: -80.1933,
  },
  {
    name: "Black Market Miami",
    type: "Downtown Sports Bar",
    area: "Downtown",
    address: "168 SE 1st St, Miami, FL 33131",
    lat: 25.7730,
    lng: -80.1893,
  },
  {
    name: "Sports & Social",
    type: "Large Watch Party Venue",
    area: "Near Stadium",
    address: "11401 NW 12th St, Miami, FL 33172",
    lat: 25.7905,
    lng: -80.3796,
  },
  {
    name: "Hard Rock Stadium Area",
    type: "Match Area",
    area: "Miami Gardens",
    address: "347 Don Shula Drive, Miami Gardens, FL 33056",
    lat: 25.9580,
    lng: -80.2389,
  },
];

const MIAMI_MATCHES = [
  {
    date: "June 15",
    time: "6:00 PM",
    match: "Saudi Arabia vs Uruguay",
    label: "Opening Miami match energy",
  },
  {
    date: "June 21",
    time: "6:00 PM",
    match: "Uruguay vs Cape Verde",
    label: "International fan meetup opportunity",
  },
  {
    date: "June 24",
    time: "6:00 PM",
    match: "Scotland vs Brazil",
    label: "Major Brazil fan traffic moment",
  },
  {
    date: "June 27",
    time: "7:30 PM",
    match: "Colombia vs Portugal",
    label: "Huge South Florida audience moment",
  },
  {
    date: "July 3",
    time: "6:00 PM",
    match: "Round of 32",
    label: "Knockout stage traffic spike",
  },
  {
    date: "July 11",
    time: "5:00 PM",
    match: "Quarter-final",
    label: "Premium ad placement opportunity",
  },
  {
    date: "July 18",
    time: "5:00 PM",
    match: "Bronze Final",
    label: "Final weekend audience surge",
  },
];

const STREAMING_NEWS = [
  {
    title: "Miami fan zones and watch parties are being added",
    meta: "Streaming update",
  },
  {
    title: "Local businesses can submit flyers and promotions",
    meta: "Business update",
  },
  {
    title: "Match-day guides, maps, and merch drops are coming",
    meta: "Fan update",
  },
];

const API_STACK = [
  "OpenFootball",
  "Sportmonks / API-Football",
  "GNews / NewsAPI",
  "Ticketmaster",
  "Eventbrite",
  "City of Miami Open Data",
  "Miami-Dade Open Data",
  "OpenStreetMap",
  "Leaflet",
  "Geoapify",
  "WCIM Business DB",
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

export default function Home() {
  const bounds = useMemo(() => {
    const b = L.latLngBounds([]);
    WCIM_LOCATIONS.forEach((location) => b.extend([location.lat, location.lng]));
    return b;
  }, []);

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
          <a href="#shop">Shop Merch</a>
          <a href="#news">Streaming News</a>
        </nav>

        <a className={styles.advertiseTopBtn} href="#business">
          Advertise Now
        </a>
      </header>

      <section className={styles.heroShell}>
        <section className={styles.heroText}>
          <div className={styles.kicker}>Miami fan guide • live updates • business promotions</div>

          <h1>
            The World Comes To <span>Miami</span>
          </h1>

          <p className={styles.heroCopy}>
            One city. One energy. One unforgettable football experience. Find matches,
            fan zones, streaming news, local businesses, watch parties, and Miami-first merch.
          </p>

          <div className={styles.heroActions}>
            <a href="#matches" className={styles.primaryBtn}>Explore Match Schedule</a>
            <a href="#business" className={styles.secondaryBtn}>Add Your Flyer / Business</a>
          </div>

          <div className={styles.countdownCard}>
            <p>Countdown to Miami kickoff</p>
            <div className={styles.countdownGrid}>
              <span><strong>247</strong><small>Days</small></span>
              <span><strong>14</strong><small>Hrs</small></span>
              <span><strong>36</strong><small>Mins</small></span>
              <span><strong>42</strong><small>Secs</small></span>
            </div>
          </div>
        </section>

        <section className={styles.heroVisual} aria-label="Miami skyline soccer ball background">
          <div className={styles.heroImage} />
          <div className={styles.heroImageGlow} />
        </section>

        <aside className={styles.sidePanel} id="news">
          <div className={styles.panelHeader}>
            <h2>Streaming News</h2>
            <a href="#news">View all</a>
          </div>

          <div className={styles.newsList}>
            {STREAMING_NEWS.map((item) => (
              <article className={styles.newsItem} key={item.title}>
                <div className={styles.newsThumb} />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.meta}</p>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.businessCallout} id="business">
            <h2>Promote your business</h2>
            <p>
              Reach fans looking for watch parties, food, nightlife, merch, local events,
              and match-day places to go.
            </p>
            <a href="mailto:info@worldcupinmiami.com?subject=Add%20My%20Business%20to%20World%20Cup%20in%20Miami">
              Add Your Flyer / Business
            </a>
          </div>
        </aside>
      </section>

      <section className={styles.quickCards}>
        <article className={styles.card} id="matches">
          <div className={styles.cardTopline}>Next Match</div>
          <h2>Saudi Arabia vs Uruguay</h2>
          <p>June 15 • 6:00 PM • Miami Gardens</p>
          <a href="#schedule">View Match Details</a>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTopline}>Live Now</div>
          <h2>Scores + Match Updates</h2>
          <p>Powered by football APIs, news APIs, local event feeds, and WCIM updates.</p>
          <a href="#api">View Data Stack</a>
        </article>

        <article className={styles.card} id="shop">
          <div className={styles.cardTopline}>Shop Merch</div>
          <h2>Rep Miami. Rep the Moment.</h2>
          <p>Miami-first shirts, hats, posters, stickers, and fan drops.</p>
          <a href="#shop">Shop Merch</a>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTopline}>Ad Space</div>
          <h2>Featured Business Slots</h2>
          <p>Promote your brand directly inside match, map, and streaming news traffic.</p>
          <a href="#business">Advertise Now</a>
        </article>
      </section>

      <section className={styles.mapSection} id="map">
        <div className={styles.sectionHeading}>
          <div>
            <p>Interactive Miami Map</p>
            <h2>Fan zones, watch parties, business listings, and match-day hotspots</h2>
          </div>
          <a href="#business">Add Your Location</a>
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

              {WCIM_LOCATIONS.map((location) => (
                <Marker
                  key={`${location.name}-${location.lat}-${location.lng}`}
                  position={[location.lat, location.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <strong>{location.name}</strong>
                    <br />
                    {location.type}
                    <br />
                    {location.area}
                    <br />
                    {location.address}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className={styles.locationPanel}>
            <h3>Map Coordinates Loaded</h3>
            <p>{WCIM_LOCATIONS.length} Miami locations ready for the WCIM map.</p>

            <div className={styles.locationList}>
              {WCIM_LOCATIONS.map((location) => (
                <div className={styles.locationItem} key={location.name}>
                  <div>
                    <strong>{location.name}</strong>
                    <span>{location.area} • {location.type}</span>
                  </div>
                  <small>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.scheduleSection} id="schedule">
        <div className={styles.sectionHeading}>
          <div>
            <p>Miami Match Schedule</p>
            <h2>Pages built for traffic, sharing, and merch/ad placement</h2>
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

      <section className={styles.apiSection} id="api">
        <div className={styles.sectionHeading}>
          <div>
            <p>Powered by APIs + WCIM Business Data</p>
            <h2>Data feeds that make the site useful and repeatable</h2>
          </div>
        </div>

        <div className={styles.apiGrid}>
          {API_STACK.map((api) => (
            <div className={styles.apiPill} key={api}>
              {api}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.emailBar}>
        <div>
          <h2>Stay in the game</h2>
          <p>Get streaming news, match alerts, merch drops, and business promotions.</p>
        </div>

        <form className={styles.emailForm}>
          <input type="email" placeholder="Enter your email" aria-label="Email address" />
          <button type="submit">Join Alerts</button>
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
          <a href="#shop">Shop</a>
        </div>
      </footer>
    </main>
  );
}
