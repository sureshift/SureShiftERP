/// <reference path="../pb_data/types.d.ts" />

// Repair API rules on EXISTING installations.
//
// Migration files are executed only once. Editing migration 004 cannot repair
// a database where 004 (or an older broken rules migration) was already marked
// as applied. This migration intentionally uses direct SQL, matching the
// proven PocketBase _collections column names used by migration 004.
migrate((app) => {
  const authenticated = "@request.auth.id != ''";

  const collections = [
    "vendors",
    "enquiries",
    "surveys",
    "quotations",
    "cfr",
    "operations",
    "invoices",
    "tickets",
    "comms_log",
    "app_settings",
  ];

  collections.forEach((name) => {
    try {
      app.db().newQuery(
        "UPDATE _collections SET " +
        "listRule={:rule}, " +
        "viewRule={:rule}, " +
        "createRule={:rule}, " +
        "updateRule={:rule}, " +
        "deleteRule={:rule} " +
        "WHERE name={:name}"
      ).bind({ rule: authenticated, name }).execute();
    } catch (err) {
      app.logger().error("[SS] rule repair failed for " + name + ": " + String(err));
      throw err;
    }
  });

  // users is an auth collection. Existing authenticated users may read their
  // user collection, but only a super admin should create/delete users.
  try {
    app.db().newQuery(
      "UPDATE _collections SET " +
      "listRule={:auth}, " +
      "viewRule={:auth}, " +
      "createRule={:admin}, " +
      "updateRule={:update}, " +
      "deleteRule={:delete} " +
      "WHERE name='users'"
    ).bind({
      auth: authenticated,
      admin: "@request.auth.id != '' && @request.auth.role = 'super_admin'",
      update: "@request.auth.id != '' && (@request.auth.role = 'super_admin' || @request.auth.id = id)",
      delete: "@request.auth.id != '' && @request.auth.role = 'super_admin' && @request.auth.id != id",
    }).execute();
  } catch (err) {
    app.logger().error("[SS] rule repair failed for users: " + String(err));
    throw err;
  }

  // partner_requests must remain publicly creatable because the login page
  // contains a public partner registration form. Reading/modifying requests
  // still requires authentication.
  try {
    app.db().newQuery(
      "UPDATE _collections SET " +
      "listRule={:auth}, " +
      "viewRule={:auth}, " +
      "createRule='', " +
      "updateRule={:auth}, " +
      "deleteRule={:auth} " +
      "WHERE name='partner_requests'"
    ).bind({ auth: authenticated }).execute();
  } catch (err) {
    // The collection may not exist on older installations; don't fail the
    // entire ERP migration in that case.
    app.logger().warn("[SS] partner_requests rule repair skipped: " + String(err));
  }

  app.logger().info("[SS] Migration 005 complete - ERP collection rules repaired");
}, (app) => {
  // Intentionally no destructive rollback. The migration repairs security
  // rules on an existing production database and should remain effective.
});
