/// <reference path="../pb_data/types.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
//  SureShift ERP — PocketBase Hooks  (v0.23+ API)
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Seed super admin + default settings on very first boot ────────────────
onBootstrap((e) => {
  e.next();

  let existing = [];
  try {
    existing = $app.findRecordsByFilter("users", "id != ''", "-created", 1, 0);
  } catch (_) { return; }

  if (existing.length > 0) return;

  $app.logger().info("[SureShift] First boot — seeding super admin...");

  try {
    const col = $app.findCollectionByNameOrId("users");
    const rec = new Record(col);

    const adminEmail = $os.getenv("PB_SUPER_ADMIN_EMAIL") || "admin@sureshift.in";
    const adminPass  = $os.getenv("PB_SUPER_ADMIN_PASS")  || "RaViGo1140";

    rec.setPassword(adminPass);
    rec.set("username",        "superadmin");
    rec.set("email",           adminEmail);
    rec.set("emailVisibility", true);
    rec.set("verified",        true);
    rec.set("name",            "Suresh Admin");
    rec.set("phone",           "9073291732");
    rec.set("role",            "super_admin");
    rec.set("branch",          "NDLH");
    rec.set("status",          "active");
    rec.set("permissions", {
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

    $app.save(rec);
    $app.logger().info("[SureShift] Super admin created: " + adminEmail);
  } catch (err) {
    $app.logger().error("[SureShift] Failed to seed admin: " + String(err));
    return;
  }

  // Seed default app settings
  try {
    const settingsCol = $app.findCollectionByNameOrId("app_settings");

    const defaults = [
      {
        key: "company", category: "company",
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
        key: "notifications", category: "notifications",
        value: { whatsapp:true, email:true, sms:false, autoFollowUp:true, readReceipts:true },
      },
      {
        key: "billing", category: "billing",
        value: { gstRate:18, tokenMin:1000, paymentTermsLocal:"full_on_delivery", paymentTermsInterstate:"80_20" },
      },
    ];

    defaults.forEach((d) => {
      const r = new Record(settingsCol);
      r.set("key",      d.key);
      r.set("value",    d.value);
      r.set("category", d.category);
      $app.save(r);
    });

    $app.logger().info("[SureShift] Default settings seeded.");
  } catch (err) {
    $app.logger().error("[SureShift] Failed to seed settings: " + String(err));
  }
});

// ── 2. Auto-generate Enquiry number ──────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("enq_number") !== "") return e.next();

  const branch = e.record.getString("branch") || "NDLH";
  const fy     = e.record.getString("fy")     || "2627";

  try {
    const existing = $app.findRecordsByFilter(
      "enquiries", `branch = "${branch}" && fy = "${fy}"`, "-created", 0, 0
    );
    const seq = String(existing.length + 1).padStart(4, "0");
    e.record.set("enq_number", `SS-ENQ-${branch}-${fy}-${seq}`);
    e.record.set("seq", seq);
  } catch (err) {
    $app.logger().error("[SureShift] Enquiry numbering failed: " + String(err));
  }

  return e.next();
}, "enquiries");

// ── 3. Auto-generate Survey number ───────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("survey_number") !== "") return e.next();

  try {
    const enq    = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    const branch = enq.getString("branch");
    const fy     = enq.getString("fy");
    const seq    = enq.getString("seq");
    e.record.set("survey_number", `SS-SRV-${branch}-${fy}-${seq}`);
  } catch (err) {
    $app.logger().error("[SureShift] Survey numbering failed: " + String(err));
  }

  return e.next();
}, "surveys");

// ── 4. Auto-generate Quotation number ────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("quot_number") !== "") return e.next();

  try {
    const enq    = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    const branch = enq.getString("branch");
    const fy     = enq.getString("fy");
    const seq    = enq.getString("seq");
    const rev    = e.record.getInt("revisions") || 0;
    const suffix = rev > 0 ? `/${rev}` : "";
    const baseId = `SS-QUOT-${branch}-${fy}-${seq}`;
    e.record.set("quot_number", baseId + suffix);
    e.record.set("base_id",    baseId);
  } catch (err) {
    $app.logger().error("[SureShift] Quotation numbering failed: " + String(err));
  }

  return e.next();
}, "quotations");

// ── 5. Auto-generate CFR number ──────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("cfr_number") !== "") return e.next();

  try {
    const enq = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    e.record.set("cfr_number",
      `SS-CFR-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (err) {
    $app.logger().error("[SureShift] CFR numbering failed: " + String(err));
  }

  return e.next();
}, "cfr");

// ── 6. Auto-generate Invoice number ──────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("inv_number") !== "") return e.next();

  try {
    const cfr = $app.findRecordById("cfr", e.record.getString("cfr_id"));
    const enq = $app.findRecordById("enquiries", cfr.getString("enquiry_id"));
    e.record.set("inv_number",
      `SS-INV-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (err) {
    $app.logger().error("[SureShift] Invoice numbering failed: " + String(err));
  }

  return e.next();
}, "invoices");

// ── 7. Auto-generate Support ticket number ───────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("ticket_no") !== "") return e.next();

  try {
    const all = $app.findRecordsByFilter("tickets", "id != ''", "-created", 0, 0);
    const seq = String(all.length + 1).padStart(4, "0");
    e.record.set("ticket_no", `SS-TKT-${seq}`);
  } catch (err) {
    $app.logger().error("[SureShift] Ticket numbering failed: " + String(err));
  }

  return e.next();
}, "tickets");

// ── 8. Health + ping route ───────────────────────────────────────────────────
routerAdd("GET", "/api/erp/ping", (e) => {
  return e.json(200, {
    status:  "ok",
    service: "SureShift ERP",
    version: "2.0.0",
    time:    new Date().toISOString(),
  });
});
