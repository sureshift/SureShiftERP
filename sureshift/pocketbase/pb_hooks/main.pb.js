/// <reference path="../pb_data/types.d.ts" />

// ─────────────────────────────────────────────────────────────────────────────
//  SureShift ERP — PocketBase Hooks  (v0.36 API)
//  NOTE: SMTP is configured manually via pb.sureshift.in/_/ dashboard
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Seed super admin on first boot ────────────────────────────────────────
onBootstrap(function(e) {
  e.next();

  var existing = [];
  try { existing = $app.findRecordsByFilter("users","id != ''","-created",1,0); } catch(_) { return; }
  if (existing.length > 0) return;

  var adminEmail = $os.getenv("PB_SUPER_ADMIN_EMAIL") || "admin@sureshift.in";
  var adminPass  = $os.getenv("PB_SUPER_ADMIN_PASS")  || "RaViGo1140";
  try {
    var col = $app.findCollectionByNameOrId("users");
    var rec = new Record(col);
    rec.setPassword(adminPass);
    rec.set("username","superadmin");
    rec.set("email",adminEmail);
    rec.set("emailVisibility",true);
    rec.set("verified",true);
    rec.set("name","Sure Shift Admin");
    rec.set("phone","9073291732");
    rec.set("role","super_admin");
    rec.set("branch","NDLH");
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
      reports:["view","export"],
      settings:["view","edit"]
    });
    $app.save(rec);
  } catch(_) {}

  try {
    var sColl = $app.findCollectionByNameOrId("app_settings");
    var defaults = [
      { key:"company", category:"company", value:{ name:"Sure Shift Relocation Services Pvt. Ltd.", gst:"07AABCS1234A1Z1", address:"P Block, Plot 131, Gopal Nagar Extension, Najafgarh, New Delhi 110043", phone:"9073291732", email:"info@sureshift.in", website:"https://sureshift.in" }},
      { key:"notifications", category:"notifications", value:{ whatsapp:true, email:true, sms:false }},
      { key:"billing", category:"billing", value:{ gstRate:18, tokenMin:1000 }}
    ];
    for (var i = 0; i < defaults.length; i++) {
      var d = defaults[i];
      var r = new Record(sColl);
      r.set("key", d.key); r.set("value", d.value); r.set("category", d.category);
      $app.save(r);
    }
  } catch(_) {}
});

// ── 2. Intercept password reset — send branded email with correct URL ─────────
onMailerRecordPasswordResetSend(function(e) {
  var token    = e.meta["token"] || "";
  var userName = e.record.getString("name") || e.record.getString("email");
  var resetUrl = "https://erp.sureshift.in?view=reset&token=" + token;

  e.message.subject = "Reset your SureShift ERP password";

  var html = "";
  html += "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#F0F2F5;font-family:Arial,sans-serif'>";
  html += "<table width='100%' cellpadding='0' cellspacing='0' style='padding:40px 20px'><tr><td align='center'>";
  html += "<table width='520' cellpadding='0' cellspacing='0' style='background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)'>";
  html += "<tr><td style='background:#DB2648;padding:28px 36px'>";
  html += "<span style='font-size:20px;font-weight:800;color:#fff;letter-spacing:1px'>&#9658; SURESHIFT ERP</span>";
  html += "</td></tr>";
  html += "<tr><td style='padding:36px'>";
  html += "<h2 style='font-size:22px;font-weight:700;color:#0F172A;margin:0 0 16px'>Password Reset Request</h2>";
  html += "<p style='color:#64748B;font-size:14px;line-height:1.7;margin:0 0 8px'>Hi <strong style='color:#0F172A'>" + userName + "</strong>,</p>";
  html += "<p style='color:#64748B;font-size:14px;line-height:1.7;margin:0 0 28px'>Click the button below to reset your SureShift ERP password. This link expires in <strong>30 minutes</strong>.</p>";
  html += "<div style='text-align:center;margin:0 0 28px'>";
  html += "<a href='" + resetUrl + "' style='display:inline-block;background:#DB2648;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px'>Reset My Password</a>";
  html += "</div>";
  html += "<p style='font-size:12px;color:#94A3B8;margin:0 0 12px'>Or copy this link into your browser:</p>";
  html += "<p style='font-size:11px;color:#DB2648;word-break:break-all;margin:0'>" + resetUrl + "</p>";
  html += "<hr style='border:none;border-top:1px solid #E2E8F0;margin:24px 0'>";
  html += "<p style='font-size:12px;color:#94A3B8;margin:0'>If you did not request this, ignore this email.</p>";
  html += "</td></tr>";
  html += "<tr><td style='background:#F8FAFC;padding:16px 36px;border-top:1px solid #E2E8F0'>";
  html += "<p style='font-size:11px;color:#94A3B8;margin:0;text-align:center'>&#169; 2026 Sure Shift Relocation Services Pvt. Ltd.</p>";
  html += "</td></tr></table></td></tr></table></body></html>";

  e.message.html = html;
  return e.next();
}, "users");

