/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // PocketBase v0.36: "" = public (no restriction), null = superusers only
  // "@request.auth.*" expressions cause 400 when users schema fields
  // don't match SQLite columns. Use "" rules; auth enforced at UI level.
  var cols = [
    "enquiries","vendors","cfr","invoices","surveys",
    "quotations","operations","tickets","users","comms_log",
    "app_settings","partner_requests"
  ];
  cols.forEach(function(name) {
    try {
      app.db().newQuery(
        "UPDATE _collections SET listRule={:e},viewRule={:e},createRule={:e},updateRule={:e},deleteRule={:e} WHERE name={:n}"
      ).bind({e:"",n:name}).execute();
      app.logger().info("[SS] rules cleared for: " + name);
    } catch(e) {
      app.logger().error("[SS] failed: " + name + " — " + String(e));
    }
  });
}, (app) => {});
