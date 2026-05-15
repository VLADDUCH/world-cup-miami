import React, { useEffect, useMemo, useState } from "react";
import {
  getPromotionTypes,
  submitPromotion,
} from "../services/wcimApi";
import styles from "../styles/Home.module.css";

const fallbackTypes = [
  { slug: "business_listing", label: "Add My Business" },
  { slug: "flyer", label: "Add My Flyer" },
  { slug: "watch_party", label: "Submit Watch Party" },
  { slug: "event", label: "Submit Event" },
  { slug: "featured_placement", label: "Request Featured Placement" },
  { slug: "sponsor_inquiry", label: "Sponsor / Advertise Inquiry" },
];

const initialForm = {
  submissionType: "business_listing",
  businessName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
  instagram: "",
  category: "",
  locationArea: "Miami",
  address: "",
  eventDate: "",
  eventTime: "",
  budgetRange: "not_sure",
  message: "",
  consentToContact: false,
};

export default function SubmissionPanel() {
  const [types, setTypes] = useState(fallbackTypes);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTypes() {
      try {
        const result = await getPromotionTypes();

        if (!ignore && result.length > 0) {
          setTypes(result);
        }
      } catch (error) {
        if (!ignore) {
          setTypes(fallbackTypes);
        }
      }
    }

    loadTypes();

    return () => {
      ignore = true;
    };
  }, []);

  const activeType = useMemo(
    () => types.find((type) => type.slug === form.submissionType) || types[0],
    [form.submissionType, types]
  );

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
      setMessage("");

      await submitPromotion(form);

      setStatus("success");
      setMessage("Submission received. We will review it and contact you.");
      setForm(initialForm);
    } catch (error) {
      setStatus("error");
      setMessage("Submission failed. Check required fields and try again.");
    }
  }

  return (
    <section className={styles.submissionSection} id="submit">
      <div className={styles.sectionHeading}>
        <div>
          <p>Add Your Flyer / Business</p>
          <h2>Turn Miami World Cup traffic into customers</h2>
        </div>
        <a href="#submit-form">Start Submission</a>
      </div>

      <div className={styles.submissionLayout}>
        <aside className={styles.submissionPitch}>
          <span>Ad + promotion intake</span>
          <h3>{activeType?.label || "Promote in Miami"}</h3>
          <p>
            Submit your business, flyer, watch party, local event, or sponsor inquiry.
            Every submission goes into pending review before being published.
          </p>

          <div className={styles.submissionTypeGrid}>
            {types.map((type) => (
              <button
                type="button"
                key={type.slug}
                className={`${styles.submissionTypeButton} ${
                  form.submissionType === type.slug ? styles.submissionTypeButtonActive : ""
                }`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    submissionType: type.slug,
                  }))
                }
              >
                <strong>{type.label}</strong>
                {type.description ? <small>{type.description}</small> : null}
              </button>
            ))}
          </div>
        </aside>

        <form className={styles.submissionForm} id="submit-form" onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <label>
              Business / Event Name *
              <input
                name="businessName"
                value={form.businessName}
                onChange={updateField}
                required
                minLength={2}
                placeholder="Example: Wynwood Soccer Watch Party"
              />
            </label>

            <label>
              Contact Name *
              <input
                name="contactName"
                value={form.contactName}
                onChange={updateField}
                required
                minLength={2}
                placeholder="Your name"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Email *
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                required
                placeholder="you@example.com"
              />
            </label>

            <label>
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Category
              <input
                name="category"
                value={form.category}
                onChange={updateField}
                placeholder="Restaurant, sports bar, merch, nightlife..."
              />
            </label>

            <label>
              Miami Area
              <input
                name="locationArea"
                value={form.locationArea}
                onChange={updateField}
                placeholder="Wynwood, Brickell, Doral, Miami Gardens..."
              />
            </label>
          </div>

          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={updateField}
              placeholder="Optional address or neighborhood"
            />
          </label>

          <div className={styles.formRow}>
            <label>
              Website
              <input
                name="website"
                type="url"
                value={form.website}
                onChange={updateField}
                placeholder="https://example.com"
              />
            </label>

            <label>
              Instagram
              <input
                name="instagram"
                value={form.instagram}
                onChange={updateField}
                placeholder="@yourbusiness"
              />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              Event Date
              <input
                name="eventDate"
                value={form.eventDate}
                onChange={updateField}
                placeholder="June 15, 2026"
              />
            </label>

            <label>
              Event Time
              <input
                name="eventTime"
                value={form.eventTime}
                onChange={updateField}
                placeholder="6:00 PM"
              />
            </label>
          </div>

          <label>
            Budget Range
            <select name="budgetRange" value={form.budgetRange} onChange={updateField}>
              <option value="not_sure">Not sure yet</option>
              <option value="under_250">Under $250</option>
              <option value="250_500">$250 - $500</option>
              <option value="500_1000">$500 - $1,000</option>
              <option value="1000_plus">$1,000+</option>
            </select>
          </label>

          <label>
            What do you want to promote? *
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              required
              minLength={10}
              rows={5}
              placeholder="Tell us about your flyer, watch party, event, business, offer, or sponsor request."
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="consentToContact"
              checked={form.consentToContact}
              onChange={updateField}
              required
            />
            I agree to be contacted about this submission.
          </label>

          {message ? (
            <div className={`${styles.submissionMessage} ${styles[`submissionMessage_${status}`]}`}>
              {message}
            </div>
          ) : null}

          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </div>
    </section>
  );
}