// ── 3. Partner request alert ──────────────────────────────────────────────────
onRecordCreate(function(e) {
  e.next();
  var alertTo = $os.getenv("SMTP_ALERT_TO");
  if (!alertTo) return;
  try {
    var r = e.record;
    var msg = new MailerMessage();
    msg.from = { address: $os.getenv("SMTP_SENDER") || "noreply@sureshift.in", name: "SureShift ERP" };
    msg.to = [{ address: alertTo, name: "SureShift Team" }];
    msg.subject = "New Partner Request: " + r.getString("name");
    var body = "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto'>";
    body += "<div style='background:#DB2648;padding:20px;border-radius:12px 12px 0 0'>";
    body += "<span style='color:#fff;font-size:16px;font-weight:700'>New Partner Registration</span></div>";
    body += "<div style='padding:24px;border:1px solid #E2E8F0;border-radius:0 0 12px 12px'>";
    body += "<p><strong>Name:</strong> " + r.getString("name") + "</p>";
    body += "<p><strong>Email:</strong> " + r.getString("email") + "</p>";
    body += "<p><strong>Phone:</strong> " + r.getString("phone") + "</p>";
    body += "<p><strong>Company:</strong> " + r.getString("company") + "</p>";
    body += "<p><strong>Type:</strong> " + r.getString("partner_type") + "</p>";
    body += "</div></div>";
    msg.html = body;
    $app.newMailClient().send(msg);
  } catch(_) {}
}, "partner_requests");

// ── 4. Auto-number Enquiries ──────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("enq_number") !== "") return e.next();
  var branch = e.record.getString("branch") || "NDLH";
  var fy     = e.record.getString("fy")     || "2627";
  try {
    var list = $app.findRecordsByFilter("enquiries","branch='" + branch + "' && fy='" + fy + "'","-created",0,0);
    var seq  = String(list.length + 1); while (seq.length < 4) seq = "0" + seq;
    e.record.set("enq_number","SS-ENQ-" + branch + "-" + fy + "-" + seq);
    e.record.set("seq",seq);
  } catch(_) {}
  return e.next();
}, "enquiries");

// ── 5. Auto-number Surveys ────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("survey_number") !== "") return e.next();
  try {
    var enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("survey_number","SS-SRV-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "surveys");

// ── 6. Auto-number Quotations ─────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("quot_number") !== "") return e.next();
  try {
    var enq  = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    var rev  = e.record.getInt("revisions") || 0;
    var base = "SS-QUOT-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq");
    e.record.set("quot_number", rev > 0 ? base + "/" + rev : base);
    e.record.set("base_id",base);
  } catch(_) {}
  return e.next();
}, "quotations");

// ── 7. Auto-number CFR ────────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("cfr_number") !== "") return e.next();
  try {
    var enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("cfr_number","SS-CFR-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "cfr");

// ── 8. Auto-number Invoices ───────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("inv_number") !== "") return e.next();
  try {
    var cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    var enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("inv_number","SS-INV-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "invoices");

// ── 9. Auto-number Operations ─────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("ops_number") !== "") return e.next();
  try {
    var cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    var enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("ops_number","SS-OPS-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "operations");

// ── 10. Auto-number Tickets ───────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("ticket_no") !== "") return e.next();
  try {
    var all = $app.findRecordsByFilter("tickets","id != ''","-created",0,0);
    var seq = String(all.length + 1); while (seq.length < 4) seq = "0" + seq;
    e.record.set("ticket_no","SS-TKT-" + seq);
  } catch(_) {}
  return e.next();
}, "tickets");

// ── 11. Health check ──────────────────────────────────────────────────────────
routerAdd("GET","/api/erp/ping",function(e) {
  return e.json(200,{status:"ok",service:"SureShift ERP",version:"2.0.0"});
});
