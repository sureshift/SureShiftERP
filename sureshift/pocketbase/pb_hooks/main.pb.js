/// <reference path="../pb_data/types.d.ts" />

// ── Auto-number Enquiries ─────────────────────────────────────────────────────
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

// ── Auto-number Surveys ───────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("survey_number") !== "") return e.next();
  try {
    var enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("survey_number","SS-SRV-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "surveys");

// ── Auto-number Quotations ────────────────────────────────────────────────────
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

// ── Auto-number CFR ───────────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("cfr_number") !== "") return e.next();
  try {
    var enq = $app.findRecordById("enquiries",e.record.getString("enquiry_id"));
    e.record.set("cfr_number","SS-CFR-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "cfr");

// ── Auto-number Invoices ──────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("inv_number") !== "") return e.next();
  try {
    var cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    var enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("inv_number","SS-INV-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "invoices");

// ── Auto-number Operations ────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("ops_number") !== "") return e.next();
  try {
    var cfr = $app.findRecordById("cfr",e.record.getString("cfr_id"));
    var enq = $app.findRecordById("enquiries",cfr.getString("enquiry_id"));
    e.record.set("ops_number","SS-OPS-" + enq.getString("branch") + "-" + enq.getString("fy") + "-" + enq.getString("seq"));
  } catch(_) {}
  return e.next();
}, "operations");

// ── Auto-number Tickets ───────────────────────────────────────────────────────
onRecordCreate(function(e) {
  if (e.record.getString("ticket_no") !== "") return e.next();
  try {
    var all = $app.findRecordsByFilter("tickets","id != ''","-created",0,0);
    var seq = String(all.length + 1); while (seq.length < 4) seq = "0" + seq;
    e.record.set("ticket_no","SS-TKT-" + seq);
  } catch(_) {}
  return e.next();
}, "tickets");

// ── Health check ──────────────────────────────────────────────────────────────
routerAdd("GET","/api/erp/ping",function(e) {
  return e.json(200,{status:"ok",service:"SureShift ERP",version:"2.0.0"});
});
