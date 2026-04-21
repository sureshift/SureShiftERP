/**
 * SureShift ERP v2.0 — App.jsx
 *
 * This file wires real PocketBase auth.
 * The full UI (all 8 steps) lives in ErpUI.jsx — paste the content of
 * sureshift-erp-production.jsx here and rename the default export to ErpApp.
 *
 * HOW TO WIRE:
 *   1. Place sureshift-erp-production.jsx content into src/ErpUI.jsx
 *   2. In ErpUI.jsx, change:
 *        const { state } = useContext(AppContext)
 *      to:
 *        const { user, ... } = useAppAuth()
 *   3. The login page in ErpUI.jsx already calls login() — it will just work.
 *
 * For now this file shows a working connected shell so you can verify
 * PocketBase auth is working before wiring the full UI.
 */

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useSettings } from "./hooks/useCollection.js";
import pb from "./lib/pb.js";

// ── Auth Context ────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
export const useAppAuth = () => useContext(AuthCtx);

// ── Role meta ────────────────────────────────────────────────────────────────
const ROLES = {
  super_admin:     { label:"Super Admin",     color:"#DB2648", icon:"👑" },
  branch_head:     { label:"Branch Head",     color:"#2563EB", icon:"🏢" },
  sales_exec:      { label:"Sales Executive", color:"#D97706", icon:"💼" },
  ops_exec:        { label:"Ops Executive",   color:"#0D9488", icon:"⚙️" },
  finance_exec:    { label:"Finance Exec",    color:"#7C3AED", icon:"💰" },
  surveyor:        { label:"Surveyor",        color:"#059669", icon:"📋" },
  vehicle_vendor:  { label:"Vehicle Vendor",  color:"#0284C7", icon:"🚛" },
  manpower_vendor: { label:"Manpower Vendor", color:"#7C3AED", icon:"👷" },
};

