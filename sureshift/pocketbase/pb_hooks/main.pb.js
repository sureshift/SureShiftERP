/// <reference path="../pb_data/types.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
//  SureShift ERP — PocketBase Hooks  (v0.36 API)
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Boot: configure SMTP + App settings + seed admin ──────────────────────
onBootstrap((e) => {
  e.next();

  const smtpHost = $os.getenv("SMTP_HOST");
  const smtpUser = $os.getenv("SMTP_USER");
  const smtpPass = $os.getenv("SMTP_PASS");
  const appUrl   = $os.getenv("PB_APP_URL") || "https://erp.sureshift.in";
  const fromName = $os.getenv("SMTP_FROM_NAME") || "SureShift ERP";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const settings = $app.settings();

      // ── App identity ──────────────────────────────────────────────────────
      settings.meta.appName       = "SureShift ERP";
      settings.meta.appUrl        = appUrl;
      settings.meta.senderName    = fromName;
      settings.meta.senderAddress = smtpUser;

      // ── SMTP ──────────────────────────────────────────────────────────────
      settings.smtp.enabled    = true;
      settings.smtp.host       = smtpHost;
      settings.smtp.port       = parseInt($os.getenv("SMTP_PORT") || "587");
      settings.smtp.username   = smtpUser;
      settings.smtp.password   = smtpPass;
      settings.smtp.authMethod = "LOGIN";
      settings.smtp.tls        = false;

      $app.save(settings);
      $app.logger().info("[SureShift] SMTP + App settings configured.");
    } catch (err) {
      $app.logger().error("[SureShift] Settings config failed: " + String(err));
    }
  } else {
    $app.logger().warn("[SureShift] SMTP env vars missing.");
  }

  // ── Seed super admin on first boot ────────────────────────────────────────
  let existing = [];
  try { existing = $app.findRecordsByFilter("users","id != ''","-created",1,0); } catch (_) { return; }
  if (existing.length > 0) return;

  const adminEmail = $os.getenv("PB_SUPER_ADMIN_EMAIL") || "admin@sureshift.in";
  const adminPass  = $os.getenv("PB_SUPER_ADMIN_PASS")  || "RaViGo1140";
  try {
    const col = $app.findCollectionByNameOrId("users");
    const rec = new Record(col);
    rec.setPassword(adminPass);
    rec.set("username","superadmin"); rec.set("email",adminEmail);
    rec.set("emailVisibility",true);  rec.set("verified",true);
    rec.set("name","Sure Shift Admin"); rec.set("phone","9073291732");
    rec.set("role","super_admin");    rec.set("branch","NDLH");
    rec.set("status","active");
    rec.set("permissions",{
      enquiries:["view","create","edit","delete","assign","stage_change"],
      surveys:["view","create","edit","assign","report"],
      quotations:["view","create","edit","send","approve","revise"],
      bookings:["view","create","edit","cancel","payment"],
      operations:["view","update","dispatch","checklist"],
      invoices:["view","create","edit","send","payment","cancel"],
      vendors:["view","create","edit","delete"],
      users:["view","create","edit","delete","assign_roles"],
      reports:["view","export"], settings:["view","edit"],
    });
    $app.save(rec);
    $app.logger().info("[SureShift] Super admin seeded: " + adminEmail);
  } catch (err) {
    $app.logger().error("[SureShift] Admin seed failed: " + String(err));
  }

  // ── Seed default app_settings ─────────────────────────────────────────────
  try {
    const col = $app.findCollectionByNameOrId("app_settings");
    const defaults = [
      { key:"company", category:"company", value:{ name:"Sure Shift Relocation Services Pvt. Ltd.", gst:"07AABCS1234A1Z1", address:"P Block, Plot 131, Gopal Nagar Extension, Najafgarh, New Delhi – 110043", phone:"9073291732", email:"info@sureshift.in", website:"https://sureshift.in" }},
      { key:"notifications", category:"notifications", value:{ whatsapp:true,email:true,sms:false,autoFollowUp:true }},
      { key:"billing", category:"billing", value:{ gstRate:18,tokenMin:1000 }},
    ];
    defaults.forEach(d => {
      const r = new Record(col);
      r.set("key",d.key); r.set("value",d.value); r.set("category",d.category);
      $app.save(r);
    });
  } catch (_) {}
});

// ── 2. Intercept password reset email — send branded custom email ─────────────
onMailerRecordPasswordResetSend((e) => {
  const token   = e.meta["token"] || "";
  const appUrl  = "https://erp.sureshift.in";
  const resetUrl = `${appUrl}?view=reset&token=${token}`;
  const userName = e.record.getString("name") || e.record.getString("email");

  e.message.setSubject("Reset your SureShift ERP password");
  e.message.setHTML(`
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <!-- Header -->
      <tr><td style="background:#DB2648;padding:28px 36px">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;text-align:center;vertical-align:middle;padding:8px">
              <svg width="24" height="24" viewBox="0 0 60 60" fill="none"><path d="M12 8L48 30L12 52" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </td>
            <td style="padding-left:12px">
              <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:1px">SURESHIFT ERP</div>
              <div style="font-size:10px;color:rgba(255,255,255,.6);letter-spacing:2px;text-transform:uppercase">Relocation Management Platform</div>
            </td>
          </tr>
        </table>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px">
        <h2 style="font-size:22px;font-weight:700;color:#0F172A;margin:0 0 12px">Password Reset Request</h2>
        <p style="color:#64748B;font-size:14px;line-height:1.7;margin:0 0 10px">Hi <strong style="color:#0F172A">${userName}</strong>,</p>
        <p style="color:#64748B;font-size:14px;line-height:1.7;margin:0 0 28px">We received a request to reset your SureShift ERP password. Click the button below to set a new password. This link will expire in <strong style="color:#0F172A">30 minutes</strong>.</p>
        <div style="text-align:center;margin:0 0 28px">
          <a href="${resetUrl}" style="display:inline-block;background:#DB2648;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:.2px">Reset My Password →</a>
        </div>
        <div style="background:#F8FAFC;border-radius:10px;padding:16px 20px;border:1px solid #E2E8F0;margin-bottom:20px">
          <p style="font-size:12.5px;color:#64748B;margin:0;line-height:1.7">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size:12px;color:#DB2648;margin:6px 0 0;word-break:break-all">${resetUrl}</p>
        </div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px">
          <p style="font-size:12px;color:#92400E;margin:0;line-height:1.6">⚠️ If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F8FAFC;padding:20px 36px;border-top:1px solid #E2E8F0">
        <p style="font-size:11.5px;color:#94A3B8;margin:0;text-align:center">© 2026 Sure Shift Relocation Services Pvt. Ltd. · Delhi · Mumbai · Bengaluru</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`);

  return e.next();
}, "users");

