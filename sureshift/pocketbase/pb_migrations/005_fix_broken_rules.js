/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Migration 004 attempted to "widen" every rule by programmatically
  // wrapping it as "(<old rule>) || @request.auth.role = 'super_admin'".
  // That produced filter expressions PocketBase's rule parser rejected,
  // causing EVERY request against EVERY collection to fail with a
  // generic 400 "Something went wrong" error. This migration replaces
  // every rule with hand-written, explicit strings — the same proven
  // syntax style already used successfully in the original schema —
  // so there's no risk of malformed concatenation.

  function setRules(name, rules) {
    try {
      var c = app.findCollectionByNameOrId(name);
      if (rules.list   !== undefined) c.listRule   = rules.list;
      if (rules.view   !== undefined) c.viewRule   = rules.view;
      if (rules.create !== undefined) c.createRule = rules.create;
      if (rules.update !== undefined) c.updateRule = rules.update;
      if (rules.delete !== undefined) c.deleteRule = rules.delete;
      app.save(c);
      app.logger().info("[SureShift] Rules fixed for " + name);
    } catch (err) {
      app.logger().error("[SureShift] Could not fix rules for " + name + ": " + String(err));
    }
  }

  var AUTH = "@request.auth.id != ''";
  var SA   = "@request.auth.role = 'super_admin'";

  setRules("users", {
    list:   AUTH,
    view:   AUTH,
    create: SA,
    update: AUTH + " && (" + SA + " || @request.auth.id = id)",
    delete: SA + " && @request.auth.id != id",
  });

  setRules("vendors", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("enquiries", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA + " || @request.auth.role = 'branch_head'",
  });

  setRules("surveys", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("quotations", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("cfr", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("operations", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("invoices", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("tickets", {
    list: AUTH, view: AUTH,
    create: AUTH,
    update: SA,
    delete: SA,
  });

  setRules("app_settings", {
    list: AUTH, view: AUTH,
    create: SA, update: SA, delete: SA,
  });

  setRules("comms_log", {
    list: AUTH, view: AUTH,
    create: AUTH, update: AUTH,
    delete: SA,
  });

  setRules("partner_requests", {
    list: AUTH, view: AUTH,
    create: "",
    update: SA + " || @request.auth.role = 'branch_head'",
    delete: SA,
  });

  // Re-confirm admin@sureshift.in role (safe to repeat).
  try {
    var admin = app.findFirstRecordByFilter("users", 'email="admin@sureshift.in"');
    admin.set("role", "super_admin");
    admin.set("status", "active");
    if (!admin.get("branch")) admin.set("branch", "NDLH");
    app.save(admin);
    app.logger().info("[SureShift] admin@sureshift.in role re-confirmed as super_admin");
  } catch (err) {
    app.logger().error("[SureShift] Could not confirm admin role: " + String(err));
  }
}, (app) => {
  // no-op down migration
});
