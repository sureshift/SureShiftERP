import PocketBase from "pocketbase";

// VITE_PB_URL is baked in at Docker build time from docker-compose args:
// args: { VITE_PB_URL: https://pb.sureshift.in }
// So every browser request goes to your CF-tunnelled PocketBase.
const PB_URL = import.meta.env.VITE_PB_URL || "http://localhost:8091";

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

export default pb;

// ── Collection names ─────────────────────────────────────────────────────
export const C = {
  USERS:      "users",
  VENDORS:    "vendors",
  ENQUIRIES:  "enquiries",
  SURVEYS:    "surveys",
  QUOTATIONS: "quotations",
  CFR:        "cfr",
  OPERATIONS: "operations",
  INVOICES:   "invoices",
  TICKETS:    "tickets",
  SETTINGS:   "app_settings",
  COMMS:      "comms_log",
};

// ── Auth ─────────────────────────────────────────────────────────────────
export const auth = {
  login:       (email, pass) => pb.collection(C.USERS).authWithPassword(email, pass),
  logout:      ()            => pb.authStore.clear(),
  refresh:     ()            => pb.collection(C.USERS).authRefresh(),
  currentUser: ()            => pb.authStore.model,
  isValid:     ()            => pb.authStore.isValid,
  onChange:    (cb)          => pb.authStore.onChange(cb),
};

// ── Generic service factory ───────────────────────────────────────────────
export const svc = (col) => ({
  list:      (filter="", sort="-created", page=1, per=50, expand="") =>
               pb.collection(col).getList(page, per, { filter, sort, expand }),
  all:       (filter="", sort="-created", expand="") =>
               pb.collection(col).getFullList({ filter, sort, expand }),
  one:       (id, expand="")  => pb.collection(col).getOne(id, { expand }),
  first:     (filter, expand="") => pb.collection(col).getFirstListItem(filter, { expand }),
  create:    (data)           => pb.collection(col).create(data),
  update:    (id, data)       => pb.collection(col).update(id, data),
  delete:    (id)             => pb.collection(col).delete(id),
  subscribe: (cb, id="*")     => pb.collection(col).subscribe(id, cb),
  unsub:     ()               => pb.collection(col).unsubscribe(),
});

// ── Named services ────────────────────────────────────────────────────────
export const userSvc      = svc(C.USERS);
export const vendorSvc    = svc(C.VENDORS);
export const enquirySvc   = svc(C.ENQUIRIES);
export const surveySvc    = svc(C.SURVEYS);
export const quotSvc      = svc(C.QUOTATIONS);
export const cfrSvc       = svc(C.CFR);
export const opsSvc       = svc(C.OPERATIONS);
export const invoiceSvc   = svc(C.INVOICES);
export const ticketSvc    = svc(C.TICKETS);
export const commsSvc     = svc(C.COMMS);

// ── Settings helper ───────────────────────────────────────────────────────
export const settingsSvc = {
  get: async (key) => {
    try {
      const r = await pb.collection(C.SETTINGS).getFirstListItem(`key="${key}"`);
      return r.value;
    } catch { return null; }
  },
  set: async (key, value, category = "general") => {
    try {
      const r = await pb.collection(C.SETTINGS).getFirstListItem(`key="${key}"`);
      return pb.collection(C.SETTINGS).update(r.id, { value });
    } catch {
      return pb.collection(C.SETTINGS).create({ key, value, category });
    }
  },
  all: async () => {
    const rows = await pb.collection(C.SETTINGS).getFullList();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  },
};

// ── Doc number helpers (preview only — server hook generates the real ones) ──
export const docNum = {
  enq:   (b, fy, s)      => `SS-ENQ-${b}-${fy}-${s}`,
  srv:   (b, fy, s)      => `SS-SRV-${b}-${fy}-${s}`,
  quot:  (b, fy, s, r=0) => `SS-QUOT-${b}-${fy}-${s}${r > 0 ? "/" + r : ""}`,
  cfr:   (b, fy, s)      => `SS-CFR-${b}-${fy}-${s}`,
  inv:   (b, fy, s)      => `SS-INV-${b}-${fy}-${s}`,
  rct:   (b, fy, s, t)   => `SS-RCT-${b}-${fy}-${s}-${t}`,
  blty:  (b, fy, s)      => `SS-BLTY-${b}-${fy}-${s}`,
  pay:   (b, fy, s)      => `SS-PAY-${b}-${fy}-${s}`,
};
