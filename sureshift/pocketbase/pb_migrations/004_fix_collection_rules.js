/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  var A = "@request.auth.id != ''";
  var cols = [
    "enquiries","vendors","cfr","invoices","surveys",
    "quotations","operations","tickets","users","comms_log","app_settings"
  ];

  cols.forEach(function(name) {
    try {
      app.db().newQuery(
        "UPDATE _collections SET " +
        "list_rule={:a},view_rule={:a},create_rule={:a},update_rule={:a},delete_rule={:a} " +
        "WHERE name={:n}"
      ).bind({a:A,n:name}).execute();
    } catch(e) {
      app.logger().error("[SS] "+name+": "+String(e));
    }
  });

  try {
    app.db().newQuery(
      "UPDATE _collections SET " +
      "list_rule={:a},view_rule={:a},create_rule='',update_rule={:a},delete_rule={:a} " +
      "WHERE name='partner_requests'"
    ).bind({a:A}).execute();
  } catch(e) {
    app.logger().error("[SS] partner_requests: "+String(e));
  }

  try {
    app.db().newQuery(
      "UPDATE users SET role='super_admin',status='active' WHERE email='admin@sureshift.in'"
    ).execute();
  } catch(e) {}

  app.logger().info("[SS] Migration 004 done");
}, (app) => {});
