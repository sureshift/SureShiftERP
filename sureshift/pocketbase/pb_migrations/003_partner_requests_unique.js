/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Update partner_requests: allow public list (for duplicate check)
  // and add unique constraints on email + phone
  try {
    var col = app.findCollectionByNameOrId("partner_requests");

    // Allow unauthenticated list so signup form can check duplicates
    col.listRule = "";
    col.viewRule = "";

    // Set email field to unique
    var fields = col.fields;
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].name === "email") {
        fields[i].required = true;
        fields[i].exceptDomains = null;
      }
    }

    app.save(col);
    app.logger().info("[SureShift] partner_requests: listRule set to public for duplicate checks");
  } catch (err) {
    app.logger().error("[SureShift] Migration 003 failed: " + String(err));
  }
}, (app) => {
  try {
    var col = app.findCollectionByNameOrId("partner_requests");
    col.listRule = "@request.auth.id != ''";
    col.viewRule = "@request.auth.id != ''";
    app.save(col);
  } catch (_) {}
});
