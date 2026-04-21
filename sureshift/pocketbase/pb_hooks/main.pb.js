/// <reference path="../pb_data/types.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
//  SureShift ERP — PocketBase Hooks
//  Runs server-side on every PocketBase startup.
//  Handles: admin seeding · document auto-numbering · health route
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Seed super admin + default settings on very first boot ────────────────
onAfterBootstrap((e) => {
  // Check if any users exist already
  let existing = [];
  try {
    existing = $app.dao().findRecordsByFilter("users", "id != ''", "-created", 1, 0);
  } catch (_) { return; } // collection not yet ready

  if (existing.length > 0) return; // already seeded

  $app.logger().info("[SureShift] First boot — seeding super admin...");

  try {
    const col = $app.dao().findCollectionByNameOrId("users");
    const rec = new Record(col);

    const adminEmail = process.env.PB_SUPER_ADMIN_EMAIL || "admin@sureshift.in";
    const adminPass  = process.env.PB_SUPER_ADMIN_PASS  || "SureShift@2026!";

    rec.setPassword(adminPass);
    rec.Set("username",        "superadmin");
    rec.Set("email",           adminEmail);
    rec.Set("emailVisibility", true);
    rec.Set("verified",        true);
    rec.Set("name",            "Suresh Admin");
    rec.Set("phone",           "9073291732");
    rec.Set("role",            "super_admin");
    rec.Set("branch",          "NDLH");
    rec.Set("status",          "active");
    rec.Set("permissions", {
      enquiries:  ["view","create","edit","delete","assign"],
      survey:     ["view","create","edit","report"],
      quotations: ["view","create","edit","send","approve"],
      bookings:   ["view","create","edit","cancel"],
      operations: ["view","update","dispatch","checklist"],
      finance:    ["view","invoices","receipts","payouts","gst"],
      customers:  ["view","create","edit","delete"],
      vendors:    ["view","create","edit","delete"],
      reports:    ["view","export"],
      users:      ["view","create","edit","delete","roles"],
      settings:   ["view","edit"],
    });

    $app.dao().saveRecord(rec);
    $app.logger().info("[SureShift] Super admin created: " + adminEmail);
  } catch (err) {
    $app.logger().error("[SureShift] Failed to seed admin: " + err);
    return;
  }

  // Seed default app settings
  try {
    const settingsCol = $app.dao().findCollectionByNameOrId("app_settings");

    const defaults = [
      {
        key: "company",
        category: "company",
        value: {
          name:    "Sure Shift Relocation Services Pvt. Ltd.",
          gst:     "07AABCS1234A1Z1",
          address: "P Block, Plot 131, Gopal Nagar Extension, Najafgarh, New Delhi – 110043",
          phone:   "9073291732",
          email:   "info@sureshift.in",
          website: "https://sureshift.in",
        },
      },
      {
        key: "notifications",
        category: "notifications",
        value: {
          whatsapp: true, email: true, sms: false,
          autoFollowUp: true, readReceipts: true,
        },
      },
      {
        key: "billing",
        category: "billing",
        value: {
          gstRate: 18, tokenMin: 1000,
          paymentTermsLocal:       "full_on_delivery",
          paymentTermsInterstate:  "80_20",
        },
      },
    ];

    defaults.forEach((d) => {
      const r = new Record(settingsCol);
      r.Set("key",      d.key);
      r.Set("value",    d.value);
      r.Set("category", d.category);
      $app.dao().saveRecord(r);
    });

    $app.logger().info("[SureShift] Default settings seeded.");
  } catch (err) {
    $app.logger().error("[SureShift] Failed to seed settings: " + err);
  }
});

