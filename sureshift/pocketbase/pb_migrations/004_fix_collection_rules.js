/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Direct SQL using confirmed camelCase column names from .schema _collections:
  // listRule, viewRule, createRule, updateRule, deleteRule

  var A = "@request.auth.id != ''";

  var cols = [
    "enquiries","vendors","cfr","invoices","surveys",
    "quotations","operations","tickets","users","comms_log","app_settings"
  ];

  cols.forEach(function(name) {
    try {
      app.db().newQuery(
        "UPDATE _collections SET " +
        "listRule={:a},viewRule={:a},createRule={:a},updateRule={:a},deleteRule={:a} " +
        "WHERE name={:n}"
      ).bind({a:A, n:name}).execute();
    } catch(e) {
      app.logger().error("[SS] rule fix failed for " + name + ": " + String(e));
    }
  });

  // partner_requests: empty createRule so public signup form works
  try {
    app.db().newQuery(
      "UPDATE _collections SET " +
      "listRule={:a},viewRule={:a},createRule='',updateRule={:a},deleteRule={:a} " +
      "WHERE name='partner_requests'"
    ).bind({a:A}).execute();
  } catch(e) {
    app.logger().error("[SS] rule fix failed for partner_requests: " + String(e));
  }

  app.logger().info("[SS] Migration 004 complete - collection rules fixed");

}, (app) => {});
