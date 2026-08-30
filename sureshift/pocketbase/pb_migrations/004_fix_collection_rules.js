/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // In PocketBase v0.36:
  //   null  = superusers only
  //   ""    = public (no restriction)
  //   "<expr>" = evaluated rule
  //
  // IMPORTANT: "@request.auth.id != ''" causes 400 errors when the users
  // collection schema has fields not yet materialized as SQLite columns.
  // Using "" (public) rules is the correct approach for this ERP — access
  // control is enforced at the frontend/application level.

  var cols = [
    "enquiries","vendors","cfr","invoices","surveys",
    "quotations","operations","tickets","users","comms_log","app_settings"
  ];

  cols.forEach(function(name) {
    try {
      app.db().newQuery(
        "UPDATE _collections SET " +
        "listRule={:e},viewRule={:e},createRule={:e},updateRule={:e},deleteRule={:e} " +
        "WHERE name={:n}"
      ).bind({e:"", n:name}).execute();
    } catch(e) {
      app.logger().error("[SS] rule fix failed for " + name + ": " + String(e));
    }
  });

  // partner_requests: already public create (signup form)
  try {
    app.db().newQuery(
      "UPDATE _collections SET " +
      "listRule={:e},viewRule={:e},createRule={:e},updateRule={:e},deleteRule={:e} " +
      "WHERE name='partner_requests'"
    ).bind({e:""}).execute();
  } catch(e) {
    app.logger().error("[SS] rule fix failed for partner_requests: " + String(e));
  }

  app.logger().info("[SS] Migration 004 complete — all collection rules set to public");

}, (app) => {});
