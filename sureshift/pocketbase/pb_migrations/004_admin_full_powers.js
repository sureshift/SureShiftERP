/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ── 1. Guarantee admin@sureshift.in has role=super_admin, active status ────
  try {
    var col = app.findCollectionByNameOrId("users");
    var admin = app.findFirstRecordByFilter("users", 'email="admin@sureshift.in"');
    admin.set("role", "super_admin");
    admin.set("status", "active");
    if (!admin.get("branch")) admin.set("branch", "NDLH");
    app.save(admin);
    app.logger().info("[SureShift] admin@sureshift.in confirmed as super_admin");
  } catch (err) {
    app.logger().error("[SureShift] Could not patch admin role: " + String(err));
  }

  // ── 2. Make super_admin bulletproof across every collection ────────────────
  // super_admin can always create/update/delete anything, regardless of any
  // other condition in the rule (OR'd in first so it short-circuits).
  var SA = "@request.auth.role = 'super_admin'";
  var targets = [
    "users","vendors","enquiries","surveys","quotations","cfr",
    "operations","invoices","tickets","app_settings","comms_log","partner_requests",
  ];

  targets.forEach(function (name) {
    try {
      var c = app.findCollectionByNameOrId(name);

      function widen(rule) {
        if (rule === null || rule === undefined) return SA;
        if (rule.indexOf(SA) !== -1) return rule; // already present
        return "(" + rule + ") || " + SA;
      }

      // listRule/viewRule: super_admin can always see everything
      c.listRule   = widen(c.listRule || "@request.auth.id != ''");
      c.viewRule   = widen(c.viewRule || "@request.auth.id != ''");
      // createRule/updateRule: super_admin always allowed
      c.createRule = widen(c.createRule || "@request.auth.id != ''");
      c.updateRule = widen(c.updateRule || "@request.auth.id != ''");

      // deleteRule: super_admin always allowed, EXCEPT keep self-delete
      // protection on the users collection so admin can't accidentally
      // delete their own account.
      if (name === "users") {
        c.deleteRule = "@request.auth.role = 'super_admin' && @request.auth.id != id";
      } else {
        c.deleteRule = widen(c.deleteRule || "@request.auth.id != ''");
      }

      app.save(c);
    } catch (err) {
      app.logger().error("[SureShift] Could not widen rules for " + name + ": " + String(err));
    }
  });

  app.logger().info("[SureShift] super_admin now has unconditional full access to all collections");
}, (app) => {
  // no-op down migration — widened rules are safe to leave in place
});
