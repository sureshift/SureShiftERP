/**
 * SureShift ERP v2.0 — Production Build
 * Super Admin Panel | Real PocketBase data only
 * Design: Poppins + Inter | #0F172A · #DB2648 · #E8ECF4
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useCollection, useMutation, useSettings } from "./hooks/useCollection.js";
import pb from "./lib/pb.js";

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ROLES = {
  super_admin:     { label:"Super Admin",     color:"#DB2648", icon:"👑", desc:"Full unrestricted access to all modules" },
  branch_head:     { label:"Branch Head",     color:"#2563EB", icon:"🏢", desc:"Branch-level management and oversight" },
  sales_exec:      { label:"Sales Executive", color:"#D97706", icon:"💼", desc:"Enquiries, surveys and quotations" },
  ops_exec:        { label:"Ops Executive",   color:"#0D9488", icon:"⚙️",  desc:"Operations, dispatch and tracking" },
  finance_exec:    { label:"Finance Exec",    color:"#7C3AED", icon:"💰", desc:"Invoices, payments and financial reports" },
  surveyor:        { label:"Surveyor",        color:"#059669", icon:"📋", desc:"Survey assignments and inventory reports" },
  vehicle_vendor:  { label:"Vehicle Vendor",  color:"#0284C7", icon:"🚛", desc:"Vehicle availability and job acceptance" },
  manpower_vendor: { label:"Manpower Vendor", color:"#7C3AED", icon:"👷", desc:"Crew availability and job acceptance" },
};

const MODULE_PERMISSIONS = {
  enquiries:  { label:"Enquiries",   icon:"📥", actions:["view","create","edit","delete","assign","stage_change"] },
  surveys:    { label:"Surveys",     icon:"📋", actions:["view","create","edit","assign","report"] },
  quotations: { label:"Quotations",  icon:"📄", actions:["view","create","edit","send","approve","revise"] },
  bookings:   { label:"Bookings",    icon:"📦", actions:["view","create","edit","cancel","payment"] },
  operations: { label:"Operations",  icon:"🚛", actions:["view","update","dispatch","checklist"] },
  invoices:   { label:"Invoices",    icon:"💳", actions:["view","create","edit","send","payment","cancel"] },
  vendors:    { label:"Vendors",     icon:"🤝", actions:["view","create","edit","delete"] },
  users:      { label:"Users",       icon:"👥", actions:["view","create","edit","delete","assign_roles"] },
  reports:    { label:"Reports",     icon:"📊", actions:["view","export"] },
  settings:   { label:"Settings",   icon:"⚙️",  actions:["view","edit"] },
};

const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: Object.fromEntries(Object.entries(MODULE_PERMISSIONS).map(([k,v])=>[k,v.actions])),
  branch_head: {
    enquiries:["view","create","edit","assign","stage_change"],
    surveys:["view","create","edit","assign","report"],
    quotations:["view","create","edit","send","approve","revise"],
    bookings:["view","create","edit","cancel","payment"],
    operations:["view","update","dispatch","checklist"],
    invoices:["view","create","edit","send","payment"],
    vendors:["view","create","edit"],
    users:["view"],
    reports:["view","export"],
    settings:["view"],
  },
  sales_exec: {
    enquiries:["view","create","edit","stage_change"],
    surveys:["view","create"],
    quotations:["view","create","edit","send","revise"],
    bookings:["view"],
    operations:[],
    invoices:["view"],
    vendors:["view"],
    users:[],
    reports:["view"],
    settings:[],
  },
  ops_exec: {
    enquiries:["view"],
    surveys:["view","assign"],
    quotations:["view"],
    bookings:["view","edit"],
    operations:["view","update","dispatch","checklist"],
    invoices:["view"],
    vendors:["view","create","edit"],
    users:[],
    reports:["view"],
    settings:[],
  },
  finance_exec: {
    enquiries:["view"],
    surveys:[],
    quotations:["view","approve"],
    bookings:["view","payment"],
    operations:["view"],
    invoices:["view","create","edit","send","payment","cancel"],
    vendors:["view"],
    users:[],
    reports:["view","export"],
    settings:["view"],
  },
  surveyor: {
    enquiries:["view"],
    surveys:["view","create","edit","report"],
    quotations:[],
    bookings:[],
    operations:[],
    invoices:[],
    vendors:[],
    users:[],
    reports:[],
    settings:[],
  },
  vehicle_vendor: { enquiries:[],surveys:[],quotations:[],bookings:["view"],operations:["view","update"],invoices:["view"],vendors:[],users:[],reports:[],settings:[] },
  manpower_vendor:{ enquiries:[],surveys:[],quotations:[],bookings:["view"],operations:["view","update"],invoices:["view"],vendors:[],users:[],reports:[],settings:[] },
};

const BRANCHES    = ["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"];
const MOVE_TYPES  = ["household","office","international","vehicle","bike","storage","commercial","courier"];
const SOURCES     = ["website","gmb","phone","whatsapp","reference"];
const ENQ_STAGES  = ["new","survey","quotation","recalling","cfr","lost"];
const FY = (()=>{ const n=new Date(),y=n.getFullYear(),m=n.getMonth(); return m>=3?`${String(y).slice(-2)}${String(y+1).slice(-2)}`:`${String(y-1).slice(-2)}${String(y).slice(-2)}`; })();

export function hasPerm(user, mod, action) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return (user.permissions?.[mod] || []).includes(action);
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
export const useAppAuth = () => useContext(AuthCtx);

export default function App() {
  const authHook = useAuth();
  const { settings, loading: settingsLoading, save: saveSetting } = useSettings();
  const ctx = {
    ...authHook, settings, settingsLoading, saveSetting, ROLES,
    hasPerm: (mod, action) => hasPerm(authHook.user, mod, action),
    isSuperAdmin: authHook.user?.role === "super_admin",
  };
  return (
    <AuthCtx.Provider value={ctx}>
      {authHook.loading ? <Splash /> : authHook.user ? <Shell /> : <Login />}
    </AuthCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SPLASH
// ─────────────────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F172A"}}>
      <S/>
      <div style={{textAlign:"center"}}>
        <svg width={44} height={44} viewBox="0 0 60 60" fill="none" style={{display:"block",margin:"0 auto 14px"}}>
          <path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#fff",letterSpacing:"1px",marginBottom:14}}>
          SURE<span style={{color:"#DB2648"}}>SHIFT</span> ERP
        </div>
        <div style={{width:26,height:26,border:"3px solid rgba(219,38,72,.3)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto"}}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────
function S() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',sans-serif;background:#F7F9FC}
      @keyframes spin{to{transform:rotate(360deg)}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
      .li{width:100%;padding:12px 16px;border:1.5px solid #E8ECF4;border-radius:10px;font:400 14px/1 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:border-color .15s}
      .li:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
      .li::placeholder{color:#94A3B8}
      .inp{width:100%;padding:10px 13px;border:1.5px solid #E8ECF4;border-radius:9px;font:400 13.5px/1.2 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:border-color .15s;box-sizing:border-box}
      .inp:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
      .inp::placeholder{color:#CBD5E1}
      .inp:disabled{background:#F8FAFC;color:#94A3B8;cursor:not-allowed}
      .sel{appearance:none;width:100%;padding:10px 13px;border:1.5px solid #E8ECF4;border-radius:9px;font:400 13.5px/1 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%2394A3B8' fill='none' stroke-width='1.5'/%3E%3C/svg%3E") no-repeat right 12px center;cursor:pointer;box-sizing:border-box;transition:border-color .15s}
      .sel:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
      .btn{padding:9px 18px;border-radius:9px;border:none;cursor:pointer;font:600 13px 'Inter',sans-serif;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
      .btn-p{background:#DB2648;color:#fff}
      .btn-p:hover{background:#B91C3C;transform:translateY(-1px);box-shadow:0 4px 12px rgba(219,38,72,.3)}
      .btn-p:disabled{background:#CBD5E1;cursor:not-allowed;transform:none;box-shadow:none}
      .btn-g{background:#F1F5F9;color:#374151;border:1.5px solid #E8ECF4}
      .btn-g:hover{background:#E8ECF4}
      .btn-d{background:#FFF1F2;color:#DC2626;border:1.5px solid #FECDD3}
      .btn-d:hover{background:#FFE4E6}
      .btn-sm{padding:6px 12px;font-size:12px;border-radius:7px}
      .card{background:#fff;border-radius:16px;border:1px solid #E8ECF4;padding:22px;box-shadow:0 1px 4px rgba(15,23,42,.04)}
      .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font:700 10px 'Inter',sans-serif;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap}
      .tag-sm{padding:2px 8px;font-size:9.5px}
      .nav-btn{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:9px;cursor:pointer;color:rgba(255,255,255,.45);font:500 12.5px 'Inter',sans-serif;border:none;background:transparent;width:100%;text-align:left;transition:all .15s}
      .nav-btn:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.8)}
      .nav-btn.active{background:rgba(219,38,72,.16);color:#fff;border:1px solid rgba(219,38,72,.25)}
      .tr:hover>td{background:#F8FAFC}
      td{transition:background .1s}
      .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;backdrop-filter:blur(3px)}
      .modal{background:#fff;border-radius:20px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,.25);animation:fadeUp .2s ease}
      .page{animation:fadeUp .18s ease}
      .perm-check{cursor:pointer;accent-color:#DB2648;width:14px;height:14px}
      .row-action{opacity:0;transition:opacity .15s}
      tr:hover .row-action{opacity:1}
      input[type=checkbox]{accent-color:#DB2648}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:10px}
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN — Production (no demo shortcuts)
// ─────────────────────────────────────────────────────────────────────────────
function Login() {
  const { login, error } = useAppAuth();
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [busy,setBusy]=useState(false); const [localErr,setLocalErr]=useState("");
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email||!pass) { setLocalErr("Both fields are required."); return; }
    setBusy(true); setLocalErr("");
    try { await login(email.trim().toLowerCase(), pass); }
    catch (err) { setLocalErr(err.message); }
    finally { setBusy(false); }
  };
  const err = localErr || error;
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0F172A,#1E2D42,#111827)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <S/>
      <div style={{width:"100%",maxWidth:900,display:"grid",gridTemplateColumns:"1fr 1fr",borderRadius:24,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,.5)"}}>
        {/* Left */}
        <div style={{background:"linear-gradient(160deg,#DB2648,#7C0A1E)",padding:"52px 44px",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:44}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={26} height={26} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#fff" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:20,color:"#fff",letterSpacing:"1.5px"}}>SURESHIFT</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9.5,color:"rgba(255,255,255,.45)",letterSpacing:"3px",textTransform:"uppercase"}}>ERP Platform v2.0</div>
            </div>
          </div>
          <h1 style={{fontFamily:"'Poppins',sans-serif",fontSize:30,fontWeight:800,color:"#fff",lineHeight:1.25,marginBottom:16}}>End-to-end<br/>Relocation<br/>Management</h1>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"rgba(255,255,255,.6)",lineHeight:1.75,marginBottom:32}}>Enquiry → Survey → Quotation → CFR →<br/>Operations → Invoice. One platform.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12,flex:1}}>
            {[
              {icon:"🔢","text":"Auto doc numbering — SS-ENQ-NDLH-2627-0001"},
              {icon:"👥","text":"8 role types with granular permission control"},
              {icon:"💬","text":"WhatsApp + Email automation at every stage"},
              {icon:"🛡️","text":"Self-hosted on PocketBase — your data, your server"},
            ].map(f=>(
              <div key={f.text} style={{display:"flex",alignItems:"flex-start",gap:11}}>
                <span style={{fontSize:15,lineHeight:1.6,flexShrink:0}}>{f.icon}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"rgba(255,255,255,.7)",lineHeight:1.6}}>{f.text}</span>
              </div>
            ))}
          </div>
          <div style={{paddingTop:28,fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.25)"}}>© 2026 Sure Shift Relocation Services Pvt. Ltd.</div>
        </div>

        {/* Right */}
        <div style={{background:"#fff",padding:"52px 44px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <h2 style={{fontFamily:"'Poppins',sans-serif",fontSize:24,fontWeight:700,color:"#0F172A",marginBottom:6}}>Welcome back</h2>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",marginBottom:32}}>Sign in to your SureShift ERP account</p>
          {err&&<div style={{background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:10,padding:"11px 14px",marginBottom:20,fontFamily:"'Inter',sans-serif",fontSize:13,color:"#DC2626",display:"flex",gap:8,alignItems:"center"}}>
            <span style={{flexShrink:0}}>⚠️</span><span>{err}</span>
          </div>}
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6,letterSpacing:".3px"}}>EMAIL ADDRESS</label>
              <input className="li" type="email" value={email} onChange={e=>{setEmail(e.target.value);setLocalErr("");}} placeholder="you@sureshift.in" autoFocus/>
            </div>
            <div style={{marginBottom:28}}>
              <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6,letterSpacing:".3px"}}>PASSWORD</label>
              <input className="li" type="password" value={pass} onChange={e=>{setPass(e.target.value);setLocalErr("");}} placeholder="Enter your password"/>
            </div>
            <button type="submit" disabled={busy} className="btn btn-p" style={{width:"100%",padding:"13px",fontSize:15,borderRadius:12,justifyContent:"center"}}>
              {busy?<><Spin s={16}/>Signing in…</>:"Sign In →"}
            </button>
          </form>
          <div style={{marginTop:28,padding:"14px 16px",background:"#F8FAFC",borderRadius:10,border:"1px solid #E8ECF4"}}>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#64748B",lineHeight:1.7}}>
              <strong style={{color:"#0F172A"}}>First time setup?</strong><br/>
              Create the super admin account by running:<br/>
              <code style={{fontFamily:"monospace",fontSize:11,background:"#E8ECF4",padding:"2px 6px",borderRadius:4,display:"inline-block",marginTop:4}}>
                docker exec pocketbase-sureshift /pb/pocketbase superuser upsert admin@sureshift.in RaViGo1140
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  NAV CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { section:"OVERVIEW", items:[
    {id:"dashboard", label:"Dashboard",  icon:"◼"},
  ]},
  { section:"CRM", items:[
    {id:"enquiries",  label:"Enquiries",  icon:"📥"},
    {id:"surveys",    label:"Surveys",    icon:"📋"},
    {id:"quotations", label:"Quotations", icon:"📄"},
  ]},
  { section:"OPERATIONS", items:[
    {id:"bookings",   label:"Bookings / CFR", icon:"📦"},
    {id:"operations", label:"Operations",     icon:"🚛"},
    {id:"invoices",   label:"Invoices",       icon:"💳"},
  ]},
  { section:"MANAGEMENT", items:[
    {id:"vendors",  label:"Vendors",  icon:"🤝"},
    {id:"users",    label:"Users",    icon:"👥"},
    {id:"settings", label:"Settings", icon:"⚙️"},
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
//  SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Shell() {
  const {user,logout}=useAppAuth();
  const [nav,setNav]=useState("dashboard");
  const r=ROLES[user?.role]||{};
  const allItems=NAV_SECTIONS.flatMap(s=>s.items);
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#F7F9FC"}}>
      <S/>
      {/* Sidebar */}
      <div style={{width:240,background:"#0F172A",display:"flex",flexDirection:"column",flexShrink:0,animation:"slideIn .25s ease"}}>
        {/* Logo */}
        <div style={{padding:"24px 20px 18px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(219,38,72,.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={20} height={20} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:15.5,color:"#fff",letterSpacing:"1px"}}>SURESHIFT</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:"2px",textTransform:"uppercase"}}>ERP v2.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"12px 10px",overflowY:"auto"}}>
          {NAV_SECTIONS.map(sec=>(
            <div key={sec.section} style={{marginBottom:18}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:"1.8px",textTransform:"uppercase",padding:"0 10px 7px"}}>{sec.section}</div>
              {sec.items.map(n=>(
                <button key={n.id} className={`nav-btn${nav===n.id?" active":""}`} onClick={()=>setNav(n.id)}>
                  <span style={{fontSize:13,width:16,textAlign:"center",flexShrink:0}}>{n.icon}</span>
                  <span style={{flex:1}}>{n.label}</span>
                  {nav===n.id&&<span style={{width:5,height:5,borderRadius:"50%",background:"#DB2648",flexShrink:0}}/>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div style={{padding:"12px 10px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",background:"rgba(255,255,255,.04)",borderRadius:11,marginBottom:9}}>
            <div style={{width:36,height:36,borderRadius:9,background:`${r.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{r.icon}</div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name}</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,color:"rgba(255,255,255,.3)"}}>{r.label}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-sm" style={{width:"100%",justifyContent:"center",background:"rgba(219,38,72,.1)",color:"#FB7185",border:"1px solid rgba(219,38,72,.18)",fontFamily:"'Inter',sans-serif"}}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{background:"#fff",borderBottom:"1px solid #E8ECF4",padding:"0 28px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 3px rgba(15,23,42,.04)"}}>
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A"}}>
            {allItems.find(n=>n.id===nav)?.icon}&nbsp;{allItems.find(n=>n.id===nav)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#94A3B8"}}>FY {FY}</span>
            <span className="tag" style={{background:`${r.color}12`,color:r.color}}>{r.icon} {r.label}</span>
            <span className="tag" style={{background:"rgba(15,23,42,.06)",color:"#475569"}}>{user?.branch||"—"}</span>
          </div>
        </div>

        {/* Page */}
        <div style={{flex:1,overflow:"auto",padding:"24px 28px"}}>
          {nav==="dashboard"  && <DashboardPage/>}
          {nav==="enquiries"  && <EnquiriesPage/>}
          {nav==="surveys"    && <SurveysPage/>}
          {nav==="quotations" && <QuotationsPage/>}
          {nav==="bookings"   && <BookingsPage/>}
          {nav==="operations" && <OperationsPage/>}
          {nav==="invoices"   && <InvoicesPage/>}
          {nav==="vendors"    && <VendorsPage/>}
          {nav==="users"      && <UsersPage/>}
          {nav==="settings"   && <SettingsPage/>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Spin({s=22}){return <div style={{width:s,height:s,border:`2.5px solid rgba(255,255,255,.3)`,borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;}
function Loader(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:56}}><div style={{width:30,height:30,border:"3px solid rgba(219,38,72,.15)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .75s linear infinite"}}/></div>;}
function Empty({icon="📭",text="No records found",sub}){return <div style={{textAlign:"center",padding:"52px 20px"}}><div style={{fontSize:34,marginBottom:10}}>{icon}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:600,color:"#64748B"}}>{text}</div>{sub&&<div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#94A3B8",marginTop:5}}>{sub}</div>}</div>;}

const SC={
  new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626",
  pending:"#D97706",assigned:"#2563EB",scheduled:"#7C3AED","in-progress":"#0D9488",completed:"#059669","report-filed":"#059669",
  draft:"#94A3B8",sent:"#2563EB",viewed:"#D97706",negotiating:"#7C3AED",approved:"#059669",converted:"#059669",
  "token-pending":"#D97706","token-received":"#059669",confirmed:"#2563EB","vendor-assigned":"#7C3AED","ops-ready":"#0D9488","in-transit":"#DB2648",delivered:"#059669",cancelled:"#DC2626",
  "dispatch-mat":"#D97706",packing:"#7C3AED",loading:"#2563EB",unloading:"#0D9488",
  partial:"#D97706",paid:"#059669",overdue:"#DC2626",
  active:"#059669",inactive:"#94A3B8",suspended:"#DC2626",
  open:"#2563EB",resolved:"#059669",closed:"#94A3B8",
  vehicle_vendor:"#0284C7",manpower_vendor:"#7C3AED",
  low:"#94A3B8",medium:"#D97706",high:"#DB2648",critical:"#DC2626",
  household:"#2563EB",office:"#7C3AED",international:"#059669",vehicle:"#D97706",bike:"#0D9488",storage:"#0284C7",commercial:"#DB2648",courier:"#94A3B8",
  website:"#2563EB",gmb:"#D97706",phone:"#0D9488",whatsapp:"#059669",reference:"#7C3AED",
};
function T({v,sm}){const c=SC[v]||"#94A3B8";return <span className={`tag${sm?" tag-sm":""}`} style={{background:`${c}13`,color:c}}>{v}</span>;}

function Modal({title,sub,onClose,children,size=520}){
  return(
    <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal" style={{maxWidth:size}}>
        <div style={{padding:"22px 26px",borderBottom:"1px solid #E8ECF4",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
          <div>
            <h3 style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#0F172A",margin:0}}>{title}</h3>
            {sub&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#64748B",marginTop:3}}>{sub}</p>}
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,color:"#94A3B8",cursor:"pointer",flexShrink:0,lineHeight:1,padding:"2px 4px",borderRadius:6,transition:"background .15s"}} onMouseEnter={e=>e.target.style.background="#F1F5F9"} onMouseLeave={e=>e.target.style.background="none"}>×</button>
        </div>
        <div style={{padding:"22px 26px"}}>{children}</div>
      </div>
    </div>
  );
}

function Fld({label,req,children,span2}){
  return(
    <div style={{gridColumn:span2?"1/-1":"auto"}}>
      <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#64748B",marginBottom:5,textTransform:"uppercase",letterSpacing:".6px"}}>
        {label}{req&&<span style={{color:"#DB2648"}}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Grid2({children,gap=14}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap}}>{children}</div>;}

function BtnRow({onCancel,onSave,saving,saveLabel="Save"}){
  return(
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:16,borderTop:"1px solid #F1F5F9",marginTop:16}}>
      <button className="btn btn-g" onClick={onCancel}>Cancel</button>
      <button className="btn btn-p" onClick={onSave} disabled={saving}>{saving?<><Spin/>Saving…</>:saveLabel}</button>
    </div>
  );
}

function PageHdr({title,count,action}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"baseline",gap:10}}>
        <span style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#0F172A"}}>{title}</span>
        {count!=null&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#94A3B8",fontWeight:600}}>{count} records</span>}
      </div>
      {action}
    </div>
  );
}

function Table({cols,rows,loading,empty="No records",emptySub}){
  if(loading) return <Loader/>;
  if(!rows?.length) return <Empty text={empty} sub={emptySub}/>;
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"2px solid #E8ECF4"}}>
            {cols.map(c=><th key={c.k} style={{padding:"9px 14px",textAlign:"left",fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".7px",whiteSpace:"nowrap"}}>{c.l}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={row.id||i} className="tr" style={{borderBottom:"1px solid #F1F5F9"}}>
              {cols.map(c=><td key={c.k} style={{padding:"11px 14px",fontFamily:"'Inter',sans-serif",fontSize:13,color:"#374151",whiteSpace:c.wrap?"normal":"nowrap"}}>{c.r?c.r(row):row[c.k]??<span style={{color:"#CBD5E1"}}>—</span>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({label,value,sub,color="#DB2648",icon,trend}){
  return(
    <div className="card">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}10`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21}}>{icon}</div>
        {trend&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:trend>0?"#059669":"#DC2626"}}>{trend>0?"↑":"↓"}{Math.abs(trend)}%</span>}
      </div>
      <div style={{fontFamily:"'Poppins',sans-serif",fontSize:28,fontWeight:800,color:"#0F172A",lineHeight:1,marginBottom:5}}>{value}</div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#94A3B8",fontWeight:500}}>{label}</div>
      {sub&&<div style={{marginTop:6}}><span className="tag tag-sm" style={{background:`${color}10`,color}}>{sub}</span></div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage(){
  const {user}=useAppAuth();
  const {items:enqs,loading:eL}=useCollection("enquiries",{sort:"-created",perPage:200});
  const {items:cfrs,loading:cL}=useCollection("cfr",{sort:"-created",perPage:200});
  const {items:invs,loading:iL}=useCollection("invoices",{sort:"-created",perPage:200});
  const {items:vens,loading:vL}=useCollection("vendors",{sort:"-created"});
  const {items:usrs,loading:uL}=useCollection("users",{sort:"-created"});

  const stats={
    enqs: enqs.length,
    newEnqs: enqs.filter(e=>e.stage==="new").length,
    openCFR: cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).length,
    outstanding: invs.reduce((s,i)=>s+(i.outstanding||0),0),
    activeVen: vens.filter(v=>v.status==="active").length,
    activeUsers: usrs.filter(u=>u.status==="active").length,
    totalRev: cfrs.reduce((s,c)=>s+(c.grand_total||0),0),
    collected: cfrs.reduce((s,c)=>s+(c.total_paid||0),0),
  };

  const stageCount=ENQ_STAGES.map(s=>({s,n:enqs.filter(e=>e.stage===s).length}));

  return(
    <div className="page">
      {/* Greeting */}
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:700,color:"#0F172A"}}>Good {hour()}, {user?.name?.split(" ")[0]} 👋</h2>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",marginTop:3}}>Here's your SureShift ERP overview for today.</p>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <Stat label="Total Enquiries"   value={eL?"…":stats.enqs}          sub={`${stats.newEnqs} new`}       icon="📥" color="#2563EB"/>
        <Stat label="Active Bookings"   value={cL?"…":stats.openCFR}        sub="in progress"                  icon="📦" color="#D97706"/>
        <Stat label="Total Revenue"     value={cL?"…":`₹${fmt(stats.totalRev)}`} sub={`₹${fmt(stats.collected)} collected`} icon="💰" color="#059669"/>
        <Stat label="Outstanding"       value={iL?"…":`₹${fmt(stats.outstanding)}`} sub="pending payment" icon="💳" color="#DB2648"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <Stat label="Active Vendors" value={vL?"…":stats.activeVen}    sub="registered" icon="🤝" color="#0D9488"/>
        <Stat label="Active Users"   value={uL?"…":stats.activeUsers}  sub="all branches" icon="👥" color="#7C3AED"/>
        <Stat label="Branches"       value={BRANCHES.length}           sub="operational" icon="🏢" color="#0284C7"/>
        <Stat label="Current FY"     value={FY}                        sub="financial year" icon="📅" color="#D97706"/>
      </div>

      {/* Pipeline + Recent */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16}}>
        {/* Enquiry pipeline */}
        <div className="card">
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A",marginBottom:16}}>📊 Enquiry Pipeline</div>
          {eL?<Loader/>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {stageCount.map(({s,n})=>{
              const c=SC[s]||"#94A3B8";
              const pct=stats.enqs?Math.round(n/stats.enqs*100):0;
              return(
                <div key={s}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,fontWeight:600,color:"#374151",textTransform:"capitalize"}}>{s}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#94A3B8",fontWeight:600}}>{n} <span style={{color:`${c}`}}>({pct}%)</span></span>
                  </div>
                  <div style={{height:6,background:"#F1F5F9",borderRadius:20,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:20,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>}
        </div>

        {/* Recent bookings */}
        <div className="card">
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A",marginBottom:16}}>📦 Recent Bookings</div>
          <Table loading={cL} rows={cfrs.slice(0,6)} empty="No bookings yet" cols={[
            {k:"cfr_number",l:"CFR #"},
            {k:"grand_total",l:"Value",r:r=><strong>₹{(r.grand_total||0).toLocaleString("en-IN")}</strong>},
            {k:"move_date",l:"Date"},
            {k:"status",l:"Status",r:r=><T v={r.status}/>},
          ]}/>
        </div>
      </div>
    </div>
  );
}
function hour(){const h=new Date().getHours();return h<12?"morning":h<17?"afternoon":"evening";}
function fmt(n){if(n>=10000000)return(n/10000000).toFixed(1)+"Cr";if(n>=100000)return(n/100000).toFixed(1)+"L";if(n>=1000)return(n/1000).toFixed(0)+"K";return String(n);}

// ─────────────────────────────────────────────────────────────────────────────
//  USERS + PERMISSION MANAGER (Super Admin core feature)
// ─────────────────────────────────────────────────────────────────────────────
function UsersPage(){
  const {items,loading,refresh}=useCollection("users",{sort:"-created",perPage:200});
  const {update,remove,loading:saving}=useMutation("users");
  const [showCreate,setShowCreate]=useState(false);
  const [permUser,setPermUser]=useState(null);   // user being edited in perm modal
  const [editUser,setEditUser]=useState(null);
  const [delUser,setDelUser]=useState(null);
  const [search,setSearch]=useState("");
  const [roleF,setRoleF]=useState("");

  const filtered=items.filter(u=>{
    const q=search.toLowerCase();
    return(!q||u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q))&&(!roleF||u.role===roleF);
  });

  const handleDelete=async()=>{
    try{await remove(delUser.id);setDelUser(null);refresh();}catch(e){alert(e.message);}
  };

  const handleToggleStatus=async(u)=>{
    const next=u.status==="active"?"inactive":"active";
    try{await update(u.id,{status:next});refresh();}catch(e){alert(e.message);}
  };

  return(
    <div className="page">
      <PageHdr
        title="User Management"
        count={filtered.length}
        action={
          <div style={{display:"flex",gap:10}}>
            <input className="inp" style={{width:210}} placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="sel" style={{width:160}} value={roleF} onChange={e=>setRoleF(e.target.value)}>
              <option value="">All Roles</option>
              {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <button className="btn btn-p" onClick={()=>setShowCreate(true)}>+ New User</button>
          </div>
        }
      />

      {/* Role summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {Object.entries(ROLES).slice(0,4).map(([k,v])=>{
          const cnt=items.filter(u=>u.role===k).length;
          return(
            <div key={k} className="card" style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setRoleF(roleF===k?"":k)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:18}}>{v.icon}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,fontWeight:700,color:"#475569"}}>{v.label}</span>
              </div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:800,color:v.color}}>{cnt}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <Table loading={loading} rows={filtered} empty="No users found" emptySub="Create your first user using the button above" cols={[
          {k:"name",l:"Name",r:u=>(
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:`${ROLES[u.role]?.color||"#94A3B8"}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{ROLES[u.role]?.icon||"👤"}</div>
              <div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,color:"#0F172A"}}>{u.name}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#94A3B8"}}>{u.email}</div>
              </div>
            </div>
          )},
          {k:"phone",l:"Phone"},
          {k:"role",l:"Role",r:u=>{const rv=ROLES[u.role]||{};return <span className="tag" style={{background:`${rv.color||"#94A3B8"}12`,color:rv.color||"#94A3B8"}}>{rv.icon} {rv.label}</span>;}},
          {k:"branch",l:"Branch"},
          {k:"status",l:"Status",r:u=><T v={u.status}/>},
          {k:"actions",l:"Actions",r:u=>(
            <div style={{display:"flex",gap:6}}>
              <button className="btn btn-sm btn-g" onClick={()=>setPermUser(u)} title="Manage permissions">🔑 Permissions</button>
              <button className="btn btn-sm btn-g" onClick={()=>setEditUser(u)} title="Edit user">✏️</button>
              <button className="btn btn-sm" style={{padding:"5px 10px",borderRadius:7,border:"none",cursor:"pointer",background:u.status==="active"?"#FFF7ED":"#F0FDF4",color:u.status==="active"?"#D97706":"#059669",fontSize:11,fontWeight:600}}
                onClick={()=>handleToggleStatus(u)} title={u.status==="active"?"Deactivate":"Activate"}>
                {u.status==="active"?"Deactivate":"Activate"}
              </button>
              <button className="btn btn-sm btn-d" onClick={()=>setDelUser(u)} title="Delete user">🗑️</button>
            </div>
          )},
        ]}/>
      </div>

      {showCreate && <CreateUserModal onClose={()=>setShowCreate(false)} onDone={()=>{setShowCreate(false);refresh();}}/>}
      {editUser   && <EditUserModal user={editUser} onClose={()=>setEditUser(null)} onDone={()=>{setEditUser(null);refresh();}}/>}
      {permUser   && <PermissionsModal user={permUser} onClose={()=>setPermUser(null)} onDone={()=>{setPermUser(null);refresh();}}/>}
      {delUser    && (
        <Modal title="Delete User?" sub={`This will permanently delete "${delUser.name}". This cannot be undone.`} onClose={()=>setDelUser(null)}>
          <div style={{padding:"8px 0",display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="btn btn-g" onClick={()=>setDelUser(null)}>Cancel</button>
            <button className="btn btn-d" onClick={handleDelete}>Delete Permanently</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateUserModal({onClose,onDone}){
  const [f,setF]=useState({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const save=async()=>{
    if(!f.email||!f.password||!f.name){setErr("Name, email and password are required.");return;}
    if(f.password.length<8){setErr("Password must be at least 8 characters.");return;}
    setSaving(true);setErr("");
    try{
      const perms=ROLE_DEFAULT_PERMISSIONS[f.role]||{};
      await pb.collection("users").create({...f,passwordConfirm:f.password,emailVisibility:true,verified:true,permissions:perms});
      onDone();
    }catch(e){setErr(e.message||"Failed to create user.");}
    finally{setSaving(false);}
  };
  return(
    <Modal title="Create New User" sub="User will receive role-based default permissions. You can customize them after creation." onClose={onClose} size={580}>
      {err&&<ErrBox msg={err}/>}
      <Grid2>
        <Fld label="Full Name" req><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Full name"/></Fld>
        <Fld label="Phone"><input className="inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+91 9XXXXXXXXX"/></Fld>
        <Fld label="Email" req><input className="inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="user@sureshift.in"/></Fld>
        <Fld label="Password" req><input className="inp" type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder="Min 8 characters"/></Fld>
        <Fld label="Role">
          <select className="sel" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>
            {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </Fld>
        <Fld label="Branch">
          <select className="sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>
            {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </Fld>
      </Grid2>
      {f.role&&<div style={{marginTop:14,padding:"11px 14px",background:"rgba(37,99,235,.05)",borderRadius:9,border:"1px solid rgba(37,99,235,.12)"}}>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#2563EB",fontWeight:600,marginBottom:4}}>ℹ️ Default permissions for {ROLES[f.role]?.label}</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#475569"}}>{ROLES[f.role]?.desc}. Permissions can be customized after creation using the 🔑 button.</div>
      </div>}
      <BtnRow onCancel={onClose} onSave={save} saving={saving} saveLabel="Create User"/>
    </Modal>
  );
}

function EditUserModal({user,onClose,onDone}){
  const [f,setF]=useState({name:user.name||"",phone:user.phone||"",role:user.role||"sales_exec",branch:user.branch||"NDLH",status:user.status||"active"});
  const {update,loading:saving}=useMutation("users");
  const [err,setErr]=useState("");
  const save=async()=>{
    if(!f.name){setErr("Name is required.");return;}
    setErr("");
    try{await update(user.id,f);onDone();}catch(e){setErr(e.message);}
  };
  return(
    <Modal title="Edit User" sub={user.email} onClose={onClose} size={540}>
      {err&&<ErrBox msg={err}/>}
      <Grid2>
        <Fld label="Full Name" req><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Fld>
        <Fld label="Phone"><input className="inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Fld>
        <Fld label="Role"><select className="sel" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld>
        <Fld label="Branch"><select className="sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Fld>
        <Fld label="Status"><select className="sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></Fld>
      </Grid2>
      <BtnRow onCancel={onClose} onSave={save} saving={saving} saveLabel="Save Changes"/>
    </Modal>
  );
}

function PermissionsModal({user,onClose,onDone}){
  const {update,loading:saving}=useMutation("users");
  const [perms,setPerms]=useState(()=>{
    const base=JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS[user.role]||{}));
    if(user.permissions&&Object.keys(user.permissions).length>0) return JSON.parse(JSON.stringify(user.permissions));
    return base;
  });
  const [activeRole,setActiveRole]=useState(user.role);

  const toggle=(mod,action)=>{
    setPerms(prev=>{
      const next={...prev,[mod]:[...(prev[mod]||[])]};
      if(next[mod].includes(action)) next[mod]=next[mod].filter(a=>a!==action);
      else next[mod]=[...next[mod],action];
      return next;
    });
  };

  const toggleModule=(mod,allActions)=>{
    setPerms(prev=>{
      const has=allActions.every(a=>(prev[mod]||[]).includes(a));
      return {...prev,[mod]:has?[]:allActions};
    });
  };

  const applyPreset=(role)=>{
    setActiveRole(role);
    setPerms(JSON.parse(JSON.stringify(ROLE_DEFAULT_PERMISSIONS[role]||{})));
  };

  const save=async()=>{
    try{await update(user.id,{permissions:perms});onDone();}catch(e){alert(e.message);}
  };

  const r=ROLES[user.role]||{};
  return(
    <Modal title={`Permissions — ${user.name}`} sub={`Logged role: ${r.icon} ${r.label} · Customize module access below`} onClose={onClose} size={680}>
      {/* Quick preset */}
      <div style={{marginBottom:18}}>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".6px",marginBottom:8}}>Quick Preset</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {Object.entries(ROLES).map(([k,v])=>(
            <button key={k} onClick={()=>applyPreset(k)} className="btn btn-sm" style={{background:activeRole===k?`${v.color}15`:"#F8FAFC",color:activeRole===k?v.color:"#475569",border:`1.5px solid ${activeRole===k?v.color+"40":"#E8ECF4"}`,fontFamily:"'Inter',sans-serif"}}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Permission matrix */}
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:380,overflowY:"auto",paddingRight:4}}>
        {Object.entries(MODULE_PERMISSIONS).map(([mod,{label,icon,actions}])=>{
          const modPerms=perms[mod]||[];
          const allChecked=actions.every(a=>modPerms.includes(a));
          const someChecked=actions.some(a=>modPerms.includes(a))&&!allChecked;
          return(
            <div key={mod} style={{border:"1.5px solid #E8ECF4",borderRadius:10,overflow:"hidden"}}>
              {/* Module header */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:allChecked?"rgba(219,38,72,.03)":someChecked?"rgba(37,99,235,.02)":"#FAFAFA",cursor:"pointer"}} onClick={()=>toggleModule(mod,actions)}>
                <input type="checkbox" className="perm-check" checked={allChecked} ref={el=>{if(el)el.indeterminate=someChecked;}} onChange={()=>toggleModule(mod,actions)} onClick={e=>e.stopPropagation()}/>
                <span style={{fontSize:15}}>{icon}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,color:"#0F172A",flex:1}}>{label}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"#94A3B8"}}>{modPerms.length}/{actions.length} allowed</span>
              </div>
              {/* Actions */}
              <div style={{display:"flex",flexWrap:"wrap",gap:0,padding:"8px 14px 10px",borderTop:"1px solid #F1F5F9"}}>
                {actions.map(action=>{
                  const checked=modPerms.includes(action);
                  return(
                    <label key={action} style={{display:"flex",alignItems:"center",gap:6,marginRight:16,marginBottom:6,cursor:"pointer"}}>
                      <input type="checkbox" className="perm-check" checked={checked} onChange={()=>toggle(mod,action)}/>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:checked?"#0F172A":"#94A3B8",fontWeight:checked?600:400,textTransform:"capitalize"}}>{action.replace("_"," ")}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:14,padding:"10px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:9}}>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#92400E"}}>⚠️ Super Admin always has full access regardless of permissions set here. Changes take effect on next login for that user.</p>
      </div>

      <BtnRow onCancel={onClose} onSave={save} saving={saving} saveLabel="Save Permissions"/>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ENQUIRIES
// ─────────────────────────────────────────────────────────────────────────────
function EnquiriesPage(){
  const {user}=useAppAuth();
  const [show,setShow]=useState(false);
  const [q,setQ]=useState(""); const [sf,setSf]=useState(""); const [bf,setBf]=useState("");
  const {items,loading,refresh}=useCollection("enquiries",{sort:"-created",perPage:500});
  const {create,loading:saving}=useMutation("enquiries");
  const initF={name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",move_type:"household",source:"website",stage:"new",branch:user?.branch||"NDLH",fy:FY,seq:"0",apt_size:"",move_date:"",notes:""};
  const [f,setF]=useState(initF);
  const [err,setErr]=useState("");
  const filtered=useMemo(()=>items.filter(e=>{
    const qq=q.toLowerCase();
    return(!qq||(e.name||"").toLowerCase().includes(qq)||(e.phone||"").includes(qq)||(e.enq_number||"").toLowerCase().includes(qq))
      &&(!sf||e.stage===sf)&&(!bf||e.branch===bf);
  }),[items,q,sf,bf]);

  const save=async()=>{
    if(!f.name||!f.phone||!f.from_address||!f.to_address){setErr("Name, phone, from and to address are required.");return;}
    setErr("");
    try{await create(f);setShow(false);setF(initF);refresh();}catch(e){setErr(e.message);}
  };
  return(
    <div className="page">
      <PageHdr title="Enquiries" count={filtered.length} action={
        <div style={{display:"flex",gap:10}}>
          <input className="inp" style={{width:210}} placeholder="Search name, phone, ref…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="sel" style={{width:140}} value={sf} onChange={e=>setSf(e.target.value)}><option value="">All Stages</option>{ENQ_STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <select className="sel" style={{width:120}} value={bf} onChange={e=>setBf(e.target.value)}><option value="">All Branches</option>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select>
          <button className="btn btn-p" onClick={()=>setShow(true)}>+ New Enquiry</button>
        </div>
      }/>
      <div className="card">
        <Table loading={loading} rows={filtered} empty="No enquiries yet" emptySub="Create your first enquiry" cols={[
          {k:"enq_number",l:"Ref #",r:r=><strong style={{fontFamily:"monospace",fontSize:12,color:"#0F172A",letterSpacing:".3px"}}>{r.enq_number||"Pending"}</strong>},
          {k:"name",l:"Customer",r:r=><div><div style={{fontWeight:600,color:"#0F172A"}}>{r.name}</div><div style={{fontSize:11.5,color:"#94A3B8"}}>{r.phone}</div></div>},
          {k:"from_address",l:"From",wrap:true},
          {k:"to_address",l:"To",wrap:true},
          {k:"move_type",l:"Type",r:r=><T v={r.move_type}/>},
          {k:"source",l:"Source",r:r=><T v={r.source}/>},
          {k:"branch",l:"Branch"},
          {k:"move_date",l:"Move Date"},
          {k:"stage",l:"Stage",r:r=><T v={r.stage}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Enquiry" onClose={()=>{setShow(false);setErr("");}} size={660}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="Customer Name" req><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Full name"/></Fld>
          <Fld label="Phone" req><input className="inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+91 9XXXXXXXXX"/></Fld>
          <Fld label="Alternate Phone"><input className="inp" value={f.alt_phone} onChange={e=>setF({...f,alt_phone:e.target.value})} placeholder="Optional"/></Fld>
          <Fld label="Email"><input className="inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="customer@email.com"/></Fld>
          <Fld label="From Address" req><input className="inp" value={f.from_address} onChange={e=>setF({...f,from_address:e.target.value})} placeholder="Pickup address"/></Fld>
          <Fld label="To Address" req><input className="inp" value={f.to_address} onChange={e=>setF({...f,to_address:e.target.value})} placeholder="Drop address"/></Fld>
          <Fld label="Move Type"><select className="sel" value={f.move_type} onChange={e=>setF({...f,move_type:e.target.value})}>{MOVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></Fld>
          <Fld label="Source"><select className="sel" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
          <Fld label="Branch"><select className="sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Fld>
          <Fld label="Move Date"><input className="inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Fld>
          <Fld label="Apt / Property Size"><input className="inp" value={f.apt_size} onChange={e=>setF({...f,apt_size:e.target.value})} placeholder="e.g. 2BHK, 1200 sqft"/></Fld>
        </Grid2>
        <div style={{marginTop:14}}><Fld label="Notes" span2><textarea className="inp" rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Any additional notes or special requirements" style={{resize:"vertical"}}/></Fld></div>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Enquiry"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SURVEYS
// ─────────────────────────────────────────────────────────────────────────────
function SurveysPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("surveys",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("surveys");
  const SS=["pending","assigned","scheduled","in-progress","completed","report-filed"];
  const init={enquiry_id:"",agent_name:"",survey_date:"",survey_time:"",floor:"",has_lift:false,distance:"",condition:"",agent_notes:"",status:"pending"};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const save=async()=>{if(!f.enquiry_id){setErr("Enquiry ID is required.");return;}setErr("");try{await create(f);setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Surveys" count={items.length} action={<button className="btn btn-p" onClick={()=>setShow(true)}>+ New Survey</button>}/>
      <div className="card">
        <Table loading={loading} rows={items} empty="No surveys yet" cols={[
          {k:"survey_number",l:"Survey #",r:r=><strong style={{fontFamily:"monospace",fontSize:12}}>{r.survey_number||"Pending"}</strong>},
          {k:"enquiry_id",l:"Enquiry"},
          {k:"agent_name",l:"Agent"},
          {k:"survey_date",l:"Date"},
          {k:"survey_time",l:"Time"},
          {k:"floor",l:"Floor"},
          {k:"has_lift",l:"Lift",r:r=>r.has_lift?<span style={{color:"#059669",fontWeight:700}}>✓ Yes</span>:<span style={{color:"#DC2626"}}>✗ No</span>},
          {k:"distance",l:"Distance"},
          {k:"status",l:"Status",r:r=><T v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Survey" onClose={()=>{setShow(false);setErr("");}} size={580}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="Enquiry ID" req><input className="inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></Fld>
          <Fld label="Agent / Surveyor"><input className="inp" value={f.agent_name} onChange={e=>setF({...f,agent_name:e.target.value})} placeholder="Surveyor name"/></Fld>
          <Fld label="Survey Date"><input className="inp" type="date" value={f.survey_date} onChange={e=>setF({...f,survey_date:e.target.value})}/></Fld>
          <Fld label="Survey Time"><input className="inp" type="time" value={f.survey_time} onChange={e=>setF({...f,survey_time:e.target.value})}/></Fld>
          <Fld label="Floor Number"><input className="inp" type="number" value={f.floor} onChange={e=>setF({...f,floor:e.target.value})} placeholder="0 = ground"/></Fld>
          <Fld label="Has Lift"><select className="sel" value={f.has_lift} onChange={e=>setF({...f,has_lift:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Fld>
          <Fld label="Distance (km)"><input className="inp" value={f.distance} onChange={e=>setF({...f,distance:e.target.value})} placeholder="e.g. 450 km"/></Fld>
          <Fld label="Status"><select className="sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
        </Grid2>
        <div style={{marginTop:14}}><Fld label="Agent Notes" span2><textarea className="inp" rows={2} value={f.agent_notes} onChange={e=>setF({...f,agent_notes:e.target.value})} style={{resize:"vertical"}}/></Fld></div>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Survey"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUOTATIONS
// ─────────────────────────────────────────────────────────────────────────────
function QuotationsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("quotations",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("quotations");
  const SS=["draft","sent","viewed","negotiating","approved","recalling","converted","lost"];
  const init={enquiry_id:"",subtotal:"",discount_pct:"0",tax_amt:"",grand_total:"",valid_days:"7",move_date:"",notes:"",status:"draft",revisions:0,base_id:"",quot_number:""};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const save=async()=>{if(!f.enquiry_id||!f.grand_total){setErr("Enquiry ID and grand total are required.");return;}setErr("");try{await create({...f,subtotal:+f.subtotal,discount_pct:+f.discount_pct,tax_amt:+f.tax_amt,grand_total:+f.grand_total,valid_days:+f.valid_days});setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Quotations" count={items.length} action={<button className="btn btn-p" onClick={()=>setShow(true)}>+ New Quotation</button>}/>
      <div className="card">
        <Table loading={loading} rows={items} empty="No quotations yet" cols={[
          {k:"quot_number",l:"Quot #",r:r=><strong style={{fontFamily:"monospace",fontSize:12}}>{r.quot_number||"Pending"}</strong>},
          {k:"enquiry_id",l:"Enquiry"},
          {k:"subtotal",l:"Subtotal",r:r=>`₹${(r.subtotal||0).toLocaleString("en-IN")}`},
          {k:"discount_pct",l:"Disc",r:r=>`${r.discount_pct||0}%`},
          {k:"tax_amt",l:"Tax",r:r=>`₹${(r.tax_amt||0).toLocaleString("en-IN")}`},
          {k:"grand_total",l:"Total",r:r=><strong style={{color:"#0F172A"}}>₹{(r.grand_total||0).toLocaleString("en-IN")}</strong>},
          {k:"valid_days",l:"Valid",r:r=>`${r.valid_days||0}d`},
          {k:"move_date",l:"Move Date"},
          {k:"status",l:"Status",r:r=><T v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Quotation" onClose={()=>{setShow(false);setErr("");}} size={600}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="Enquiry ID" req><input className="inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></Fld>
          <Fld label="Status"><select className="sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
          <Fld label="Subtotal (₹)"><input className="inp" type="number" value={f.subtotal} onChange={e=>setF({...f,subtotal:e.target.value})} placeholder="0"/></Fld>
          <Fld label="Discount %"><input className="inp" type="number" value={f.discount_pct} onChange={e=>setF({...f,discount_pct:e.target.value})} placeholder="0"/></Fld>
          <Fld label="Tax Amount (₹)"><input className="inp" type="number" value={f.tax_amt} onChange={e=>setF({...f,tax_amt:e.target.value})} placeholder="0"/></Fld>
          <Fld label="Grand Total (₹)" req><input className="inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})} placeholder="0"/></Fld>
          <Fld label="Valid Days"><input className="inp" type="number" value={f.valid_days} onChange={e=>setF({...f,valid_days:e.target.value})}/></Fld>
          <Fld label="Move Date"><input className="inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Fld>
        </Grid2>
        <div style={{marginTop:14}}><Fld label="Notes" span2><textarea className="inp" rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} style={{resize:"vertical"}}/></Fld></div>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Quotation"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOOKINGS / CFR
// ─────────────────────────────────────────────────────────────────────────────
function BookingsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("cfr",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("cfr");
  const SS=["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"];
  const init={enquiry_id:"",quotation_id:"",grand_total:"",token_amt:"",move_date:"",vehicle:"",vehicle_no:"",is_interstate:false,status:"token-pending"};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const save=async()=>{if(!f.enquiry_id||!f.grand_total){setErr("Enquiry ID and grand total are required.");return;}setErr("");try{await create({...f,grand_total:+f.grand_total,token_amt:+f.token_amt,total_paid:0});setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Bookings / CFR" count={items.length} action={<button className="btn btn-p" onClick={()=>setShow(true)}>+ New Booking</button>}/>
      <div className="card">
        <Table loading={loading} rows={items} empty="No bookings yet" cols={[
          {k:"cfr_number",l:"CFR #",r:r=><strong style={{fontFamily:"monospace",fontSize:12}}>{r.cfr_number||"Pending"}</strong>},
          {k:"enquiry_id",l:"Enquiry"},
          {k:"grand_total",l:"Value",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
          {k:"token_amt",l:"Token",r:r=>`₹${(r.token_amt||0).toLocaleString("en-IN")}`},
          {k:"total_paid",l:"Paid",r:r=>`₹${(r.total_paid||0).toLocaleString("en-IN")}`},
          {k:"move_date",l:"Move Date"},
          {k:"vehicle",l:"Vehicle"},
          {k:"vehicle_no",l:"Reg No"},
          {k:"is_interstate",l:"Interstate",r:r=>r.is_interstate?<span style={{color:"#059669",fontWeight:700}}>✓ Yes</span>:<span style={{color:"#94A3B8"}}>No</span>},
          {k:"status",l:"Status",r:r=><T v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Booking (CFR)" onClose={()=>{setShow(false);setErr("");}} size={600}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="Enquiry ID" req><input className="inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></Fld>
          <Fld label="Quotation ID" req><input className="inp" value={f.quotation_id} onChange={e=>setF({...f,quotation_id:e.target.value})} placeholder="Quotation record ID"/></Fld>
          <Fld label="Grand Total (₹)" req><input className="inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})}/></Fld>
          <Fld label="Token Amount (₹)"><input className="inp" type="number" value={f.token_amt} onChange={e=>setF({...f,token_amt:e.target.value})}/></Fld>
          <Fld label="Move Date"><input className="inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Fld>
          <Fld label="Vehicle Type"><input className="inp" value={f.vehicle} onChange={e=>setF({...f,vehicle:e.target.value})} placeholder="e.g. 20ft container"/></Fld>
          <Fld label="Vehicle Reg No"><input className="inp" value={f.vehicle_no} onChange={e=>setF({...f,vehicle_no:e.target.value})} placeholder="DL 1C 0000"/></Fld>
          <Fld label="Interstate Move"><select className="sel" value={f.is_interstate} onChange={e=>setF({...f,is_interstate:e.target.value==="true"})}><option value="false">No — Local</option><option value="true">Yes — Interstate</option></select></Fld>
          <Fld label="Status"><select className="sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
        </Grid2>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Booking"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────
function OperationsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("operations",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("operations");
  const SS=["dispatch-mat","packing","loading","in-transit","unloading","delivered"];
  const init={cfr_id:"",bilty_no:"",invoice_no:"",stage:"dispatch-mat"};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const save=async()=>{if(!f.cfr_id){setErr("CFR ID is required.");return;}setErr("");try{await create(f);setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Operations" count={items.length} action={<button className="btn btn-p" onClick={()=>setShow(true)}>+ New Operation</button>}/>
      <div className="card">
        <Table loading={loading} rows={items} empty="No operations yet" cols={[
          {k:"ops_number",l:"Ops #",r:r=><strong style={{fontFamily:"monospace",fontSize:12}}>{r.ops_number||"Pending"}</strong>},
          {k:"cfr_id",l:"CFR"},
          {k:"bilty_no",l:"Bilty #"},
          {k:"invoice_no",l:"Invoice #"},
          {k:"stage",l:"Stage",r:r=><T v={r.stage}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Operation" onClose={()=>{setShow(false);setErr("");}}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="CFR ID" req><input className="inp" value={f.cfr_id} onChange={e=>setF({...f,cfr_id:e.target.value})} placeholder="CFR record ID"/></Fld>
          <Fld label="Stage"><select className="sel" value={f.stage} onChange={e=>setF({...f,stage:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
          <Fld label="Bilty Number"><input className="inp" value={f.bilty_no} onChange={e=>setF({...f,bilty_no:e.target.value})} placeholder="LR / Bilty no."/></Fld>
          <Fld label="Invoice Number"><input className="inp" value={f.invoice_no} onChange={e=>setF({...f,invoice_no:e.target.value})} placeholder="Transport invoice no."/></Fld>
        </Grid2>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Operation"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  INVOICES
// ─────────────────────────────────────────────────────────────────────────────
function InvoicesPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("invoices",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("invoices");
  const SS=["draft","sent","partial","paid","overdue","cancelled"];
  const init={cfr_id:"",grand_total:"",paid_amt:"0",outstanding:"",invoice_date:"",due_date:"",gst_no:"",hsn_code:"998543",status:"draft"};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const save=async()=>{if(!f.cfr_id||!f.grand_total){setErr("CFR ID and grand total are required.");return;}const gt=+f.grand_total,pa=+f.paid_amt;setErr("");try{await create({...f,grand_total:gt,paid_amt:pa,outstanding:gt-pa});setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Invoices" count={items.length} action={<button className="btn btn-p" onClick={()=>setShow(true)}>+ New Invoice</button>}/>
      <div className="card">
        <Table loading={loading} rows={items} empty="No invoices yet" cols={[
          {k:"inv_number",l:"Invoice #",r:r=><strong style={{fontFamily:"monospace",fontSize:12}}>{r.inv_number||"Pending"}</strong>},
          {k:"cfr_id",l:"CFR"},
          {k:"grand_total",l:"Amount",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
          {k:"paid_amt",l:"Paid",r:r=>`₹${(r.paid_amt||0).toLocaleString("en-IN")}`},
          {k:"outstanding",l:"Outstanding",r:r=><strong style={{color:(r.outstanding||0)>0?"#DC2626":"#059669"}}>₹{(r.outstanding||0).toLocaleString("en-IN")}</strong>},
          {k:"invoice_date",l:"Date"},
          {k:"due_date",l:"Due"},
          {k:"gst_no",l:"GST"},
          {k:"hsn_code",l:"HSN"},
          {k:"status",l:"Status",r:r=><T v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Invoice" onClose={()=>{setShow(false);setErr("");}} size={600}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="CFR ID" req><input className="inp" value={f.cfr_id} onChange={e=>setF({...f,cfr_id:e.target.value})} placeholder="CFR record ID"/></Fld>
          <Fld label="Status"><select className="sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Fld>
          <Fld label="Grand Total (₹)" req><input className="inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})}/></Fld>
          <Fld label="Amount Paid (₹)"><input className="inp" type="number" value={f.paid_amt} onChange={e=>setF({...f,paid_amt:e.target.value})}/></Fld>
          <Fld label="Invoice Date"><input className="inp" type="date" value={f.invoice_date} onChange={e=>setF({...f,invoice_date:e.target.value})}/></Fld>
          <Fld label="Due Date"><input className="inp" type="date" value={f.due_date} onChange={e=>setF({...f,due_date:e.target.value})}/></Fld>
          <Fld label="GST Number"><input className="inp" value={f.gst_no} onChange={e=>setF({...f,gst_no:e.target.value})} placeholder="07AABCS1234A1Z1"/></Fld>
          <Fld label="HSN Code"><input className="inp" value={f.hsn_code} onChange={e=>setF({...f,hsn_code:e.target.value})} placeholder="998543"/></Fld>
        </Grid2>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Create Invoice"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VENDORS
// ─────────────────────────────────────────────────────────────────────────────
function VendorsPage(){
  const [show,setShow]=useState(false); const [typeF,setTypeF]=useState("");
  const {items,loading,refresh}=useCollection("vendors",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("vendors");
  const init={name:"",type:"vehicle_vendor",contact:"",phone:"",email:"",gst:"",branch:"NDLH",status:"active",rating:5};
  const [f,setF]=useState(init); const [err,setErr]=useState("");
  const filtered=items.filter(v=>!typeF||v.type===typeF);
  const save=async()=>{if(!f.name||!f.contact){setErr("Vendor name and contact person are required.");return;}setErr("");try{await create({...f,rating:+f.rating});setShow(false);setF(init);refresh();}catch(e){setErr(e.message);}};
  return(
    <div className="page">
      <PageHdr title="Vendors" count={filtered.length} action={
        <div style={{display:"flex",gap:10}}>
          <select className="sel" style={{width:180}} value={typeF} onChange={e=>setTypeF(e.target.value)}>
            <option value="">All Types</option>
            <option value="vehicle_vendor">🚛 Vehicle Vendors</option>
            <option value="manpower_vendor">👷 Manpower Vendors</option>
          </select>
          <button className="btn btn-p" onClick={()=>setShow(true)}>+ Add Vendor</button>
        </div>
      }/>
      <div className="card">
        <Table loading={loading} rows={filtered} empty="No vendors yet" cols={[
          {k:"name",l:"Vendor Name",r:r=><strong style={{color:"#0F172A"}}>{r.name}</strong>},
          {k:"type",l:"Type",r:r=><T v={r.type}/>},
          {k:"contact",l:"Contact"},
          {k:"phone",l:"Phone"},
          {k:"email",l:"Email"},
          {k:"branch",l:"Branch"},
          {k:"rating",l:"Rating",r:r=><span title={`${r.rating||0}/5`}>{"⭐".repeat(Math.min(5,r.rating||0))}</span>},
          {k:"total_jobs",l:"Jobs",r:r=>r.total_jobs||0},
          {k:"pending_payout",l:"Payout",r:r=>`₹${(r.pending_payout||0).toLocaleString("en-IN")}`},
          {k:"status",l:"Status",r:r=><T v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="Add Vendor" onClose={()=>{setShow(false);setErr("");}} size={600}>
        {err&&<ErrBox msg={err}/>}
        <Grid2>
          <Fld label="Vendor Name" req><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Company or individual name"/></Fld>
          <Fld label="Type"><select className="sel" value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="vehicle_vendor">🚛 Vehicle Vendor</option><option value="manpower_vendor">👷 Manpower Vendor</option></select></Fld>
          <Fld label="Contact Person" req><input className="inp" value={f.contact} onChange={e=>setF({...f,contact:e.target.value})} placeholder="Point of contact name"/></Fld>
          <Fld label="Phone"><input className="inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="+91 9XXXXXXXXX"/></Fld>
          <Fld label="Email"><input className="inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="vendor@email.com"/></Fld>
          <Fld label="GST Number"><input className="inp" value={f.gst} onChange={e=>setF({...f,gst:e.target.value})} placeholder="07AABCS1234A1Z1"/></Fld>
          <Fld label="Branch"><select className="sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Fld>
          <Fld label="Initial Rating (1–5)"><input className="inp" type="number" min="1" max="5" value={f.rating} onChange={e=>setF({...f,rating:e.target.value})}/></Fld>
        </Grid2>
        <BtnRow onCancel={()=>{setShow(false);setErr("");}} onSave={save} saving={saving} saveLabel="Add Vendor"/>
      </Modal>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPage(){
  const {settings,saveSetting,user}=useAppAuth();
  const [tab,setTab]=useState("company");
  const co=settings?.company||{};
  const [f,setF]=useState({name:"",gst:"",pan:"",address:"",city:"",state:"",pin:"",phone:"",email:"",website:""});
  const [saved,setSaved]=useState(false);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{
    if(co.name) setF({name:co.name||"",gst:co.gst||"",pan:co.pan||"",address:co.address||"",city:co.city||"",state:co.state||"",pin:co.pin||"",phone:co.phone||"",email:co.email||"",website:co.website||""});
  },[settings]);
  const save=async()=>{setSaving(true);await saveSetting("company",f,"company");setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),3000);};
  const TABS=[{id:"company",l:"🏢 Company"},{id:"security",l:"🔒 Security"},{id:"system",l:"⚙️ System"}];
  return(
    <div className="page">
      <PageHdr title="Settings"/>
      <div style={{display:"flex",gap:8,marginBottom:20,borderBottom:"2px solid #E8ECF4",paddingBottom:0}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 18px",border:"none",background:"transparent",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?"#DB2648":"#64748B",borderBottom:`2.5px solid ${tab===t.id?"#DB2648":"transparent"}`,cursor:"pointer",marginBottom:"-2px",transition:"all .15s"}}>{t.l}</button>)}
      </div>

      {tab==="company"&&(
        <div className="card" style={{maxWidth:660}}>
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:20}}>Company Information</div>
          <Grid2>
            <Fld label="Company Name" req><input className="inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Fld>
            <Fld label="GST Number"><input className="inp" value={f.gst} onChange={e=>setF({...f,gst:e.target.value})} placeholder="07AABCS1234A1Z1"/></Fld>
            <Fld label="PAN Number"><input className="inp" value={f.pan} onChange={e=>setF({...f,pan:e.target.value})} placeholder="AABCS1234A"/></Fld>
            <Fld label="Phone"><input className="inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Fld>
            <Fld label="Email"><input className="inp" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Fld>
            <Fld label="Website"><input className="inp" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/></Fld>
          </Grid2>
          <div style={{marginTop:4}}><Fld label="Registered Address"><textarea className="inp" rows={2} value={f.address} onChange={e=>setF({...f,address:e.target.value})} style={{resize:"vertical"}}/></Fld></div>
          <Grid2 gap={14}>
            <Fld label="City"><input className="inp" value={f.city} onChange={e=>setF({...f,city:e.target.value})}/></Fld>
            <Fld label="State"><input className="inp" value={f.state} onChange={e=>setF({...f,state:e.target.value})}/></Fld>
            <Fld label="PIN Code"><input className="inp" value={f.pin} onChange={e=>setF({...f,pin:e.target.value})}/></Fld>
          </Grid2>
          <div style={{display:"flex",alignItems:"center",gap:14,marginTop:20,paddingTop:16,borderTop:"1px solid #F1F5F9"}}>
            <button className="btn btn-p" onClick={save} disabled={saving}>{saving?<><Spin/>Saving…</>:"Save Changes"}</button>
            {saved&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#059669",fontWeight:600,display:"flex",alignItems:"center",gap:5}}>✅ Saved successfully</span>}
          </div>
        </div>
      )}

      {tab==="security"&&(
        <div className="card" style={{maxWidth:520}}>
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:16}}>Security Settings</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[
              {icon:"🔑",title:"Change Password",desc:"Update your admin account password",btn:"Change"},
              {icon:"📧",title:"Email Notifications",desc:"System alerts and audit logs sent to admin email",btn:"Configure"},
              {icon:"🔐",title:"Two-Factor Auth",desc:"Add extra security layer for super admin login",btn:"Setup"},
              {icon:"📋",title:"Audit Logs",desc:"View all user activity and system changes",btn:"View Logs"},
            ].map(item=>(
              <div key={item.title} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",border:"1.5px solid #E8ECF4",borderRadius:10}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>{item.icon}</span>
                  <div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A"}}>{item.title}</div>
                    <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#94A3B8"}}>{item.desc}</div>
                  </div>
                </div>
                <button className="btn btn-g btn-sm">{item.btn}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="system"&&(
        <div className="card" style={{maxWidth:520}}>
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:16}}>System Information</div>
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {[
              ["Platform","SureShift ERP v2.0"],
              ["Backend","PocketBase v0.36.9"],
              ["Database","SQLite (PocketBase)"],
              ["Current User",user?.name||"—"],
              ["User Role","Super Admin"],
              ["Financial Year",`FY ${FY}`],
              ["Active Branches",BRANCHES.join(", ")],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid #F1F5F9"}}>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#64748B",fontWeight:500}}>{k}</span>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#0F172A",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MISC
// ─────────────────────────────────────────────────────────────────────────────
function ErrBox({msg}){
  return(
    <div style={{background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:9,padding:"10px 14px",marginBottom:16,fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#DC2626",display:"flex",gap:8,alignItems:"flex-start"}}>
      <span style={{flexShrink:0,marginTop:1}}>⚠️</span><span>{msg}</span>
    </div>
  );
}
