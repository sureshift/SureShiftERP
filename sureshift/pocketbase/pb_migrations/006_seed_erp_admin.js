/// <reference path="../pb_data/types.d.ts" />

// Create the first ERP application user when a fresh installation has none.
// This is NOT a PocketBase superuser; it is the application's users collection
// account with role=super_admin. The credentials come from docker-compose env.
migrate((app) => {
  const email = $os.getenv("PB_SURESHIFT_ADMIN_EMAIL");
  const password = $os.getenv("PB_SURESHIFT_ADMIN_PASS");

  if (!email || !password) {
    app.logger().warn("[SS] ERP admin seed skipped: PB_SURESHIFT_ADMIN_EMAIL/PB_SURESHIFT_ADMIN_PASS not set");
    return;
  }

  try {
    app.findAuthRecordByEmail("users", email);
    app.logger().info("[SS] ERP admin already exists: " + email);
    return;
  } catch (_) {
    // Expected when this is the first installation.
  }

  const users = app.findCollectionByNameOrId("users");
  const admin = new Record(users);
  admin.set("email", email.toLowerCase());
  admin.set("emailVisibility", false);
  admin.set("password", password);
  admin.set("name", "SureShift Administrator");
  admin.set("phone", "");
  admin.set("role", "super_admin");
  admin.set("branch", "NDLH");
  admin.set("status", "active");
  admin.set("permissions", {});

  app.save(admin);
  app.logger().info("[SS] ERP admin created: " + email);
}, (app) => {
  // Do not delete the production admin on rollback.
});
