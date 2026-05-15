import express from "express";
import {
  approveSubmission,
  getReviewQueue,
  getReviewStats,
  getSubmissionById,
  markSubmissionContacted,
  rejectSubmission,
  updateSubmissionReview,
} from "../services/reviewQueueService.js";

const router = express.Router();

function adminToken() {
  return process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token";
}

function requireAdmin(req, res, next) {
  const suppliedToken = req.headers["x-admin-token"];

  if (!suppliedToken || suppliedToken !== adminToken()) {
    return res.status(401).json({
      status: "error",
      error: "Admin review token required.",
      timestamp: new Date().toISOString(),
    });
  }

  return next();
}

router.use(requireAdmin);

router.get("/promotions", async (req, res, next) => {
  try {
    const queue = await getReviewQueue(req.query);

    res.json({
      ...queue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/promotions/stats", async (req, res, next) => {
  try {
    const stats = await getReviewStats();

    res.json({
      status: "ok",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/promotions/:id", async (req, res, next) => {
  try {
    const submission = await getSubmissionById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        status: "error",
        error: "Submission not found.",
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      status: "ok",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/promotions/:id", async (req, res, next) => {
  try {
    const submission = await updateSubmissionReview(req.params.id, req.body);

    res.json({
      status: "ok",
      message: "Submission review updated.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/promotions/:id/approve", async (req, res, next) => {
  try {
    const submission = await approveSubmission(req.params.id, req.body);

    res.json({
      status: "ok",
      message: "Submission approved.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/promotions/:id/reject", async (req, res, next) => {
  try {
    const submission = await rejectSubmission(req.params.id, req.body);

    res.json({
      status: "ok",
      message: "Submission rejected.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/promotions/:id/contacted", async (req, res, next) => {
  try {
    const submission = await markSubmissionContacted(req.params.id, req.body);

    res.json({
      status: "ok",
      message: "Submission marked contacted.",
      submission,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