// ── 3. New partner request → alert email ──────────────────────────────────────
onRecordCreate((e) => {
  e.next();
  const alertTo = $os.getenv("SMTP_ALERT_TO");
  if (!alertTo) return;
  try {
    const r = e.record;
    const message = new MailerMessage();
    message.setFrom({ address:$os.getenv("SMTP_USER")||"sureshiftmail@gmail.com", name:"SureShift ERP" });
    message.addTo({ address:alertTo, name:"SureShift Team" });
    message.setSubject("🤝 New Partner Request: " + r.getString("name"));
    message.setHTML(`
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">
  <div style="background:#DB2648;padding:20px 24px"><span style="font-size:16px;font-weight:700;color:#fff">🤝 New Partner Registration</span></div>
  <div style="padding:24px">
    <table style="width:100%;border-collapse:collapse;font-size:13.5px">
      <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:9px 0;color:#64748B;width:38%">Name</td><td style="padding:9px 0;font-weight:700;color:#0F172A">${r.getString("name")}</td></tr>
      <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:9px 0;color:#64748B">Email</td><td style="padding:9px 0;font-weight:600;color:#0F172A">${r.getString("email")}</td></tr>
      <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:9px 0;color:#64748B">Phone</td><td style="padding:9px 0;font-weight:600;color:#0F172A">${r.getString("phone")}</td></tr>
      <tr style="border-bottom:1px solid #F1F5F9"><td style="padding:9px 0;color:#64748B">Company</td><td style="padding:9px 0;font-weight:600;color:#0F172A">${r.getString("company")}</td></tr>
      <tr><td style="padding:9px 0;color:#64748B">Partner Type</td><td style="padding:9px 0;font-weight:700;color:#DB2648;text-transform:capitalize">${r.getString("partner_type")}</td></tr>
    </table>
    <div style="margin-top:20px;padding:12px 16px;background:#FFF7ED;border:1px solid #FDE68A;border-radius:8px;font-size:12.5px;color:#92400E">
      Review and approve in <strong>Sure Shift ERP → Users → Partner Requests</strong>.
    </div>
    <p style="font-size:11px;color:#CBD5E1;margin:16px 0 0">Submitted: ${new Date().toISOString()}</p>
  </div>
</div>`);
    $app.newMailClient().send(message);
  } catch (_) {}
}, "partner_requests");

// ── 4. Auto-number Enquiries ──────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("enq_number") !== "") return e.next();
  const branch = e.record.getString("branch") || "NDLH";
  const fy     = e.record.getString("fy")     || "2627";
  try {
    const existing = $app.findRecordsByFilter("enquiries",`branch="${branch}" && fy="${fy}"`,"-created",0,0);
    const seq = String(existing.length + 1).padStart(4,"0");
    e.record.set("enq_number",`SS-ENQ-${branch}-${fy}-${seq}`);
    e.record.set("seq",seq);
  } catch (_) {}
  return e.next();
}, "enquiries");

// ── 5. Auto-number Surveys ────────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("survey_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("survey_number",`SS-SRV-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "surveys");

// ── 6. Auto-number Quotations ─────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("quot_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    const rev = e.record.getInt("revisions") || 0;
    const base = `SS-QUOT-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`;
    e.record.set("quot_number", rev > 0 ? `${base}/${rev}` : base);
    e.record.set("base_id",base);
  } catch (_) {}
  return e.next();
}, "quotations");

// ── 7. Auto-number CFR ────────────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("cfr_number") !== "") return e.next();
  try {
    const enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("cfr_number",`SS-CFR-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "cfr");

// ── 8. Auto-number Invoices ───────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("inv_number") !== "") return e.next();
  try {
    const cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    const enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("inv_number",`SS-INV-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "invoices");

// ── 9. Auto-number Operations ─────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("ops_number") !== "") return e.next();
  try {
    const cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    const enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("ops_number",`SS-OPS-${enq.getString("branch")}-${enq.getString("fy")}-${enq.getString("seq")}`);
  } catch (_) {}
  return e.next();
}, "operations");

// ── 10. Auto-number Tickets ───────────────────────────────────────────────────
onRecordCreate((e) => {
  if (e.record.getString("ticket_no") !== "") return e.next();
  try {
    const all = $app.findRecordsByFilter("tickets","id != ''","-created",0,0);
    e.record.set("ticket_no",`SS-TKT-${String(all.length+1).padStart(4,"0")}`);
  } catch (_) {}
  return e.next();
}, "tickets");

// ── 11. Health check ──────────────────────────────────────────────────────────
routerAdd("GET","/api/erp/ping",(e) => {
  return e.json(200,{status:"ok",service:"SureShift ERP",version:"2.0.0",time:new Date().toISOString()});
});
