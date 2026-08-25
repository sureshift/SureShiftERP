/// <reference path="../pb_data/types.d.ts" />

// Backfill vendor records for partner requests that were already approved
// before the approval-provisioning hook was installed.
migrate((app) => {
  let requests = [];
  try {
    requests = app.findRecordsByFilter("partner_requests", "status='approved'", "-created", 0, 0);
  } catch (err) {
    app.logger().error("[SS] Partner approval backfill: cannot read partner_requests: " + String(err));
    return;
  }

  const vendors = app.findCollectionByNameOrId("vendors");
  let created = 0;
  let skipped = 0;

  requests.forEach((request) => {
    const partnerType = request.getString("partner_type");
    if (partnerType !== "vehicle" && partnerType !== "manpower") {
      skipped++;
      return;
    }

    const email = request.getString("email").toLowerCase();
    try {
      app.findFirstRecordByData("vendors", "email", email);
      skipped++;
      return;
    } catch (_) {}

    try {
      const vendor = new Record(vendors);
      vendor.set("name", request.getString("name"));
      vendor.set("type", partnerType === "vehicle" ? "vehicle_vendor" : "manpower_vendor");
      vendor.set("contact", request.getString("name"));
      vendor.set("phone", request.getString("phone"));
      vendor.set("email", email);
      vendor.set("gst", "");
      vendor.set("branch", "NDLH");
      vendor.set("status", "active");
      vendor.set("rating", 5);
      vendor.set("vehicles", []);
      vendor.set("workers", []);
      vendor.set("total_jobs", 0);
      vendor.set("pending_payout", 0);
      app.save(vendor);
      created++;
    } catch (err) {
      app.logger().error("[SS] Partner approval backfill failed for " + email + ": " + String(err));
    }
  });

  app.logger().info("[SS] Partner approval backfill complete. Created=" + created + ", skipped=" + skipped);
}, (app) => {
  // Non-destructive migration. Do not delete provisioned vendors on rollback.
});
