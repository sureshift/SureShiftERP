/// <reference path="../pb_data/types.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
//  SureShift ERP — PocketBase Hooks  (v0.36 API)
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Boot: configure SMTP + seed admin ─────────────────────────────────────
onBootstrap((e) => {
  e.next();

  // ── Configure SMTP via env vars ──────────────────────────────────────────
  const smtpHost = $os.getenv("SMTP_HOST");
  const smtpUser = $os.getenv("SMTP_USER");
  const smtpPass = $os.getenv("SMTP_PASS");
  const appUrl   = $os.getenv("PB_APP_URL") || "https://erp.sureshift.in";
  const fromName = $os.getenv("SMTP_FROM_NAME") || "SureShift ERP";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const settings = $app.settings();
      settings.smtp.enabled    = true;
      settings.smtp.host       = smtpHost;
      settings.smtp.port       = parseInt($os.getenv("SMTP_PORT") || "587");
      settings.smtp.username   = smtpUser;
      settings.smtp.password   = smtpPass;
      settings.smtp.authMethod = "LOGIN";
      settings.smtp.tls        = false;
      settings.meta.senderName    = fromName;
      settings.meta.senderAddress = smtpUser;
      settings.meta.appUrl        = appUrl;

      // Custom reset password email template — link points to our React app
      settings.emailTemplate.resetPassword.subject = "Reset your SureShift ERP password";
      settings.emailTemplate.resetPassword.body = `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">
  <div style="background:#DB2648;padding:28px 32px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.2);display:inline-flex;align-items:center;justify-content:center">
        <svg width="22" height="22" viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:1px">SURESHIFT ERP</span>
    </div>
  </div>
  <div style="padding:36px 32px">
    <h2 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 10px">Password Reset Request</h2>
    <p style="color:#64748B;font-size:14px;line-height:1.7;margin:0 0 28px">We received a request to reset your SureShift ERP password. Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
    <div style="text-align:center;margin:0 0 28px">
      <a href="{APP_URL}?view=reset&token={TOKEN}" style="display:inline-block;background:#DB2648;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.2px">Reset My Password →</a>
    </div>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;border:1px solid #E2E8F0">
      <p style="font-size:12.5px;color:#94A3B8;margin:0;line-height:1.6">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.<br><br>For security, this link works only once and expires in 30 minutes.</p>
    </div>
    <p style="font-size:12px;color:#CBD5E1;text-align:center;margin:24px 0 0">© 2026 Sure Shift Relocation Services Pvt. Ltd. · Delhi · Mumbai · Bengaluru</p>
  </div>
</div>`;

      settings.emailTemplate.verificationEmail.subject = "Verify your SureShift ERP email";
      $app.save(settings);
      $app.logger().info("[SureShift] SMTP configured: " + smtpHost);
    } catch (err) {
      $app.logger().error("[SureShift] SMTP config failed: " + String(err));
    }
  } else {
    $app.logger().warn("[SureShift] SMTP env vars not set — password reset emails disabled.");
  }

  // ── Seed super admin on first boot ──────────────────────────────────────
  let existing = [];
  try {
    existing = $app.findRecordsByFilter("users", "id != ''", "-created", 1, 0);
  } catch (_) { return; }
  if (existing.length > 0) return;

  const adminEmail = $os.getenv("PB_SUPER_ADMIN_EMAIL") || "admin@sureshift.in";
  const adminPass  = $os.getenv("PB_SUPER_ADMIN_PASS")  || "RaViGo1140";

  try {
    const col = $app.findCollectionByNameOrId("users");
    const rec = new Record(col);
    rec.setPassword(adminPass);
    rec.set("username",        "superadmin");
    rec.set("email",           adminEmail);
    rec.set("emailVisibility", true);
    rec.set("verified",        true);
    rec.set("name",            "Sure Shift Admin");
    rec.set("phone",           "9073291732");
    rec.set("role",            "super_admin");
    rec.set("branch",          "NDLH");
    rec.set("status",          "active");
    rec.set("permissions", {
      enquiries:["view","create","edit","delete","assign","stage_change"],
      surveys:["view","create","edit","assign","report"],
      quotations:["view","create","edit","send","approve","revise"],
      bookings:["view","create","edit","cancel","payment"],
      operations:["view","update","dispatch","checklist"],
      invoices:["view","create","edit","send","payment","cancel"],
      vendors:["view","create","edit","delete"],
      users:["view","create","edit","delete","assign_roles"],
      reports:["view","export"],
      settings:["view","edit"],
    });
    $app.save(rec);
    $app.logger().info("[SureShift] Super admin seeded: " + adminEmail);
  } catch (err) {
    $app.logger().error("[SureShift] Admin seed failed: " + String(err));
  }

  // ── Seed default app_settings ────────────────────────────────────────────
  try {
    const col = $app.findCollectionByNameOrId("app_settings");
    const defaults = [
      { key:"company", category:"company", value:{
        name:"Sure Shift Relocation Services Pvt. Ltd.",
        gst:"07AABCS1234A1Z1", address:"P Block, Plot 131, Gopal Nagar Extension, Najafgarh, New Delhi – 110043",
        phone:"9073291732", email:"info@sureshift.in", website:"https://sureshift.in" }},
      { key:"notifications", category:"notifications", value:{ whatsapp:true,email:true,sms:false,autoFollowUp:true }},
      { key:"billing", category:"billing", value:{ gstRate:18,tokenMin:1000 }},
    ];
    defaults.forEach(d => {
      const r = new Record(col);
      r.set("key", d.key); r.set("value", d.value); r.set("category", d.category);
      $app.save(r);
    });
    $app.logger().info("[SureShift] Default settings seeded.");
  } catch (_) {}
});

