/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── Set collection rules using the same proven pattern as migration 001 ──
  // Migration 004 (old) used dynamic string-wrapping that broke rule syntax.
  // This migration replaces every affected collection's rules explicitly.

  function fixRules(name, list, view, create, update, del) {
    try {
      var c = app.findCollectionByNameOrId(name);
      c.listRule   = list;
      c.viewRule   = view;
      c.createRule = create;
      c.updateRule = update;
      c.deleteRule = del;
      app.save(c);
    } catch (e) {}
  }

  var A = "@request.auth.id != ''";

  fixRules("enquiries",  A, A, A, A, A);
  fixRules("vendors",    A, A, A, A, A);
  fixRules("cfr",        A, A, A, A, A);
  fixRules("invoices",   A, A, A, A, A);
  fixRules("surveys",    A, A, A, A, A);
  fixRules("quotations", A, A, A, A, A);
  fixRules("operations", A, A, A, A, A);
  fixRules("tickets",    A, A, A, A, A);
  fixRules("users",      A, A, A, A, A);
  fixRules("comms_log",  A, A, A, A, A);
  fixRules("app_settings", A, A, A, A, A);

  // partner_requests: public create for signup form
  fixRules("partner_requests", A, A, "", A, A);

  // Ensure admin@sureshift.in has super_admin role
  try {
    var admin = app.findFirstRecordByFilter("users", "email = 'admin@sureshift.in'");
    admin.set("role", "super_admin");
    admin.set("status", "active");
    if (!admin.get("branch")) admin.set("branch", "NDLH");
    app.save(admin);
  } catch (e) {}

}, (app) => {});
