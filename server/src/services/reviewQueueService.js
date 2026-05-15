import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promotionSubmissionsPath = path.resolve(__dirname, "../data/promotionSubmissions.json");

const allowedStatuses = [
  "pending_review",
  "approved",
  "rejected",
  "contacted",
  "archived",
];

const reviewUpdateSchema = z.object({
  status: z.enum(allowedStatuses).optional(),
  reviewerName: z.string().trim().max(120).optional().default("Admin"),
  reviewNote: z.string().trim().max(1200).optional().default(""),
  internalPriority: z
    .enum(["low", "normal", "high", "urgent"])
    .optional()
    .default("normal"),
  contactedAt: z.string().trim().max(80).optional().default(""),
  approvedPlacement: z
    .enum([
      "none",
      "business_listing",
      "featured_business",
      "event_card",
      "map_pin",
      "homepage_sponsor",
      "news_sponsor",
      "events_sponsor",
    ])
    .optional()
    .default("none"),
});

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeSubmission(submission) {
  return {
    review: {
      status: submission.status || "pending_review",
      reviewerName: submission.reviewerName || "",
      reviewNote: submission.reviewNote || "",
      internalPriority: submission.internalPriority || "normal",
      contactedAt: submission.contactedAt || "",
      approvedPlacement: submission.approvedPlacement || "none",
      reviewedAt: submission.reviewedAt || "",
    },
    ...submission,
  };
}

function applyFilters(submissions, filters = {}) {
  const status = String(filters.status || "").trim();
  const type = String(filters.type || "").trim();
  const search = String(filters.search || "").trim().toLowerCase();

  return submissions.filter((submission) => {
    if (status && submission.status !== status) return false;
    if (type && submission.submissionType !== type) return false;

    if (search) {
      const haystack = [
        submission.businessName,
        submission.contactName,
        submission.email,
        submission.phone,
        submission.category,
        submission.locationArea,
        submission.message,
        submission.submissionType,
        submission.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

function sortSubmissions(submissions) {
  const priorityOrder = {
    urgent: 0,
    high: 1,
    normal: 2,
    low: 3,
  };

  return [...submissions].sort((a, b) => {
    const priorityA = priorityOrder[a.internalPriority || "normal"] ?? 2;
    const priorityB = priorityOrder[b.internalPriority || "normal"] ?? 2;

    if (priorityA !== priorityB) return priorityA - priorityB;

    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });
}

async function getReviewQueue(filters = {}) {
  const submissions = await readJsonFile(promotionSubmissionsPath, []);
  const normalized = submissions.map(normalizeSubmission);
  const filtered = applyFilters(normalized, filters);
  const sorted = sortSubmissions(filtered);

  return {
    status: "ok",
    count: sorted.length,
    submissions: sorted,
  };
}

async function getReviewStats() {
  const submissions = await readJsonFile(promotionSubmissionsPath, []);

  const stats = {
    total: submissions.length,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    contacted: 0,
    archived: 0,
    byType: {},
    byPlacement: {},
  };

  for (const submission of submissions) {
    const status = submission.status || "pending_review";
    stats[status] = (stats[status] || 0) + 1;

    const type = submission.submissionType || "unknown";
    stats.byType[type] = (stats.byType[type] || 0) + 1;

    const placement = submission.approvedPlacement || "none";
    stats.byPlacement[placement] = (stats.byPlacement[placement] || 0) + 1;
  }

  return stats;
}

async function getSubmissionById(id) {
  const submissions = await readJsonFile(promotionSubmissionsPath, []);
  const found = submissions.find((submission) => submission.id === id);

  return found ? normalizeSubmission(found) : null;
}

async function updateSubmissionReview(id, payload) {
  const parsed = reviewUpdateSchema.safeParse(payload || {});

  if (!parsed.success) {
    const error = new Error("Invalid review update.");
    error.status = 400;
    error.details = parsed.error.flatten();
    throw error;
  }

  const submissions = await readJsonFile(promotionSubmissionsPath, []);
  const index = submissions.findIndex((submission) => submission.id === id);

  if (index === -1) {
    const error = new Error("Submission not found.");
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const current = submissions[index];

  const nextStatus = parsed.data.status || current.status || "pending_review";

  const updated = {
    ...current,
    status: nextStatus,
    reviewerName: parsed.data.reviewerName || current.reviewerName || "Admin",
    reviewNote:
      parsed.data.reviewNote !== undefined
        ? parsed.data.reviewNote
        : current.reviewNote || "",
    internalPriority:
      parsed.data.internalPriority || current.internalPriority || "normal",
    contactedAt:
      parsed.data.contactedAt ||
      (nextStatus === "contacted" && !current.contactedAt ? now : current.contactedAt || ""),
    approvedPlacement:
      parsed.data.approvedPlacement || current.approvedPlacement || "none",
    reviewedAt: now,
    updatedAt: now,
  };

  submissions[index] = updated;
  await writeJsonFile(promotionSubmissionsPath, submissions);

  return normalizeSubmission(updated);
}

async function approveSubmission(id, payload = {}) {
  return updateSubmissionReview(id, {
    ...payload,
    status: "approved",
  });
}

async function rejectSubmission(id, payload = {}) {
  return updateSubmissionReview(id, {
    ...payload,
    status: "rejected",
  });
}

async function markSubmissionContacted(id, payload = {}) {
  return updateSubmissionReview(id, {
    ...payload,
    status: "contacted",
    contactedAt: payload.contactedAt || new Date().toISOString(),
  });
}

export {
  allowedStatuses,
  reviewUpdateSchema,
  getReviewQueue,
  getReviewStats,
  getSubmissionById,
  updateSubmissionReview,
  approveSubmission,
  rejectSubmission,
  markSubmissionContacted,
};
