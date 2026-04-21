/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {

  function saveCol(def) {
    try { app.findCollectionByNameOrId(def.name); return; } catch (_) {}
    app.save(new Collection(def));
  }

  // ── 1. USERS (auth) ───────────────────────────────────────────────────
  saveCol({
    name: "users", type: "auth",
    fields: [
      { name:"name",        type:"text",   required:true  },
      { name:"phone",       type:"text"                   },
      { name:"role",        type:"select", required:true,  maxSelect:1,
        values:["super_admin","branch_head","sales_exec","ops_exec","finance_exec","surveyor","vehicle_vendor","manpower_vendor"] },
      { name:"branch",      type:"select", required:true,  maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"status",      type:"select", required:true,  maxSelect:1,
        values:["active","inactive","suspended"] },
      { name:"permissions", type:"json"                    },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.role = 'super_admin'",
    updateRule: "@request.auth.id != '' && (@request.auth.role = 'super_admin' || @request.auth.id = id)",
    deleteRule: "@request.auth.role = 'super_admin' && @request.auth.id != id",
  });

  // ── 2. VENDORS ────────────────────────────────────────────────────────
  saveCol({
    name: "vendors", type: "base",
    fields: [
      { name:"name",           type:"text",   required:true },
      { name:"type",           type:"select", required:true, maxSelect:1,
        values:["vehicle_vendor","manpower_vendor"] },
      { name:"contact",        type:"text",   required:true },
      { name:"phone",          type:"text" },
      { name:"email",          type:"email" },
      { name:"gst",            type:"text" },
      { name:"branch",         type:"select", required:true, maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"status",         type:"select", required:true, maxSelect:1,
        values:["active","inactive"] },
      { name:"rating",         type:"number" },
      { name:"vehicles",       type:"json" },
      { name:"workers",        type:"json" },
      { name:"total_jobs",     type:"number" },
      { name:"pending_payout", type:"number" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 3. ENQUIRIES ──────────────────────────────────────────────────────
  saveCol({
    name: "enquiries", type: "base",
    fields: [
      { name:"enq_number",   type:"text",   required:true },
      { name:"branch",       type:"select", required:true, maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"fy",           type:"text",   required:true },
      { name:"seq",          type:"text",   required:true },
      { name:"name",         type:"text",   required:true },
      { name:"phone",        type:"text",   required:true },
      { name:"alt_phone",    type:"text" },
      { name:"email",        type:"email" },
      { name:"from_address", type:"text",   required:true },
      { name:"to_address",   type:"text",   required:true },
      { name:"move_type",    type:"select", required:true, maxSelect:1,
        values:["household","office","international","vehicle","bike","storage","commercial","courier"] },
      { name:"source",       type:"select", required:true, maxSelect:1,
        values:["website","gmb","phone","whatsapp","reference"] },
      { name:"stage",        type:"select", required:true, maxSelect:1,
        values:["new","survey","quotation","recalling","cfr","lost"] },
      { name:"apt_size",     type:"text" },
      { name:"move_date",    type:"text" },
      { name:"notes",        type:"text" },
      { name:"timeline",     type:"json" },
      { name:"comms",        type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin' || @request.auth.role = 'branch_head'",
  });

  // ── 4. SURVEYS ────────────────────────────────────────────────────────
  saveCol({
    name: "surveys", type: "base",
    fields: [
      { name:"survey_number", type:"text",   required:true },
      { name:"enquiry_id",    type:"text",   required:true },
      { name:"status",        type:"select", required:true, maxSelect:1,
        values:["pending","assigned","scheduled","in-progress","completed","report-filed"] },
      { name:"agent_name",    type:"text" },
      { name:"survey_date",   type:"text" },
      { name:"survey_time",   type:"text" },
      { name:"floor",         type:"number" },
      { name:"has_lift",      type:"bool" },
      { name:"distance",      type:"text" },
      { name:"condition",     type:"text" },
      { name:"agent_notes",   type:"text" },
      { name:"inventory",     type:"json" },
      { name:"total_vol",     type:"number" },
      { name:"total_wt",      type:"number" },
      { name:"total_items",   type:"number" },
      { name:"rec_vehicle",   type:"json" },
      { name:"rec_manpower",  type:"json" },
      { name:"rec_pack_mat",  type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 5. QUOTATIONS ─────────────────────────────────────────────────────
  saveCol({
    name: "quotations", type: "base",
    fields: [
      { name:"quot_number",  type:"text",   required:true },
      { name:"base_id",      type:"text",   required:true },
      { name:"revisions",    type:"number" },
      { name:"enquiry_id",   type:"text",   required:true },
      { name:"status",       type:"select", required:true, maxSelect:1,
        values:["draft","sent","viewed","negotiating","approved","recalling","converted","lost"] },
      { name:"line_items",   type:"json" },
      { name:"subtotal",     type:"number" },
      { name:"discount_pct", type:"number" },
      { name:"tax_amt",      type:"number" },
      { name:"grand_total",  type:"number" },
      { name:"valid_days",   type:"number" },
      { name:"move_date",    type:"text" },
      { name:"read_receipt", type:"bool" },
      { name:"notes",        type:"text" },
      { name:"neg_log",      type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 6. CFR (Bookings) ─────────────────────────────────────────────────
  saveCol({
    name: "cfr", type: "base",
    fields: [
      { name:"cfr_number",         type:"text",   required:true },
      { name:"quotation_id",       type:"text",   required:true },
      { name:"enquiry_id",         type:"text",   required:true },
      { name:"status",             type:"select", required:true, maxSelect:1,
        values:["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"] },
      { name:"grand_total",        type:"number", required:true },
      { name:"token_amt",          type:"number" },
      { name:"total_paid",         type:"number" },
      { name:"is_interstate",      type:"bool" },
      { name:"move_date",          type:"text" },
      { name:"vehicle",            type:"text" },
      { name:"vehicle_no",         type:"text" },
      { name:"vehicle_vendor_id",  type:"text" },
      { name:"manpower_vendor_id", type:"text" },
      { name:"manpower_req",       type:"json" },
      { name:"pack_mat",           type:"json" },
      { name:"payments",           type:"json" },
      { name:"timeline",           type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 7. OPERATIONS ─────────────────────────────────────────────────────
  saveCol({
    name: "operations", type: "base",
    fields: [
      { name:"ops_number",        type:"text",   required:true },
      { name:"cfr_id",            type:"text",   required:true },
      { name:"stage",             type:"select", required:true, maxSelect:1,
        values:["dispatch-mat","packing","loading","in-transit","unloading","delivered"] },
      { name:"bilty_no",          type:"text" },
      { name:"invoice_no",        type:"text" },
      { name:"checklist_done",    type:"json" },
      { name:"pack_mat_returned", type:"json" },
      { name:"timeline",          type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 8. INVOICES ───────────────────────────────────────────────────────
  saveCol({
    name: "invoices", type: "base",
    fields: [
      { name:"inv_number",      type:"text",   required:true },
      { name:"cfr_id",          type:"text",   required:true },
      { name:"status",          type:"select", required:true, maxSelect:1,
        values:["draft","sent","partial","paid","overdue","cancelled"] },
      { name:"line_items",      type:"json" },
      { name:"subtotal",        type:"number" },
      { name:"tax_amt",         type:"number" },
      { name:"grand_total",     type:"number", required:true },
      { name:"paid_amt",        type:"number" },
      { name:"outstanding",     type:"number" },
      { name:"invoice_date",    type:"text" },
      { name:"due_date",        type:"text" },
      { name:"payment_history", type:"json" },
      { name:"gst_no",          type:"text" },
      { name:"hsn_code",        type:"text" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 9. TICKETS ────────────────────────────────────────────────────────
  saveCol({
    name: "tickets", type: "base",
    fields: [
      { name:"ticket_no",  type:"text",   required:true },
      { name:"subject",    type:"text",   required:true },
      { name:"category",   type:"select", required:true, maxSelect:1,
        values:["technical","billing","operations","user-access","feature-request","other"] },
      { name:"priority",   type:"select", required:true, maxSelect:1,
        values:["low","medium","high","critical"] },
      { name:"status",     type:"select", required:true, maxSelect:1,
        values:["open","in-progress","resolved","closed"] },
      { name:"message",    type:"text",   required:true },
      { name:"created_by", type:"text",   required:true },
      { name:"replies",    type:"json" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''",
    updateRule:"@request.auth.role = 'super_admin'",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 10. APP SETTINGS ──────────────────────────────────────────────────
  saveCol({
    name: "app_settings", type: "base",
    fields: [
      { name:"key",      type:"text", required:true },
      { name:"value",    type:"json", required:true },
      { name:"category", type:"text" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.role = 'super_admin'",
    updateRule:"@request.auth.role = 'super_admin'",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 11. COMMS LOG ─────────────────────────────────────────────────────
  saveCol({
    name: "comms_log", type: "base",
    fields: [
      { name:"entity_type", type:"select", required:true, maxSelect:1,
        values:["enquiry","quotation","cfr","operation"] },
      { name:"entity_id",   type:"text",   required:true },
      { name:"channel",     type:"select", required:true, maxSelect:1,
        values:["whatsapp","email","sms","call"] },
      { name:"direction",   type:"select", required:true, maxSelect:1,
        values:["sent","received","auto"] },
      { name:"message",     type:"text",   required:true },
      { name:"read_receipt",type:"bool" },
      { name:"sent_by",     type:"text" },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

}, (app) => {
  ["users","vendors","enquiries","surveys","quotations","cfr",
   "operations","invoices","tickets","app_settings","comms_log"]
    .forEach(n => {
      try { app.delete(app.findCollectionByNameOrId(n)); } catch(_) {}
    });
});
