import React, { useEffect, useMemo, useState } from "react";
import {
  approveAdminPromotion,
  getAdminPromotionQueue,
  getAdminPromotionStats,
  markAdminPromotionContacted,
  rejectAdminPromotion,
  updateAdminPromotionReview,
} from "../services/wcimApi";
import styles from "../styles/AdminReview.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "contacted", label: "Contacted" },
  { value: "archived", label: "Archived" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "business_listing", label: "Business Listing" },
  { value: "flyer", label: "Flyer" },
  { value: "watch_party", label: "Watch Party" },
  { value: "event", label: "Event" },
  { value: "featured_placement", label: "Featured Placement" },
  { value: "sponsor_inquiry", label: "Sponsor Inquiry" },
];

const PLACEMENT_OPTIONS = [
  { value: "none", label: "No placement" },
  { value: "business_listing", label: "Business Listing" },
  { value: "featured_business", label: "Featured Business" },
  { value: "event_card", label: "Event Card" },
  { value: "map_pin", label: "Map Pin" },
  { value: "homepage_sponsor", label: "Homepage Sponsor" },
  { value: "news_sponsor", label: "News Sponsor" },
  { value: "events_sponsor", label: "Events Sponsor" },
];

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatType(type = "") {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReviewCard({
  submission,
  token,
  onRefresh,
  setGlobalMessage,
}) {
  const [reviewNote, setReviewNote] = useState(submission.reviewNote || "");
  const [reviewerName, setReviewerName] = useState(submission.reviewerName || "Admin");
  const [internalPriority, setInternalPriority] = useState(
    submission.internalPriority || "normal"
  );
  const [approvedPlacement, setApprovedPlacement] = useState(
    submission.approvedPlacement || "none"
  );
  const [busyAction, setBusyAction] = useState("");

  async function runAction(actionName, actionFn) {
    try {
      setBusyAction(actionName);
      setGlobalMessage("");

      await actionFn();

      setGlobalMessage(`Submission ${actionName} successfully.`);
      await onRefresh();
    } catch (error) {
      setGlobalMessage(`Action failed: ${error.message}`);
    } finally {
      setBusyAction("");
    }
  }

  const reviewPayload = {
    reviewerName,
    reviewNote,
    internalPriority,
    approvedPlacement,
  };

  return (
    <article className={styles.reviewCard}>
      <header className={styles.cardHeader}>
        <div>
          <span className={`${styles.statusPill} ${styles[`status_${submission.status}`] || ""}`}>
            {submission.status || "pending_review"}
          </span>
          <h3>{submission.businessName}</h3>
          <p>
            {formatType(submission.submissionType)} • {submission.locationArea || "Miami"} •{" "}
            {submission.budgetRange || "not_sure"}
          </p>
        </div>

        <div className={styles.createdAt}>
          <span>Submitted</span>
          <strong>{formatDate(submission.createdAt)}</strong>
        </div>
      </header>

      <div className={styles.contactGrid}>
        <div>
          <span>Contact</span>
          <strong>{submission.contactName}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{submission.email}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>{submission.phone || "Not provided"}</strong>
        </div>
        <div>
          <span>Instagram</span>
          <strong>{submission.instagram || "Not provided"}</strong>
        </div>
      </div>

      <div className={styles.messageBox}>
        <span>Submission Message</span>
        <p>{submission.message}</p>
      </div>

      <div className={styles.detailGrid}>
        <div>
          <span>Category</span>
          <strong>{submission.category || "N/A"}</strong>
        </div>
        <div>
          <span>Address</span>
          <strong>{submission.address || "N/A"}</strong>
        </div>
        <div>
          <span>Event Date</span>
          <strong>{submission.eventDate || "N/A"}</strong>
        </div>
        <div>
          <span>Event Time</span>
          <strong>{submission.eventTime || "N/A"}</strong>
        </div>
      </div>

      <div className={styles.reviewControls}>
        <label>
          Reviewer
          <input
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
          />
        </label>

        <label>
          Priority
          <select
            value={internalPriority}
            onChange={(event) => setInternalPriority(event.target.value)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Approved Placement
          <select
            value={approvedPlacement}
            onChange={(event) => setApprovedPlacement(event.target.value)}
          >
            {PLACEMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.noteField}>
          Review Note
          <textarea
            value={reviewNote}
            rows={3}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Internal note for this lead..."
          />
        </label>
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          disabled={Boolean(busyAction)}
          onClick={() =>
            runAction("updated", () =>
              updateAdminPromotionReview(token, submission.id, reviewPayload)
            )
          }
        >
          Save Review
        </button>

        <button
          type="button"
          disabled={Boolean(busyAction)}
          className={styles.approveButton}
          onClick={() =>
            runAction("approved", () =>
              approveAdminPromotion(token, submission.id, reviewPayload)
            )
          }
        >
          Approve
        </button>

        <button
          type="button"
          disabled={Boolean(busyAction)}
          className={styles.contactButton}
          onClick={() =>
            runAction("contacted", () =>
              markAdminPromotionContacted(token, submission.id, reviewPayload)
            )
          }
        >
          Mark Contacted
        </button>

        <button
          type="button"
          disabled={Boolean(busyAction)}
          className={styles.rejectButton}
          onClick={() =>
            runAction("rejected", () =>
              rejectAdminPromotion(token, submission.id, reviewPayload)
            )
          }
        >
          Reject
        </button>
      </div>

      {busyAction ? <small className={styles.busyText}>Working on {busyAction}...</small> : null}
    </article>
  );
}

export default function AdminReview() {
  const [token, setToken] = useState(() => localStorage.getItem("wcim_admin_token") || "");
  const [tokenInput, setTokenInput] = useState(token || "dev-admin-token");
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    search: "",
  });
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState("");

  const isAuthed = Boolean(token);

  async function loadDashboard() {
    if (!token) return;

    try {
      setLoading(true);
      setGlobalMessage("");

      const [statsResult, queueResult] = await Promise.all([
        getAdminPromotionStats(token),
        getAdminPromotionQueue(token, filters),
      ]);

      setStats(statsResult.stats);
      setSubmissions(queueResult.submissions || []);
    } catch (error) {
      setGlobalMessage(`Could not load admin review queue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters.status, filters.type]);

  const filteredSubmissions = useMemo(() => submissions, [submissions]);

  function handleTokenSubmit(event) {
    event.preventDefault();

    const nextToken = tokenInput.trim();

    if (!nextToken) {
      setGlobalMessage("Admin token is required.");
      return;
    }

    localStorage.setItem("wcim_admin_token", nextToken);
    setToken(nextToken);
  }

  function clearToken() {
    localStorage.removeItem("wcim_admin_token");
    setToken("");
    setStats(null);
    setSubmissions([]);
  }

  function updateFilter(event) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    await loadDashboard();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <a href="/" className={styles.backLink}>← Back to site</a>
          <p>WCIM Admin</p>
          <h1>Promotion Review Queue</h1>
          <span>
            Review business listings, flyers, watch parties, events, featured placements,
            and sponsor inquiries.
          </span>
        </div>

        <div className={styles.headerActions}>
          {isAuthed ? (
            <>
              <button type="button" onClick={loadDashboard}>
                Refresh
              </button>
              <button type="button" className={styles.secondaryButton} onClick={clearToken}>
                Clear Token
              </button>
            </>
          ) : null}
        </div>
      </header>

      {!isAuthed ? (
        <section className={styles.tokenPanel}>
          <h2>Enter admin review token</h2>
          <p>
            Use the backend <code>x-admin-token</code>. In local development, the default is
            <code> dev-admin-token</code>.
          </p>

          <form onSubmit={handleTokenSubmit}>
            <input
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="dev-admin-token"
            />
            <button type="submit">Open Review Queue</button>
          </form>
        </section>
      ) : (
        <>
          <section className={styles.statsGrid}>
            <article>
              <span>Total</span>
              <strong>{stats?.total ?? 0}</strong>
            </article>
            <article>
              <span>Pending</span>
              <strong>{stats?.pending_review ?? 0}</strong>
            </article>
            <article>
              <span>Approved</span>
              <strong>{stats?.approved ?? 0}</strong>
            </article>
            <article>
              <span>Contacted</span>
              <strong>{stats?.contacted ?? 0}</strong>
            </article>
            <article>
              <span>Rejected</span>
              <strong>{stats?.rejected ?? 0}</strong>
            </article>
          </section>

          <section className={styles.filtersPanel}>
            <form onSubmit={handleSearch}>
              <label>
                Status
                <select name="status" value={filters.status} onChange={updateFilter}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Type
                <select name="type" value={filters.type} onChange={updateFilter}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Search
                <input
                  name="search"
                  value={filters.search}
                  onChange={updateFilter}
                  placeholder="Search business, email, message..."
                />
              </label>

              <button type="submit">Search</button>
            </form>
          </section>

          {globalMessage ? (
            <section className={styles.messagePanel}>
              {globalMessage}
            </section>
          ) : null}

          <section className={styles.queueSection}>
            <div className={styles.queueHeader}>
              <h2>Submissions</h2>
              <span>{loading ? "Loading..." : `${filteredSubmissions.length} result(s)`}</span>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className={styles.emptyState}>
                <h3>No submissions found</h3>
                <p>
                  Once businesses submit flyers, events, watch parties, or sponsor inquiries,
                  they will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.queueGrid}>
                {filteredSubmissions.map((submission) => (
                  <ReviewCard
                    key={submission.id}
                    submission={submission}
                    token={token}
                    onRefresh={loadDashboard}
                    setGlobalMessage={setGlobalMessage}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