// ── 2. Auto-number Enquiries ─────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("enq_number") !== "") return e.next();
  const branch = e.record.getString("branch") || "NDLH";
  const fy     = e.record.getString("fy")     || "2627";
  try {
    const existing = $app.findRecordsByFilter("enquiries", `branch="${branch}" && fy="${fy}"`, "-created", 0, 0);
    const seq = String(existing.length + 1).padStart(4, "0");
    e.record.set("enq_number", `SS-ENQ-${branch}-${fy}-${seq}`);
    e.record.set("seq", seq);
  } catch (err) { $app.logger().error("[SureShift] Enquiry numbering: " + String(err)); }
  return e.next();
}, "enquiries");

// ── 3. Auto-number Surveys ───────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("survey_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    e.record.set("survey_number", `SS-SRV-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "surveys");

// ── 4. Auto-number Quotations ────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("quot_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    const rev = e.record.getInt("revisions") || 0;
    const base = `SS-QUOT-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`;
    e.record.set("quot_number", rev > 0 ? `${base}/${rev}` : base);
    e.record.set("base_id", base);
  } catch (_) {}
  return e.next();
}, "quotations");

// ── 5. Auto-number CFR ───────────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("cfr_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries", e.record.getString("enquiry_id"));
    e.record.set("cfr_number", `SS-CFR-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "cfr");

// ── 6. Auto-number Invoices ──────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("inv_number") !== "") return e.next();
  try {
    const cfr = $app.findRecordById("cfr", e.record.getString("cfr_id"));
    const enq = $app.findRecordById("enquiries", cfr.getString("enquiry_id"));
    e.record.set("inv_number", `SS-INV-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "invoices");

