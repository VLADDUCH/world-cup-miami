import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import request from "supertest";
import app from "../src/app.js";
import {
  createLead,
  exportLeadsCsv,
  getLeadStats,
  getLeads,
  leadsToCsv,
} from "../src/services/leadService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const leadsPath = path.resolve(__dirname, "../src/data/leads.json");

const adminHeaders = {
  "x-admin-token": process.env.ADMIN_REVIEW_TOKEN || "dev-admin-token",
};

async function resetLeads() {
  await fs.writeFile(leadsPath, "[]\n", "utf8");
}

test("createLead stores a valid lead", async () => {
  await resetLeads();

  const lead = await createLead({
    email: "fan@example.com",
    name: "Fan One",
    source: "homepage",
    interest: "fan_updates",
    message: "Send me updates.",
    consentToContact: true,
  });

  assert.equal(lead.email, "fan@example.com");
  assert.equal(lead.interest, "fan_updates");
  assert.equal(lead.status, "active");
});

test("getLeads filters leads by interest", async () => {
  await resetLeads();

  await createLead({
    email: "ads@example.com",
    source: "advertise",
    interest: "advertising",
    message: "Advertising interest.",
    consentToContact: true,
  });

  const leads = await getLeads({ interest: "advertising" });

  assert.equal(leads.length, 1);
  assert.equal(leads[0].email, "ads@example.com");
});

test("getLeadStats returns lead counts", async () => {
  await resetLeads();

  await createLead({
    email: "merch@example.com",
    source: "shop",
    interest: "merch",
    message: "Merch interest.",
    consentToContact: true,
  });

  const stats = await getLeadStats();

  assert.equal(stats.total, 1);
  assert.equal(stats.byInterest.merch, 1);
});

test("leadsToCsv exports CSV text", () => {
  const csv = leadsToCsv([
    {
      id: "lead-1",
      email: "csv@example.com",
      name: "CSV Lead",
      source: "homepage",
      interest: "fan_updates",
      consentToContact: true,
    },
  ]);

  assert.ok(csv.includes("email"));
  assert.ok(csv.includes("csv@example.com"));
});

test("GET /api/v1/leads requires admin token", async () => {
  await request(app)
    .get("/api/v1/leads")
    .expect(401);
});

test("POST /api/v1/leads/subscribe accepts lead", async () => {
  await resetLeads();

  const response = await request(app)
    .post("/api/v1/leads/subscribe")
    .send({
      email: "subscriber@example.com",
      name: "Subscriber",
      source: "homepage",
      interest: "fan_updates",
      message: "Keep me updated.",
      consentToContact: true
    })
    .expect(201);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.lead.email, "subscriber@example.com");
});


test("POST /api/v1/leads/subscribe accepts display label interest value", async () => {
  await resetLeads();

  const response = await request(app)
    .post("/api/v1/leads/subscribe")
    .send({
      email: "displaylabel@example.com",
      name: "Display Label",
      phone: "7708993744",
      source: "homepage",
      interest: "Fan updates",
      message: "Testing display label interest value.",
      consentToContact: true
    })
    .expect(201);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.lead.email, "displaylabel@example.com");
  assert.equal(response.body.lead.interest, "fan_updates");
});

test("POST /api/v1/leads/subscribe rejects invalid lead", async () => {
  await request(app)
    .post("/api/v1/leads/subscribe")
    .send({
      email: "bad-email",
      consentToContact: true
    })
    .expect(400);
});

test("GET /api/v1/leads returns leads for admin", async () => {
  await resetLeads();

  await createLead({
    email: "adminlead@example.com",
    source: "homepage",
    interest: "fan_updates",
    message: "Admin visible.",
    consentToContact: true,
  });

  const response = await request(app)
    .get("/api/v1/leads")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.count >= 1);
});

test("GET /api/v1/leads/stats returns stats for admin", async () => {
  await resetLeads();

  await createLead({
    email: "stats@example.com",
    source: "homepage",
    interest: "fan_updates",
    message: "Stats visible.",
    consentToContact: true,
  });

  const response = await request(app)
    .get("/api/v1/leads/stats")
    .set(adminHeaders)
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.ok(response.body.stats.total >= 1);
});

test("GET /api/v1/leads/export.csv returns CSV for admin", async () => {
  await resetLeads();

  await createLead({
    email: "export@example.com",
    source: "homepage",
    interest: "fan_updates",
    message: "Export visible.",
    consentToContact: true,
  });

  const response = await request(app)
    .get("/api/v1/leads/export.csv")
    .set(adminHeaders)
    .expect(200);

  assert.ok(response.text.includes("export@example.com"));
  assert.equal(response.headers["content-type"].includes("text/csv"), true);
});

test("GET /api/v1/status includes lead readiness", async () => {
  const response = await request(app)
    .get("/api/v1/status")
    .expect(200);

  assert.equal(response.body.status, "ok");
  assert.equal(response.body.feeds.leads.subscribeEndpoint, "configured");
  assert.equal(response.body.feeds.leads.csvExportEndpoint, "configured");
});
