/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // These are the exact rules confirmed working live on 2026-06-21.
  // All collections: any authenticated user can list/view/create/update.
  // Delete is open to any auth user for now — can be tightened later.
  // partner_requests createRule = "" so the public signup form still works.

  var COLS = [
    "enquiries","vendors","cfr","invoices",
    "surveys","quotations","operations","tickets","users","comms_log","app_settings"
  ];

  COLS.forEach(function(name) {
    try {
      var c = app.findCollectionByNameOrId(name);
      c.listRule   = "@request.auth.id != ''";
      c.viewRule   = "@request.auth.id != ''";
      c.createRule = "@request.auth.id != ''";
      c.updateRule = "@request.auth.id != ''";
      c.deleteRule = "@request.auth.id != ''";
      app.save(c);
      app.logger().info("[SureShift] Rules OK: " + name);
    } catch(e) {
      app.logger().error("[SureShift] Skip " + name + ": " + String(e));
    }
  });

  // partner_requests: public create (signup form), auth for everything else
  try {
    var pr = app.findCollectionByNameOrId("partner_requests");
    pr.listRule   = "@request.auth.id != ''";
    pr.viewRule   = "@request.auth.id != ''";
    pr.createRule = "";
    pr.updateRule = "@request.auth.id != ''";
    pr.deleteRule = "@request.auth.id != ''";
    app.save(pr);
    app.logger().info("[SureShift] Rules OK: partner_requests");
  } catch(e) {
    app.logger().error("[SureShift] Skip partner_requests: " + String(e));
  }

  // Guarantee admin@sureshift.in has role=super_admin
  try {
    var admin = app.findFirstRecordByFilter("users", "email = 'admin@sureshift.in'");
    admin.set("role", "super_admin");
    admin.set("status", "active");
    if (!admin.get("branch")) admin.set("branch", "NDLH");
    app.save(admin);
    app.logger().info("[SureShift] admin role confirmed: super_admin");
  } catch(e) {
    app.logger().error("[SureShift] admin role fix failed: " + String(e));
  }

}, (app) => {});