// ── 2. Auto-generate Enquiry number before create ────────────────────────────
// Format: SS-ENQ-NDLH-2627-0001  (increments per branch+fy)
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("enq_number") !== "") return; // already set

  const branch = e.record.GetString("branch") || "NDLH";
  const fy     = e.record.GetString("fy")     || "2627";

  try {
    const existing = $app.dao().findRecordsByFilter(
      "enquiries",
      `branch = "${branch}" && fy = "${fy}"`,
      "-created", 0, 0
    );
    const seq = String(existing.length + 1).padStart(4, "0");
    e.record.Set("enq_number", `SS-ENQ-${branch}-${fy}-${seq}`);
    e.record.Set("seq", seq);
  } catch (err) {
    $app.logger().error("[SureShift] Enquiry numbering failed: " + err);
  }
}, "enquiries");

// ── 3. Auto-generate Survey number before create ─────────────────────────────
// Derives branch/fy/seq from linked enquiry → SS-SRV-NDLH-2627-0001
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("survey_number") !== "") return;

  try {
    const enqId = e.record.GetString("enquiry");
    const enq   = $app.dao().findRecordById("enquiries", enqId);
    const branch = enq.GetString("branch");
    const fy     = enq.GetString("fy");
    const seq    = enq.GetString("seq");
    e.record.Set("survey_number", `SS-SRV-${branch}-${fy}-${seq}`);
  } catch (err) {
    $app.logger().error("[SureShift] Survey numbering failed: " + err);
  }
}, "surveys");

// ── 4. Auto-generate Quotation number before create ──────────────────────────
// SS-QUOT-NDLH-2627-0001  (revision appended by API when revising)
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("quot_number") !== "") return;

  try {
    const enqId = e.record.GetString("enquiry");
    const enq   = $app.dao().findRecordById("enquiries", enqId);
    const branch = enq.GetString("branch");
    const fy     = enq.GetString("fy");
    const seq    = enq.GetString("seq");
    const rev    = e.record.GetInt("revisions") || 0;
    const suffix = rev > 0 ? `/${rev}` : "";
    const baseId = `SS-QUOT-${branch}-${fy}-${seq}`;
    e.record.Set("quot_number", baseId + suffix);
    e.record.Set("base_id",    baseId);
  } catch (err) {
    $app.logger().error("[SureShift] Quotation numbering failed: " + err);
  }
}, "quotations");

// ── 5. Auto-generate CFR number before create ────────────────────────────────
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("cfr_number") !== "") return;

  try {
    const enqId = e.record.GetString("enquiry");
    const enq   = $app.dao().findRecordById("enquiries", enqId);
    e.record.Set("cfr_number",
      `SS-CFR-${enq.GetString("branch")}-${enq.GetString("fy")}-${enq.GetString("seq")}`);
  } catch (err) {
    $app.logger().error("[SureShift] CFR numbering failed: " + err);
  }
}, "cfr");

// ── 6. Auto-generate Invoice number before create ────────────────────────────
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("inv_number") !== "") return;

  try {
    const cfrId = e.record.GetString("cfr");
    const cfr   = $app.dao().findRecordById("cfr", cfrId);
    const enq   = $app.dao().findRecordById("enquiries", cfr.GetString("enquiry"));
    e.record.Set("inv_number",
      `SS-INV-${enq.GetString("branch")}-${enq.GetString("fy")}-${enq.GetString("seq")}`);
  } catch (err) {
    $app.logger().error("[SureShift] Invoice numbering failed: " + err);
  }
}, "invoices");

// ── 7. Auto-generate Support ticket number before create ─────────────────────
onRecordBeforeCreateRequest((e) => {
  if (e.record.GetString("ticket_no") !== "") return;

  try {
    const all = $app.dao().findRecordsByFilter("tickets", "id != ''", "-created", 0, 0);
    const seq  = String(all.length + 1).padStart(4, "0");
    e.record.Set("ticket_no", `SS-TKT-${seq}`);
  } catch (err) {
    $app.logger().error("[SureShift] Ticket numbering failed: " + err);
  }
}, "tickets");

// ── 8. Health + ping route ───────────────────────────────────────────────────
routerAdd("GET", "/api/erp/ping", (c) => {
  return c.json(200, {
    status:  "ok",
    service: "SureShift ERP",
    version: "2.0.0",
    time:    new Date().toISOString(),
  });
});
