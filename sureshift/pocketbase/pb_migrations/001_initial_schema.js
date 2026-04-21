/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {

  function saveCol(def) {
    try {
      app.findCollectionByNameOrId(def.name);
      return; // already exists, skip
    } catch (_) {}
    const col = new Collection(def);
    app.save(col);
  }

  // ── 1. USERS (auth) ───────────────────────────────────────────────────
  saveCol({
    name:"users", type:"auth",
    fields:[
      { name:"name",        type:"text",   required:true  },
      { name:"phone",       type:"text",   required:false },
      { name:"role",        type:"select", required:true,  maxSelect:1,
        values:["super_admin","branch_head","sales_exec","ops_exec","finance_exec","surveyor","vehicle_vendor","manpower_vendor"] },
      { name:"branch",      type:"select", required:true,  maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"status",      type:"select", required:true,  maxSelect:1,
        values:["active","inactive","suspended"] },
      { name:"permissions", type:"json",   required:false },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "@request.auth.id != '' && @request.auth.role = 'super_admin'",
    updateRule: "@request.auth.id != '' && (@request.auth.role = 'super_admin' || @request.auth.id = id)",
    deleteRule: "@request.auth.role = 'super_admin' && @request.auth.id != id",
  });

  // ── 2. VENDORS ────────────────────────────────────────────────────────
  saveCol({
    name:"vendors", type:"base",
    fields:[
      { name:"name",           type:"text",   required:true  },
      { name:"type",           type:"select", required:true,  maxSelect:1,
        values:["vehicle_vendor","manpower_vendor"] },
      { name:"contact",        type:"text",   required:true  },
      { name:"phone",          type:"text",   required:false },
      { name:"email",          type:"email",  required:false },
      { name:"gst",            type:"text",   required:false },
      { name:"branch",         type:"select", required:true,  maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"status",         type:"select", required:true,  maxSelect:1,
        values:["active","inactive"] },
      { name:"rating",         type:"number", required:false },
      { name:"vehicles",       type:"json",   required:false },
      { name:"workers",        type:"json",   required:false },
      { name:"total_jobs",     type:"number", required:false },
      { name:"pending_payout", type:"number", required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 3. ENQUIRIES ──────────────────────────────────────────────────────
  saveCol({
    name:"enquiries", type:"base",
    fields:[
      { name:"enq_number",   type:"text",   required:true  },
      { name:"branch",       type:"select", required:true,  maxSelect:1,
        values:["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"] },
      { name:"fy",           type:"text",   required:true  },
      { name:"seq",          type:"text",   required:true  },
      { name:"name",         type:"text",   required:true  },
      { name:"phone",        type:"text",   required:true  },
      { name:"alt_phone",    type:"text",   required:false },
      { name:"email",        type:"email",  required:false },
      { name:"from_address", type:"text",   required:true  },
      { name:"to_address",   type:"text",   required:true  },
      { name:"move_type",    type:"select", required:true,  maxSelect:1,
        values:["household","office","international","vehicle","bike","storage","commercial","courier"] },
      { name:"source",       type:"select", required:true,  maxSelect:1,
        values:["website","gmb","phone","whatsapp","reference"] },
      { name:"stage",        type:"select", required:true,  maxSelect:1,
        values:["new","survey","quotation","recalling","cfr","lost"] },
      { name:"apt_size",     type:"text",   required:false },
      { name:"move_date",    type:"text",   required:false },
      { name:"notes",        type:"text",   required:false },
      { name:"timeline",     type:"json",   required:false },
      { name:"comms",        type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin' || @request.auth.role = 'branch_head'",
  });

  // ── 4. SURVEYS ────────────────────────────────────────────────────────
  saveCol({
    name:"surveys", type:"base",
    fields:[
      { name:"survey_number", type:"text",   required:true  },
      { name:"enquiry_id",    type:"text",   required:true  },
      { name:"status",        type:"select", required:true,  maxSelect:1,
        values:["pending","assigned","scheduled","in-progress","completed","report-filed"] },
      { name:"agent_name",    type:"text",   required:false },
      { name:"survey_date",   type:"text",   required:false },
      { name:"survey_time",   type:"text",   required:false },
      { name:"floor",         type:"number", required:false },
      { name:"has_lift",      type:"bool",   required:false },
      { name:"distance",      type:"text",   required:false },
      { name:"condition",     type:"text",   required:false },
      { name:"agent_notes",   type:"text",   required:false },
      { name:"inventory",     type:"json",   required:false },
      { name:"total_vol",     type:"number", required:false },
      { name:"total_wt",      type:"number", required:false },
      { name:"total_items",   type:"number", required:false },
      { name:"rec_vehicle",   type:"json",   required:false },
      { name:"rec_manpower",  type:"json",   required:false },
      { name:"rec_pack_mat",  type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 5. QUOTATIONS ─────────────────────────────────────────────────────
  saveCol({
    name:"quotations", type:"base",
    fields:[
      { name:"quot_number",  type:"text",   required:true  },
      { name:"base_id",      type:"text",   required:true  },
      { name:"revisions",    type:"number", required:false },
      { name:"enquiry_id",   type:"text",   required:true  },
      { name:"status",       type:"select", required:true,  maxSelect:1,
        values:["draft","sent","viewed","negotiating","approved","recalling","converted","lost"] },
      { name:"line_items",   type:"json",   required:false },
      { name:"subtotal",     type:"number", required:false },
      { name:"discount_pct", type:"number", required:false },
      { name:"tax_amt",      type:"number", required:false },
      { name:"grand_total",  type:"number", required:false },
      { name:"valid_days",   type:"number", required:false },
      { name:"move_date",    type:"text",   required:false },
      { name:"read_receipt", type:"bool",   required:false },
      { name:"notes",        type:"text",   required:false },
      { name:"neg_log",      type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 6. CFR (Bookings) ─────────────────────────────────────────────────
  saveCol({
    name:"cfr", type:"base",
    fields:[
      { name:"cfr_number",         type:"text",   required:true  },
      { name:"quotation_id",       type:"text",   required:true  },
      { name:"enquiry_id",         type:"text",   required:true  },
      { name:"status",             type:"select", required:true,  maxSelect:1,
        values:["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"] },
      { name:"grand_total",        type:"number", required:true  },
      { name:"token_amt",          type:"number", required:false },
      { name:"total_paid",         type:"number", required:false },
      { name:"is_interstate",      type:"bool",   required:false },
      { name:"move_date",          type:"text",   required:false },
      { name:"vehicle",            type:"text",   required:false },
      { name:"vehicle_no",         type:"text",   required:false },
      { name:"vehicle_vendor_id",  type:"text",   required:false },
      { name:"manpower_vendor_id", type:"text",   required:false },
      { name:"manpower_req",       type:"json",   required:false },
      { name:"pack_mat",           type:"json",   required:false },
      { name:"payments",           type:"json",   required:false },
      { name:"timeline",           type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 7. OPERATIONS ─────────────────────────────────────────────────────
  saveCol({
    name:"operations", type:"base",
    fields:[
      { name:"ops_number",         type:"text",   required:true  },
      { name:"cfr_id",             type:"text",   required:true  },
      { name:"stage",              type:"select", required:true,  maxSelect:1,
        values:["dispatch-mat","packing","loading","in-transit","unloading","delivered"] },
      { name:"bilty_no",           type:"text",   required:false },
      { name:"invoice_no",         type:"text",   required:false },
      { name:"checklist_done",     type:"json",   required:false },
      { name:"pack_mat_returned",  type:"json",   required:false },
      { name:"timeline",           type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 8. INVOICES ───────────────────────────────────────────────────────
  saveCol({
    name:"invoices", type:"base",
    fields:[
      { name:"inv_number",      type:"text",   required:true  },
      { name:"cfr_id",          type:"text",   required:true  },
      { name:"status",          type:"select", required:true,  maxSelect:1,
        values:["draft","sent","partial","paid","overdue","cancelled"] },
      { name:"line_items",      type:"json",   required:false },
      { name:"subtotal",        type:"number", required:false },
      { name:"tax_amt",         type:"number", required:false },
      { name:"grand_total",     type:"number", required:true  },
      { name:"paid_amt",        type:"number", required:false },
      { name:"outstanding",     type:"number", required:false },
      { name:"invoice_date",    type:"text",   required:false },
      { name:"due_date",        type:"text",   required:false },
      { name:"payment_history", type:"json",   required:false },
      { name:"gst_no",          type:"text",   required:false },
      { name:"hsn_code",        type:"text",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 9. TICKETS ────────────────────────────────────────────────────────
  saveCol({
    name:"tickets", type:"base",
    fields:[
      { name:"ticket_no",  type:"text",   required:true  },
      { name:"subject",    type:"text",   required:true  },
      { name:"category",   type:"select", required:true,  maxSelect:1,
        values:["technical","billing","operations","user-access","feature-request","other"] },
      { name:"priority",   type:"select", required:true,  maxSelect:1,
        values:["low","medium","high","critical"] },
      { name:"status",     type:"select", required:true,  maxSelect:1,
        values:["open","in-progress","resolved","closed"] },
      { name:"message",    type:"text",   required:true  },
      { name:"created_by", type:"text",   required:true  },
      { name:"replies",    type:"json",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''",
    updateRule:"@request.auth.role = 'super_admin'",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 10. APP SETTINGS ──────────────────────────────────────────────────
  saveCol({
    name:"app_settings", type:"base",
    fields:[
      { name:"key",      type:"text", required:true  },
      { name:"value",    type:"json", required:true  },
      { name:"category", type:"text", required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.role = 'super_admin'",
    updateRule:"@request.auth.role = 'super_admin'",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

  // ── 11. COMMS LOG ─────────────────────────────────────────────────────
  saveCol({
    name:"comms_log", type:"base",
    fields:[
      { name:"entity_type", type:"select", required:true,  maxSelect:1,
        values:["enquiry","quotation","cfr","operation"] },
      { name:"entity_id",   type:"text",   required:true  },
      { name:"channel",     type:"select", required:true,  maxSelect:1,
        values:["whatsapp","email","sms","call"] },
      { name:"direction",   type:"select", required:true,  maxSelect:1,
        values:["sent","received","auto"] },
      { name:"message",     type:"text",   required:true  },
      { name:"read_receipt",type:"bool",   required:false },
      { name:"sent_by",     type:"text",   required:false },
    ],
    listRule:"@request.auth.id != ''", viewRule:"@request.auth.id != ''",
    createRule:"@request.auth.id != ''", updateRule:"@request.auth.id != ''",
    deleteRule:"@request.auth.role = 'super_admin'",
  });

}, (app) => {
  ["users","vendors","enquiries","surveys","quotations","cfr",
   "operations","invoices","tickets","app_settings","comms_log"]
    .forEach(n => {
      try { const c = app.findCollectionByNameOrId(n); app.delete(c); } catch(_){}
    });
});
