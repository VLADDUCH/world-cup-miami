import React, { useState } from "react";
import { submitLead } from "../services/wcimApi";
import { trackLeadSubmitted } from "../services/analyticsTracker";
import styles from "../styles/Home.module.css";

const INTEREST_OPTIONS = [
  { value: "fan_updates", label: "Fan updates" },
  { value: "fan experiences", label: "fan experiences updates" },
  { value: "advertising", label: "Advertising / sponsorship" },
  { value: "business_listing", label: "Business listing" },
  { value: "events", label: "Events / watch parties" },
  { value: "tickets", label: "Tickets info" },
  { value: "general", label: "General updates" },
];

const DEFAULT_FORM = {
  email: "",
  name: "",
  phone: "",
  interest: "fan_updates",
  message: "",
  consentToContact: false,
};

export default function EmailCapturePanel({
  source = "homepage",
  title = "Get Closer to the Moment Before Everyone Else",
  subtitle = "Join the WCIM list and be first to know where fans are gathering, what updates are coming, which events are heating up, and where Miami’s World Cup energy is moving next.",
  compact = false,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setStatus("submitting");
      setNotice("");

      await submitLead({
        ...form,
        source,
      });

      trackLeadSubmitted({
        source,
        interest: form.interest,
        email: form.email,
      });

      setStatus("success");
      setNotice("You're on the list. We'll keep you updated.");
      setForm(DEFAULT_FORM);
    } catch (error) {
      setStatus("error");
      setNotice(error.message || "Could not submit lead. Please try again.");
    }
  }

  return (
    <section className={`${styles.emailCaptureSection} ${compact ? styles.emailCaptureCompact : ""}`}>
      <div className={styles.emailCaptureCopy}>
        <p>Join the Miami World Cup List</p>
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </div>

      <form className={styles.emailCaptureForm} onSubmit={handleSubmit}>
        <div className={styles.emailFieldGrid}>
          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Your name"
            />
          </label>
        </div>

        <div className={styles.emailFieldGrid}>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={updateField}
              placeholder="Optional"
            />
          </label>

          <label>
            Interest
            <select name="interest" value={form.interest} onChange={updateField}>
              {INTEREST_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Message
          <textarea
            name="message"
            rows={compact ? 2 : 3}
            value={form.message}
            onChange={updateField}
            placeholder="Tell us what kind of Miami World Cup moments you want first..."
          />
        </label>

        <label className={styles.emailConsent}>
          <input
            name="consentToContact"
            type="checkbox"
            checked={form.consentToContact}
            onChange={updateField}
            required
          />
          <span>Yes — send me Miami World Cup updates, local experiences, fan experiences updates, and opportunities worth knowing about.</span>
        </label>

        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting..." : "Join the Miami List"}
        </button>

        {notice ? (
          <div className={`${styles.emailNotice} ${styles[`emailNotice_${status}`] || ""}`}>
            {notice}
          </div>
        ) : null}
      </form>
    </section>
  );
}
