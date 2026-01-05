import React from "react";
import styles from "../styles/Home.module.css";
import logo from "/images/logos/MFFlogo.png";

export default function Home() {
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <img
            src={logo}
            alt="World Cup in Miami logo"
            className={styles.logo}
          />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>World Cup in Miami</span>
            <span className={styles.brandSub}>Fan Guide · 2026</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          The Miami Fan Guide
          <br />
          <span className={styles.heroAccent}>for the 2026 World Cup</span>
        </h1>
        <p className={styles.heroSub}>
          Events, nightlife, match schedule, tickets, and travel intel —
          everything you need to feel Miami while you follow the world&apos;s
          game.
        </p>
      </section>

      <main className={styles.main}>
        {/* TOP GRID */}
        <section className={styles.topGrid}>
          {/* MAP CARD */}
          <article className={styles.cardMap}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>World Cup Miami Map</h2>
              <p className={styles.cardSubtitle}>
                Explore fan zones, stadiums, watch parties, and neighborhoods.
              </p>
            </header>

            <div className={styles.mapToolbar}>
              <button className={styles.mapFilterActive}>Fan Zones</button>
              <button className={styles.mapFilter}>Stadiums</button>
              <button className={styles.mapFilter}>Nightlife</button>
              <button className={styles.mapFilter}>Food &amp; Culture</button>
            </div>

            <div className={styles.mapCanvas}>
              <div className={styles.mapBadge}>Live map coming soon</div>
            </div>

            <footer className={styles.cardFooterRow}>
              <span className={styles.cardFooterText}>
                Wynwood · Brickell · South Beach · Downtown
              </span>
              <button className={styles.linkButton}>Open full map</button>
            </footer>
          </article>

          {/* RIGHT COLUMN: MATCH + NIGHTLIFE */}
          <div className={styles.rightColumn}>
            <article className={styles.cardSchedule}>
              <header className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>Match Schedule</h2>
                <span className={styles.badgeLive}>Key fixtures</span>
              </header>

              <ul className={styles.matchList}>
                <li className={styles.matchItem}>
                  <div className={styles.matchTeams}>
                    <span className={styles.flag}>🇪🇸</span>
                    <span className={styles.teamName}>Spain</span>
                    <span className={styles.vs}>vs</span>
                    <span className={styles.flag}>🇨🇦</span>
                    <span className={styles.teamName}>Canada</span>
                  </div>
                  <div className={styles.matchMeta}>
                    <span className={styles.matchTime}>3:00 PM</span>
                    <span className={styles.matchVenue}>Hard Rock Stadium</span>
                  </div>
                </li>

                <li className={styles.matchItem}>
                  <div className={styles.matchTeams}>
                    <span className={styles.flag}>🇦🇷</span>
                    <span className={styles.teamName}>Argentina</span>
                    <span className={styles.vs}>vs</span>
                    <span className={styles.flag}>🏳️</span>
                    <span className={styles.teamName}>TBD</span>
                  </div>
                  <div className={styles.matchMeta}>
                    <span className={styles.matchTime}>12:00 PM</span>
                    <span className={styles.matchVenue}>Miami Gardens</span>
                  </div>
                </li>

                <li className={styles.matchItem}>
                  <div className={styles.matchTeams}>
                    <span className={styles.flag}>🏳️</span>
                    <span className={styles.teamName}>TBD</span>
                    <span className={styles.vs}>vs</span>
                    <span className={styles.flag}>🏳️</span>
                    <span className={styles.teamName}>TBD</span>
                  </div>
                  <div className={styles.matchMeta}>
                    <span className={styles.matchTime}>3:00 PM</span>
                    <span className={styles.matchVenue}>To be announced</span>
                  </div>
                </li>
              </ul>

              <button className={styles.primaryLink}>View all matches</button>
            </article>

            <article className={styles.cardNightlife}>
              <header className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>Nightlife &amp; Parties</h2>
              </header>

              <div className={styles.nightlifeVisual}>
                <div className={styles.nightlifeOverlayText}>
                  The best clubs, rooftops, and watch parties during World Cup
                  week.
                </div>
              </div>

              <ul className={styles.nightlifeList}>
                <li className={styles.nightlifeItem}>
                  <span className={styles.nightlifeDate}>June 15</span>
                  <span className={styles.nightlifeName}>Fan Fest</span>
                  <span className={styles.nightlifeArea}>Downtown</span>
                </li>
                <li className={styles.nightlifeItem}>
                  <span className={styles.nightlifeDate}>June 17</span>
                  <span className={styles.nightlifeName}>Watch Party</span>
                  <span className={styles.nightlifeArea}>South Beach</span>
                </li>
                <li className={styles.nightlifeItem}>
                  <span className={styles.nightlifeDate}>June 18</span>
                  <span className={styles.nightlifeName}>
                    After-Match Rooftop
                  </span>
                  <span className={styles.nightlifeArea}>Wynwood</span>
                </li>
              </ul>

              <button className={styles.primaryLink}>View all parties</button>
            </article>
          </div>
        </section>

        {/* 3-CARD BOTTOM GRID */}
        <section className={styles.bottomGrid}>
          <article className={styles.cardTall}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Events</h2>
              <p className={styles.cardSubtitle}>
                Daily pulses of the city — fan zones, concerts, and pop-up
                experiences around every match.
              </p>
            </header>

            <div className={styles.photoPlaceholder}>
              <span className={styles.photoLabel}>
                Miami skyline · Fan zone preview
              </span>
            </div>
          </article>

          <article className={styles.cardEventsList}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Match Week Highlights</h2>
            </header>

            <ul className={styles.eventList}>
              <li className={styles.eventItem}>
                <div>
                  <div className={styles.eventDate}>June 12</div>
                  <div className={styles.eventName}>Opening Fan Parade</div>
                </div>
                <div className={styles.eventMeta}>Downtown Bayfront Park</div>
              </li>
              <li className={styles.eventItem}>
                <div>
                  <div className={styles.eventDate}>June 15</div>
                  <div className={styles.eventName}>Official Watch Party</div>
                </div>
                <div className={styles.eventMeta}>Wynwood Fan Zone</div>
              </li>
              <li className={styles.eventItem}>
                <div>
                  <div className={styles.eventDate}>June 18</div>
                  <div className={styles.eventName}>Sunset Beach Kickoff</div>
                </div>
                <div className={styles.eventMeta}>South Beach</div>
              </li>
            </ul>

            <button className={styles.primaryLink}>
              View full event calendar
            </button>
          </article>

          <article className={styles.cardInfo}>
            <header className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Where to Stay &amp; Tickets</h2>
              <p className={styles.cardSubtitle}>
                Quick links to lock in your base, then your seats.
              </p>
            </header>

            <div className={styles.infoSection}>
              <h3 className={styles.infoHeading}>Where to stay</h3>
              <ul className={styles.infoList}>
                <li>South Beach · Oceanfront &amp; nightlife</li>
                <li>Wynwood · Street art &amp; creative energy</li>
                <li>Brickell · High-rise views &amp; dining</li>
              </ul>
            </div>

            <div className={styles.infoSection}>
              <h3 className={styles.infoHeading}>Tickets &amp; travel</h3>
              <ul className={styles.infoList}>
                <li>Official FIFA ticket portal</li>
                <li>Shuttle &amp; transit between venues</li>
                <li>Fan safety &amp; entry guidelines</li>
              </ul>
            </div>

            <button className={styles.primaryButton}>
              Plan my World Cup in Miami
            </button>
          </article>
        </section>

        {/* TODAY IN MIAMI */}
        <section className={styles.todaySection}>
          <header className={styles.todayHeader}>
            <h2 className={styles.todayTitle}>Today in Miami</h2>
            <p className={styles.todaySubtitle}>
              Live matches, viewing spots, bars, and fan zones around Miami.
            </p>
          </header>

          <div className={styles.todayGrid}>
            <div className={styles.todayLeftCol}>
              <article className={styles.todayMatchCard}>
                <h3 className={styles.todayMatchTitle}>Brazil vs. France</h3>
                <p className={styles.todayMatchTime}>3:00 PM</p>
                <p className={styles.todayVenue}>
                  Little Haiti Cultural Center Viewing Zone
                </p>
                <p className={styles.todayDescription}>
                  DJ set with Haitian kompa at halftime. Family-friendly viewing
                  zone with local food and culture.
                </p>
                <p className={styles.todaySponsorLine}>
                  Sponsored by <span>Bon Manje Haitian Grill</span>
                </p>
              </article>

              <article className={styles.todaySponsorCard}>
                <h3 className={styles.todaySponsorHeading}>
                  Sponsored by Mom
                </h3>
                <p className={styles.todaySponsorName}>
                  Bon Manje Haitian Grill
                </p>
                <p className={styles.todaySponsorText}>
                  Match-day plates, Kompa energy, and specials for Brazil vs.
                  France fans all afternoon and evening.
                </p>
                <button className={styles.todaySponsorButton}>
                  View match-day special
                </button>
              </article>
            </div>

            <article className={styles.todayMapCard}>
              <h3 className={styles.todayMapTitle}>Match-Day Map</h3>
              <p className={styles.todayMapSub}>
                Wynwood, Brickell, Little Haiti, and South Beach hotspots
                highlighted for today&apos;s matches.
              </p>
              <div className={styles.todayMapPlaceholder}>
                <span className={styles.todayMapBadge}>
                  Today&apos;s hotspots
                </span>
              </div>
              <button className={styles.todayMapButton}>
                Open live fan map
              </button>
            </article>
          </div>
        </section>

        {/* WORLD CUP · MIAMI ENERGY */}
        <section className={styles.energySection}>
          <div className={styles.energyCopy}>
            <h2 className={styles.energyTitle}>
              World Cup. Miami Energy.
              <br />
              Local Businesses. One Hub.
            </h2>
            <p className={styles.energyText}>
              Discover the best places to watch the matches, eat, party, and
              support local — with a special spotlight on Haitian &amp;
              Caribbean businesses shaping the World Cup experience in Miami.
            </p>

            <div className={styles.energyButtons}>
              <button className={styles.energyPrimary}>
                Explore Match-Day Spots
              </button>
              <button className={styles.energySecondary}>
                List My Business
              </button>
            </div>
          </div>

          <div className={styles.energyMeta}>
            <div className={styles.energyStat}>
              <span className={styles.energyEmoji}>🌎</span>
              <div>
                <div className={styles.energyStatLabel}>One global game</div>
                <div className={styles.energyStatValue}>
                  Fans from every continent
                </div>
              </div>
            </div>

            <div className={styles.energyStat}>
              <span className={styles.energyEmoji}>🏙️</span>
              <div>
                <div className={styles.energyStatLabel}>Miami neighborhoods</div>
                <div className={styles.energyStatValue}>
                  Wynwood, Little Haiti, Brickell, South Beach
                </div>
              </div>
            </div>

            <div className={styles.energyStat}>
              <span className={styles.energyEmoji}>🤝</span>
              <div>
                <div className={styles.energyStatLabel}>Community powered</div>
                <div className={styles.energyStatValue}>
                  Built for local restaurants, bars, clubs &amp; small
                  businesses.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED LOCAL BUSINESSES */}
        <section className={styles.featuredSection}>
          <header className={styles.featuredHeader}>
            <h2 className={styles.featuredTitle}>Featured Local Businesses</h2>
            <p className={styles.featuredSubtitle}>
              Discover Miami&apos;s top spots for food, nightlife, and culture.
            </p>
          </header>

          <div className={styles.featuredGrid}>
            {/* Card 1 */}
            <article className={styles.businessCard}>
              <div
                className={`${styles.businessImage} ${styles.businessImageFood}`}
              />
              <div className={styles.businessBody}>
                <h3 className={styles.businessName}>
                  Bon Manje Haitian Grill
                </h3>
                <p className={styles.businessTags}>
                  Haitian · Caribbean · Family-Friendly
                </p>
                <div className={styles.businessMetaRow}>
                  <span className={styles.businessStars}>★★★★☆</span>
                  <span className={styles.businessRating}>4.8</span>
                  <span className={styles.businessDot}>•</span>
                  <span className={styles.businessLocation}>Little Haiti</span>
                </div>
                <button className={styles.businessButton}>View Profile</button>
              </div>
            </article>

            {/* Card 2 */}
            <article className={styles.businessCard}>
              <div
                className={`${styles.businessImage} ${styles.businessImageNightlife}`}
              />
              <div className={styles.businessBody}>
                <h3 className={styles.businessName}>Wynwood Social Club</h3>
                <p className={styles.businessTags}>
                  Nightlife · DJs · Match Parties
                </p>
                <div className={styles.businessMetaRow}>
                  <span className={styles.businessStars}>★★★★☆</span>
                  <span className={styles.businessRating}>4.7</span>
                  <span className={styles.businessDot}>•</span>
                  <span className={styles.businessLocation}>Wynwood</span>
                </div>
                <button className={styles.businessButton}>View Events</button>
              </div>
            </article>

            {/* Card 3 */}
            <article className={styles.businessCard}>
              <div
                className={`${styles.businessImage} ${styles.businessImageKitchen}`}
              />
              <div className={styles.businessBody}>
                <h3 className={styles.businessName}>Island Taste Kitchen</h3>
                <p className={styles.businessTags}>
                  Jamaican · Seafood · Match-Day Specials
                </p>
                <div className={styles.businessMetaRow}>
                  <span className={styles.businessStars}>★★★★☆</span>
                  <span className={styles.businessRating}>4.6</span>
                  <span className={styles.businessDot}>•</span>
                  <span className={styles.businessLocation}>North Miami</span>
                </div>
                <button className={styles.businessButton}>Order Now</button>
              </div>
            </article>

            {/* Card 4 */}
            <article className={styles.businessCard}>
              <div
                className={`${styles.businessImage} ${styles.businessImageLounge}`}
              />
              <div className={styles.businessBody}>
                <h3 className={styles.businessName}>Brickell Match Lounge</h3>
                <p className={styles.businessTags}>
                  Upscale Lounge · Match Screenings
                </p>
                <div className={styles.businessMetaRow}>
                  <span className={styles.businessStars}>★★★★☆</span>
                  <span className={styles.businessRating}>4.5</span>
                  <span className={styles.businessDot}>•</span>
                  <span className={styles.businessLocation}>Brickell</span>
                </div>
                <button className={styles.businessButton}>View Schedule</button>
              </div>
            </article>
          </div>
        </section>

        {/* MIAMI EXPERIENCES */}
        <section className={styles.experiencesSection}>
          <header className={styles.experiencesHeader}>
            <h2 className={styles.experiencesTitle}>Miami Experiences</h2>
            <p className={styles.experiencesSubtitle}>
              Curated, bookable experiences — from street art tours to yacht
              days. Listings typically range from{" "}
              <strong>$150–$1,000 per experience</strong>.
            </p>
          </header>

          <div className={styles.experiencesGrid}>
            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Street Art Tour</div>
              <h3 className={styles.experienceName}>Wynwood Street Art Walk</h3>
              <p className={styles.experienceTags}>
                Walking tour · Local guide · Photo spots
              </p>
              <p className={styles.experienceMeta}>
                2–3 hours · Small groups · Perfect pre- or post-match.
              </p>
              <p className={styles.experiencePrice}>From $150 per group</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>

            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Stadium Tour</div>
              <h3 className={styles.experienceName}>
                Hard Rock Stadium Insider Tour
              </h3>
              <p className={styles.experienceTags}>
                Locker room access · Pitch-side photos
              </p>
              <p className={styles.experienceMeta}>
                Go behind the scenes where the world&apos;s best play.
              </p>
              <p className={styles.experiencePrice}>From $220 per person</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>

            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Water Sports</div>
              <h3 className={styles.experienceName}>South Beach Jet Ski Run</h3>
              <p className={styles.experienceTags}>
                Ocean ride · Skyline views · Adrenaline
              </p>
              <p className={styles.experienceMeta}>
                Guided jet ski session along the Miami coastline.
              </p>
              <p className={styles.experiencePrice}>From $180 per jet ski</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>

            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Yacht Experience</div>
              <h3 className={styles.experienceName}>Biscayne Bay Match Cruise</h3>
              <p className={styles.experienceTags}>
                Private yacht · Onboard screen · Snacks
              </p>
              <p className={styles.experienceMeta}>
                Watch the match from the water with your crew.
              </p>
              <p className={styles.experiencePrice}>From $950 per charter</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>

            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Food &amp; Culture</div>
              <h3 className={styles.experienceName}>
                Little Haiti Food &amp; Culture Tour
              </h3>
              <p className={styles.experienceTags}>
                Haitian cuisine · Live culture · Storytelling
              </p>
              <p className={styles.experienceMeta}>
                Taste, listen, and walk through the roots of Caribbean Miami.
              </p>
              <p className={styles.experiencePrice}>From $160 per person</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>

            <article className={styles.experienceCard}>
              <div className={styles.experiencePill}>Nightlife</div>
              <h3 className={styles.experienceName}>Salsa &amp; Kompa Night</h3>
              <p className={styles.experienceTags}>
                Dance class · Live DJ · Social night
              </p>
              <p className={styles.experienceMeta}>
                Learn the basics, then dance with locals &amp; visiting fans.
              </p>
              <p className={styles.experiencePrice}>From $120 per person</p>
              <button className={styles.experienceButton}>
                View Experience
              </button>
            </article>
          </div>

          <div className={styles.experiencesFooter}>
            <button className={styles.experiencesCtaPrimary}>
              List My Experience
            </button>
            <button className={styles.experiencesCtaSecondary}>
              See All Miami Experiences
            </button>
          </div>
        </section>

        {/* MIAMI NIGHTLIFE CALENDAR */}
        <section className={styles.nightlifeCalendarSection}>
          <header className={styles.nightlifeHeader}>
            <h2 className={styles.nightlifeTitle}>Miami Nightlife Calendar</h2>
            <p className={styles.nightlifeSubtitle}>
              One scroll of all the must-hit clubs, rooftops, live music spots,
              watch parties, and cultural nights — updated for World Cup season.
            </p>
          </header>

          <div className={styles.nightlifeTimeline}>
            <div className={styles.nightlifeTimelineInner}>
              <article className={styles.nightlifeEvent}>
                <div className={styles.nightlifeEventTime}>Thu · 8:00 PM</div>
                <div className={styles.nightlifeEventBody}>
                  <h3 className={styles.nightlifeEventName}>
                    Kompa x Afrobeats Night
                  </h3>
                  <p className={styles.nightlifeEventMeta}>
                    Wynwood Social Club · DJs from Haiti &amp; Lagos ·
                    Match-day drink specials.
                  </p>
                  <p className={styles.nightlifeEventTagline}>
                    Perfect after Brazil vs. France.
                  </p>
                </div>
              </article>

              <article className={styles.nightlifeEvent}>
                <div className={styles.nightlifeEventTime}>Fri · 9:30 PM</div>
                <div className={styles.nightlifeEventBody}>
                  <h3 className={styles.nightlifeEventName}>
                    Rooftop Watch &amp; After-Party
                  </h3>
                  <p className={styles.nightlifeEventMeta}>
                    Brickell Match Lounge · Giant screens · VIP tables · Skyline
                    views.
                  </p>
                  <p className={styles.nightlifeEventTagline}>
                    Book early — limited terrace seating.
                  </p>
                </div>
              </article>

              <article className={styles.nightlifeEvent}>
                <div className={styles.nightlifeEventTime}>Sat · 6:00 PM</div>
                <div className={styles.nightlifeEventBody}>
                  <h3 className={styles.nightlifeEventName}>
                    Little Haiti Fan Block Party
                  </h3>
                  <p className={styles.nightlifeEventMeta}>
                    NE 2nd Ave · Live bands, street food, match screens, and
                    family-friendly vibes.
                  </p>
                  <p className={styles.nightlifeEventTagline}>
                    Caribbean energy before and after the match.
                  </p>
                </div>
              </article>

              <article className={styles.nightlifeEvent}>
                <div className={styles.nightlifeEventTime}>Sun · 4:00 PM</div>
                <div className={styles.nightlifeEventBody}>
                  <h3 className={styles.nightlifeEventName}>
                    Sunset Beach Watch Party
                  </h3>
                  <p className={styles.nightlifeEventMeta}>
                    South Beach · Screens in the sand · DJs · Food trucks.
                  </p>
                  <p className={styles.nightlifeEventTagline}>
                    Bring a flag, meet fans from everywhere.
                  </p>
                </div>
              </article>

              <article className={styles.nightlifeEvent}>
                <div className={styles.nightlifeEventTime}>Mon · 7:00 PM</div>
                <div className={styles.nightlifeEventBody}>
                  <h3 className={styles.nightlifeEventName}>
                    Live Latin Band &amp; Match Replay
                  </h3>
                  <p className={styles.nightlifeEventMeta}>
                    Coral Gables · Live music, match highlights, late kitchen.
                  </p>
                  <p className={styles.nightlifeEventTagline}>
                    Chill night after a full weekend of football.
                  </p>
                </div>
              </article>
            </div>

            <div className={styles.nightlifeFooterRow}>
              <p className={styles.nightlifeFooterText}>
                Clubs, rooftops, lounges &amp; promoters can apply to be
                featured in the Nightlife Calendar.
              </p>
              <button className={styles.nightlifeCtaButton}>
                Submit My Event
              </button>
            </div>
          </div>
        </section>

        {/* MIAMI ESSENTIALS */}
        <section className={styles.essentialsSection}>
          <header className={styles.essentialsHeader}>
            <h2 className={styles.essentialsTitle}>Miami Essentials</h2>
            <p className={styles.essentialsSubtitle}>
              Practical tips so you can enjoy the World Cup in Miami safely,
              confidently, and like a local.
            </p>
          </header>

          <div className={styles.essentialsGrid}>
            <article className={styles.essentialsCard}>
              <h3 className={styles.essentialsCardTitle}>Safety &amp; Local Laws</h3>
              <ul className={styles.essentialsList}>
                <li>Drinking age is 21+ — ID checks are strict at clubs &amp; bars.</li>
                <li>
                  Open containers are not allowed in most public streets and beaches.
                </li>
                <li>Stay in well-lit, active areas after late-night matches.</li>
                <li>
                  Use licensed taxis or ride-share pick-up points, especially
                  after midnight.
                </li>
                <li>
                  Respect noise rules in residential neighborhoods and Airbnbs.
                </li>
              </ul>
            </article>

            <article className={styles.essentialsCard}>
              <h3 className={styles.essentialsCardTitle}>
                Stadium, Weather &amp; Transport
              </h3>
              <ul className={styles.essentialsList}>
                <li>
                  Stadium bag policy: small clear bags only — check official
                  guidelines before arriving.
                </li>
                <li>
                  Miami heat is real — hydrate, sunscreen, and light clothing
                  are non-negotiable.
                </li>
                <li>
                  Plan extra time for traffic on match days, especially around
                  Miami Gardens &amp; Downtown.
                </li>
                <li>
                  Use Metrorail, Brightline, and official shuttles when
                  possible to avoid parking chaos.
                </li>
                <li>
                  Save your accommodation and embassy contact details in your
                  phone before going out.
                </li>
              </ul>
            </article>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} World Cup in Miami · Fan Guide. Not
        affiliated with FIFA. For planning inspiration only.
      </footer>
    </div>
  );
}