// ── 7. Auto-number Ops ───────────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("ops_number") !== "") return e.next();
  try {
    const cfr = $app.findRecordById("cfr", e.record.getString("cfr_id"));
    const enq = $app.findRecordById("enquiries", cfr.getString("enquiry_id"));
    e.record.set("ops_number", `SS-OPS-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "operations");

// ── 8. Auto-number Tickets ───────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("ticket_no") !== "") return e.next();
  try {
    const all = $app.findRecordsByFilter("tickets", "id != ''", "-created", 0, 0);
    e.record.set("ticket_no", `SS-TKT-${String(all.length + 1).padStart(4, "0")}`);
  } catch (_) {}
  return e.next();
}, "tickets");

// ── 9. Health check route ────────────────────────────────────────────────────
routerAdd("GET", "/api/erp/ping", (e) => {
  return e.json(200, { status:"ok", service:"SureShift ERP", version:"2.0.0", time:new Date().toISOString() });
});

// ── 10. Error alert emails → sureshiftrelocation@gmail.com ──────────────────
// Called by any hook that catches a critical error.
function sendErrorAlert(subject, body) {
  const alertTo = $os.getenv("SMTP_ALERT_TO");
  if (!alertTo) return;
  try {
    const message = new MailerMessage();
    message.setFrom({
      address: $os.getenv("SMTP_USER") || "sureshiftmail@gmail.com",
      name:    $os.getenv("SMTP_FROM_NAME") || "SureShift ERP",
    });
    message.addTo({ address: alertTo, name: "SureShift Alerts" });
    message.setSubject("⚠️ SureShift ERP Alert: " + subject);
    message.setHTML(`
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #FECACA;border-radius:10px;overflow:hidden">
        <div style="background:#DC2626;padding:18px 24px">
          <span style="font-size:16px;font-weight:700;color:#fff">⚠️ SureShift ERP — System Alert</span>
        </div>
        <div style="padding:24px">
          <h3 style="color:#DC2626;margin:0 0 12px">${subject}</h3>
          <pre style="background:#FFF5F5;padding:14px;border-radius:6px;font-size:12px;color:#374151;white-space:pre-wrap;word-break:break-all">${body}</pre>
          <p style="font-size:12px;color:#94A3B8;margin:16px 0 0">Time: ${new Date().toISOString()}<br>Server: erp.sureshift.in</p>
        </div>
      </div>
    `);
    $app.newMailClient().send(message);
  } catch (_) {
    // Silently fail — don't recurse on alert errors
  }
}

// ── 11. New partner request alert ────────────────────────────────────────────
onRecordCreate((e) => {
  e.next();
  const alertTo = $os.getenv("SMTP_ALERT_TO");
  if (!alertTo) return;
  try {
    const r = e.record;
    const message = new MailerMessage();
    message.setFrom({
      address: $os.getenv("SMTP_USER") || "sureshiftmail@gmail.com",
      name:    $os.getenv("SMTP_FROM_NAME") || "SureShift ERP",
    });
    message.addTo({ address: alertTo, name: "SureShift Team" });
    message.setSubject("🤝 New Partner Request: " + r.getString("name"));
    message.setHTML(`
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden">
        <div style="background:#DB2648;padding:18px 24px;display:flex;align-items:center;gap:10px">
          <span style="font-size:16px;font-weight:700;color:#fff">🤝 New Partner Request</span>
        </div>
        <div style="padding:24px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:8px 0;color:#64748B;width:40%">Name</td><td style="padding:8px 0;font-weight:600;color:#0F172A">${r.getString("name")}</td></tr>
            <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:8px 0;color:#64748B">Email</td><td style="padding:8px 0;font-weight:600;color:#0F172A">${r.getString("email")}</td></tr>
            <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:8px 0;color:#64748B">Phone</td><td style="padding:8px 0;font-weight:600;color:#0F172A">${r.getString("phone")}</td></tr>
            <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:8px 0;color:#64748B">Company</td><td style="padding:8px 0;font-weight:600;color:#0F172A">${r.getString("company")}</td></tr>
            <tr><td style="padding:8px 0;color:#64748B">Partner Type</td><td style="padding:8px 0;font-weight:600;color:#DB2648;text-transform:capitalize">${r.getString("partner_type")}</td></tr>
          </table>
          <div style="margin-top:20px;padding:12px;background:#FFF7ED;border:1px solid #FDE68A;border-radius:8px;font-size:12px;color:#92400E">
            Review and approve this request in the <strong>Sure Shift ERP Admin Panel</strong> → Users → Partner Requests.
          </div>
          <p style="font-size:11px;color:#CBD5E1;margin-top:16px">Submitted: ${new Date().toISOString()}</p>
        </div>
      </div>
    `);
    $app.newMailClient().send(message);
  } catch (_) {}
}, "partner_requests");
