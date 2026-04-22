/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  function saveCol(def) {
    try { app.findCollectionByNameOrId(def.name); return; } catch (_) {}
    app.save(new Collection(def));
  }

  saveCol({
    name: "partner_requests", type: "base",
    fields: [
      { name:"name",         type:"text",   required:true },
      { name:"email",        type:"email",  required:true },
      { name:"phone",        type:"text",   required:true },
      { name:"company",      type:"text",   required:true },
      { name:"partner_type", type:"select", required:true, maxSelect:1,
        values:["vehicle","manpower","material","business"] },
      { name:"status",       type:"select", required:true, maxSelect:1,
        values:["pending","approved","rejected","on_hold"] },
      { name:"admin_notes",  type:"text" },
      { name:"submitted_at", type:"text" },
    ],
    listRule:   "@request.auth.id != ''",
    viewRule:   "@request.auth.id != ''",
    createRule: "",
    updateRule: "@request.auth.role = 'super_admin' || @request.auth.role = 'branch_head'",
    deleteRule: "@request.auth.role = 'super_admin'",
  });

}, (app) => {
  try { app.delete(app.findCollectionByNameOrId("partner_requests")); } catch(_) {}
});
