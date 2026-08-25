/// <reference path="../pb_data/types.d.ts" />

// Approved partner requests become operational vendor records.
// This runs after the partner_requests update is successfully persisted.
onRecordAfterUpdateSuccess(function(e) {
  try {
    if (e.record.getString("status") !== "approved") return e.next();

    var partnerType = e.record.getString("partner_type");
    if (partnerType !== "vehicle" && partnerType !== "manpower") {
      e.app.logger().info("[SS] Approved partner " + e.record.id + " is " + partnerType + "; no vendor record created");
      return e.next();
    }

    var email = e.record.getString("email").toLowerCase();
    var existing = null;
    try {
      existing = e.app.findFirstRecordByData("vendors", "email", email);
    } catch (_) {}

    if (existing) {
      e.app.logger().info("[SS] Vendor already exists for approved partner: " + email);
      return e.next();
    }

    var vendors = e.app.findCollectionByNameOrId("vendors");
    var vendor = new Record(vendors);
    vendor.set("name", e.record.getString("name"));
    vendor.set("type", partnerType === "vehicle" ? "vehicle_vendor" : "manpower_vendor");
    vendor.set("contact", e.record.getString("name"));
    vendor.set("phone", e.record.getString("phone"));
    vendor.set("email", email);
    vendor.set("gst", "");
    vendor.set("branch", "NDLH");
    vendor.set("status", "active");
    vendor.set("rating", 5);
    vendor.set("vehicles", []);
    vendor.set("workers", []);
    vendor.set("total_jobs", 0);
    vendor.set("pending_payout", 0);

    e.app.save(vendor);
    e.app.logger().info("[SS] Vendor created from approved partner request: " + email + " -> " + vendor.id);
  } catch (err) {
    // Approval itself must not be rolled back because vendor provisioning is
    // a secondary workflow. Log the failure so it can be repaired/backfilled.
    e.app.logger().error("[SS] Partner approval provisioning failed: " + String(err));
  }

  return e.next();
}, "partner_requests");