export function hasPerm(user, module, action) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return (user.permissions?.[module] || []).includes(action);
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const authHook = useAuth();
  const { settings, loading: settingsLoading, save: saveSetting } = useSettings();

  const ctx = {
    ...authHook,
    settings,
    settingsLoading,
    saveSetting,
    ROLES,
    hasPerm: (mod, action) => hasPerm(authHook.user, mod, action),
    isSuperAdmin: authHook.user?.role === "super_admin",
  };

  return (
    <AuthCtx.Provider value={ctx}>
      {authHook.loading ? <Splash /> : authHook.user ? <Shell /> : <Login />}
    </AuthCtx.Provider>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0F172A" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:"center" }}>
        <svg width={44} height={44} viewBox="0 0 60 60" fill="none" style={{ display:"block", margin:"0 auto 14px" }}>
          <path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{ fontFamily:"system-ui", fontSize:16, fontWeight:700, color:"#fff", letterSpacing:"1px", marginBottom:14 }}>
          SURE<span style={{ color:"#DB2648" }}>SHIFT</span> ERP
        </div>
        <div style={{ width:26, height:26, border:"3px solid rgba(219,38,72,.3)", borderTopColor:"#DB2648", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto" }}/>
      </div>
    </div>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login() {
  const { login, error } = useAppAuth();
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [busy,  setBusy]    = useState(false);
  const [tab,   setTab]     = useState("login");
  const [localErr, setLocalErr] = useState("");

  const DEMOS = [
    { role:"super_admin",    email:"admin@sureshift.in",      pass:"SureShift@2026!", desc:"Full system access" },
    { role:"branch_head",    email:"branchhead@sureshift.in", pass:"Branch@2026!",    desc:"NDLH branch management" },
    { role:"sales_exec",     email:"sales@sureshift.in",      pass:"Sales@2026!",     desc:"Enquiries & quotations" },
    { role:"ops_exec",       email:"ops@sureshift.in",        pass:"Ops@2026!",       desc:"Operations & dispatch" },
    { role:"finance_exec",   email:"finance@sureshift.in",    pass:"Finance@2026!",   desc:"Billing & invoices" },
    { role:"surveyor",       email:"surveyor@sureshift.in",   pass:"Survey@2026!",    desc:"Survey assignments" },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !pass) { setLocalErr("Enter email and password."); return; }
    setBusy(true); setLocalErr("");
    try { await login(email.trim().toLowerCase(), pass); }
    catch (err) { setLocalErr(err.message); }
    finally { setBusy(false); }
  };

  const quickLogin = async (d) => {
    setBusy(true); setLocalErr("");
    try { await login(d.email, d.pass); }
    catch (err) { setLocalErr(err.message); }
    finally { setBusy(false); }
  };

  const err = localErr || error;

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F172A,#1E2D42,#111827)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .li{width:100%;padding:12px 16px;border:1.5px solid #E8ECF4;border-radius:10px;font:400 14px/1 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:border-color .15s}
        .li:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
        .li::placeholder{color:#94A3B8}
        .rc{border:2px solid #E8ECF4;border-radius:11px;padding:10px 13px;cursor:pointer;transition:all .15s;background:#fff;display:flex;align-items:center;gap:10px}
        .rc:hover{border-color:#DB2648;background:rgba(219,38,72,.03)}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ width:"100%", maxWidth:860, display:"grid", gridTemplateColumns:"1fr 1fr", borderRadius:20, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.4)" }}>
        {/* Left */}
        <div style={{ background:"linear-gradient(160deg,#DB2648,#91163A)", padding:"44px 36px", display:"flex", flexDirection:"column", gap:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:40 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width={24} height={24} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"1.2px", textTransform:"uppercase" }}>SURESHIFT</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:9.5, color:"rgba(255,255,255,.5)", letterSpacing:"2.5px", textTransform:"uppercase" }}>ERP Platform v2.0</div>
            </div>
          </div>
          <h1 style={{ fontFamily:"'Poppins',sans-serif", fontSize:28, fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:14 }}>End-to-end<br/>Relocation<br/>Management</h1>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"rgba(255,255,255,.65)", lineHeight:1.7, marginBottom:28 }}>Enquiry → Survey → Quotation → CFR → Operations → Invoice. One platform.</p>
          {["Auto doc numbering (SS-ENQ-NDLH-2627-0001)","8 roles with separate dashboards","WhatsApp + Email at every stage","PocketBase — your data, your server"].map(f=>(
            <div key={f} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10 }}>
              <div style={{ width:15, height:15, borderRadius:"50%", background:"rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width={8} height={8} viewBox="0 0 10 10"><path d="M1.5 5l3 3 4-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12.5, color:"rgba(255,255,255,.75)" }}>{f}</span>
            </div>
          ))}
          <div style={{ marginTop:"auto", paddingTop:28, fontFamily:"'Inter',sans-serif", fontSize:11, color:"rgba(255,255,255,.3)" }}>© 2026 Sure Shift Relocation Services Pvt. Ltd.</div>
        </div>

        {/* Right */}
        <div style={{ background:"#fff" }}>
          <div style={{ display:"flex", borderBottom:"1px solid #E8ECF4" }}>
            {[{id:"login",l:"Sign In"},{id:"demo",l:"Quick Demo"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"15px", border:"none", background:"transparent", fontFamily:"'Inter',sans-serif", fontSize:13.5, fontWeight:tab===t.id?700:500, color:tab===t.id?"#DB2648":"#94A3B8", borderBottom:`2.5px solid ${tab===t.id?"#DB2648":"transparent"}`, cursor:"pointer", transition:"all .15s" }}>{t.l}</button>
            ))}
          </div>
          <div style={{ padding:"28px 32px" }}>
            {err&&<div style={{ background:"rgba(220,38,38,.07)", border:"1px solid rgba(220,38,38,.2)", borderRadius:9, padding:"9px 13px", marginBottom:16, fontFamily:"'Inter',sans-serif", fontSize:12.5, color:"#DC2626" }}>{err}</div>}

            {tab==="login" ? (
              <>
                <h2 style={{ fontFamily:"'Poppins',sans-serif", fontSize:20, fontWeight:700, color:"#0F172A", marginBottom:4 }}>Welcome back</h2>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, color:"#4B5563", marginBottom:22 }}>Sign in to SureShift ERP</p>
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom:13 }}>
                    <label style={{ display:"block", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:"#4B5563", marginBottom:5 }}>Email <span style={{ color:"#DB2648" }}>*</span></label>
                    <input className="li" type="email" value={email} onChange={e=>{setEmail(e.target.value);setLocalErr("");}} placeholder="you@sureshift.in"/>
                  </div>
                  <div style={{ marginBottom:20 }}>
                    <label style={{ display:"block", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:"#4B5563", marginBottom:5 }}>Password <span style={{ color:"#DB2648" }}>*</span></label>
                    <input className="li" type="password" value={pass} onChange={e=>{setPass(e.target.value);setLocalErr("");}} placeholder="Enter password"/>
                  </div>
                  <button type="submit" disabled={busy} style={{ width:"100%", padding:"12px", background:busy?"#94A3B8":"#DB2648", color:"#fff", border:"none", borderRadius:10, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    {busy?<><div style={{ width:15, height:15, border:"2.5px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .8s linear infinite" }}/> Signing in…</>:"Sign In →"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily:"'Poppins',sans-serif", fontSize:19, fontWeight:700, color:"#0F172A", marginBottom:4 }}>Quick Demo</h2>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12.5, color:"#4B5563", marginBottom:14 }}>Click a role to instantly explore that dashboard</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {DEMOS.map(d=>{
                    const r = ROLES[d.role]||{};
                    return (
                      <div key={d.role} className="rc" onClick={()=>!busy&&quickLogin(d)}>
                        <div style={{ width:32, height:32, borderRadius:8, background:`${r.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:15 }}>{r.icon}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12.5, fontWeight:700, color:"#0F172A" }}>{r.label}</div>
                          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:"#94A3B8" }}>{d.desc}</div>
                        </div>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10.5, color:r.color, background:`${r.color}12`, borderRadius:5, padding:"2px 8px", fontWeight:700 }}>{busy?"…":"→"}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:12, padding:"9px 12px", background:"rgba(37,99,235,.05)", borderRadius:8, border:"1px solid rgba(37,99,235,.13)", fontFamily:"'Inter',sans-serif", fontSize:11, color:"#2563EB" }}>
                  ℹ️ Demo accounts are seeded automatically on first PocketBase start.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Shell — import full ERP UI here ──────────────────────────────────────
// Paste the full sureshift-erp-production.jsx AppShell component here,
// replacing useContext(AppContext) with useAppAuth()
function Shell() {
  const { user, logout } = useAppAuth();
  const r = ROLES[user?.role] || {};
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F9FC", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center", maxWidth:440 }}>
        <div style={{ width:64, height:64, borderRadius:18, background:`${r.color}14`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", fontSize:28 }}>{r.icon}</div>
        <div style={{ fontSize:20, fontWeight:700, color:"#0F172A", marginBottom:6 }}>Connected to PocketBase ✅</div>
        <div style={{ fontSize:14, color:"#4B5563", lineHeight:1.65, marginBottom:6 }}>
          Logged in as <strong>{user?.name}</strong><br/>
          Role: <strong style={{ color:r.color }}>{r.label}</strong> · Branch: <strong>{user?.branch}</strong>
        </div>
        <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20, padding:"10px 14px", background:"#F7F9FC", borderRadius:9, border:"1px solid #E8ECF4", lineHeight:1.6 }}>
          Auth is working. Now paste the full ERP UI (sureshift-erp-production.jsx)<br/>
          into <code>src/ErpUI.jsx</code> and import it here as <code>&lt;ErpApp/&gt;</code>
        </div>
        <button onClick={logout} style={{ padding:"9px 22px", background:"#DB2648", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" }}>Sign Out</button>
      </div>
    </div>
  );
}
