import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useCollection, useMutation, useSettings } from "./hooks/useCollection.js";
import pb from "./lib/pb.js";

// ── Context ──────────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
export const useAppAuth = () => useContext(AuthCtx);

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

const BRANCHES = ["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"];
const MOVE_TYPES = ["household","office","international","vehicle","bike","storage","commercial","courier"];
const SOURCES = ["website","gmb","phone","whatsapp","reference"];
const ENQ_STAGES = ["new","survey","quotation","recalling","cfr","lost"];

export function hasPerm(user, module, action) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return (user.permissions?.[module] || []).includes(action);
}

const FY = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return m >= 3 ? `${String(y).slice(-2)}${String(y+1).slice(-2)}` : `${String(y-1).slice(-2)}${String(y).slice(-2)}`;
})();

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const authHook = useAuth();
  const { settings, loading: settingsLoading, save: saveSetting } = useSettings();
  const ctx = {
    ...authHook, settings, settingsLoading, saveSetting,
    ROLES, hasPerm: (mod, action) => hasPerm(authHook.user, mod, action),
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
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0C0F1A"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}>
        <Logo size={36} />
        <div style={{marginTop:20,width:24,height:24,border:"2.5px solid rgba(219,38,72,.3)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"20px auto 0"}}/>
      </div>
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo({ size=28 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
        <path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div>
        <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",fontWeight:800,fontSize:size*0.6,color:"#fff",letterSpacing:"1px",lineHeight:1}}>SURE<span style={{color:"#DB2648"}}>SHIFT</span></div>
        <div style={{fontFamily:"system-ui",fontSize:size*0.27,color:"rgba(255,255,255,.35)",letterSpacing:"2px",textTransform:"uppercase",lineHeight:1.2}}>ERP v2.0</div>
      </div>
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────────
function Login() {
  const { login, error } = useAppAuth();
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [busy,setBusy]=useState(false);
  const [localErr,setLocalErr]=useState("");
  const handleLogin = async (e) => {
    e?.preventDefault();
    if(!email||!pass){setLocalErr("Enter email and password.");return;}
    setBusy(true);setLocalErr("");
    try{await login(email.trim().toLowerCase(),pass);}
    catch(err){setLocalErr(err.message);}
    finally{setBusy(false);}
  };
  const err = localErr||error;
  return (
    <div style={{minHeight:"100vh",background:"#0C0F1A",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .li{width:100%;padding:11px 14px;border:1.5px solid rgba(255,255,255,.1);border-radius:8px;font:400 14px/1 system-ui,sans-serif;color:#fff;outline:none;background:rgba(255,255,255,.06);transition:border-color .15s}
        .li:focus{border-color:#DB2648;}
        .li::placeholder{color:rgba(255,255,255,.25)}
      `}</style>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{marginBottom:36,textAlign:"center"}}><Logo size={32}/></div>
        <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:"32px 28px"}}>
          <h2 style={{fontFamily:"system-ui",fontSize:20,fontWeight:700,color:"#fff",marginBottom:6}}>Welcome back</h2>
          <p style={{fontFamily:"system-ui",fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:24}}>Sign in to SureShift ERP</p>
          {err&&<div style={{background:"rgba(219,38,72,.1)",border:"1px solid rgba(219,38,72,.3)",borderRadius:8,padding:"9px 13px",marginBottom:16,fontSize:12.5,color:"#FB7185",fontFamily:"system-ui"}}>{err}</div>}
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontFamily:"system-ui",fontSize:12,fontWeight:600,color:"rgba(255,255,255,.5)",marginBottom:5}}>EMAIL</label>
              <input className="li" type="email" value={email} onChange={e=>{setEmail(e.target.value);setLocalErr("");}} placeholder="you@sureshift.in"/>
            </div>
            <div style={{marginBottom:22}}>
              <label style={{display:"block",fontFamily:"system-ui",fontSize:12,fontWeight:600,color:"rgba(255,255,255,.5)",marginBottom:5}}>PASSWORD</label>
              <input className="li" type="password" value={pass} onChange={e=>{setPass(e.target.value);setLocalErr("");}} placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={busy} style={{width:"100%",padding:"12px",background:busy?"#4B5563":"#DB2648",color:"#fff",border:"none",borderRadius:9,fontFamily:"system-ui",fontSize:14,fontWeight:700,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:".3px"}}>
              {busy?<><div style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>Signing in…</>:"Sign In →"}
            </button>
          </form>
        </div>
        <p style={{textAlign:"center",marginTop:20,fontFamily:"system-ui",fontSize:11.5,color:"rgba(255,255,255,.2)"}}>© 2026 Sure Shift Relocation Services Pvt. Ltd.</p>
      </div>
    </div>
  );
}

// ── NAV CONFIG ────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  label:"Dashboard",   icon:"⬛", roles:["*"] },
  { id:"enquiries",  label:"Enquiries",   icon:"📥", roles:["super_admin","branch_head","sales_exec","ops_exec"] },
  { id:"surveys",    label:"Surveys",     icon:"📋", roles:["super_admin","branch_head","sales_exec","surveyor"] },
  { id:"quotations", label:"Quotations",  icon:"📄", roles:["super_admin","branch_head","sales_exec","finance_exec"] },
  { id:"bookings",   label:"Bookings",    icon:"📦", roles:["super_admin","branch_head","ops_exec","finance_exec"] },
  { id:"operations", label:"Operations",  icon:"🚛", roles:["super_admin","branch_head","ops_exec","vehicle_vendor"] },
  { id:"invoices",   label:"Invoices",    icon:"💳", roles:["super_admin","branch_head","finance_exec"] },
  { id:"vendors",    label:"Vendors",     icon:"🤝", roles:["super_admin","branch_head","ops_exec"] },
  { id:"users",      label:"Users",       icon:"👥", roles:["super_admin","branch_head"] },
  { id:"settings",   label:"Settings",    icon:"⚙️", roles:["super_admin"] },
];

// ── SHELL ─────────────────────────────────────────────────────────────────────
function Shell() {
  const { user, logout } = useAppAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const r = ROLES[user?.role]||{};
  const visibleNav = NAV.filter(n => n.roles.includes("*") || n.roles.includes(user?.role));

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#F0F2F5",fontFamily:"system-ui,sans-serif"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:8px;cursor:pointer;transition:all .15s;color:rgba(255,255,255,.5);font-size:13.5px;font-weight:500;text-decoration:none;border:none;background:transparent;width:100%;text-align:left}
        .nav-item:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.85)}
        .nav-item.active{background:rgba(219,38,72,.2);color:#fff;}
        .card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
        .btn{padding:8px 16px;border-radius:7px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:system-ui;transition:all .15s}
        .btn-primary{background:#DB2648;color:#fff;}
        .btn-primary:hover{background:#B71C3C}
        .btn-ghost{background:rgba(0,0,0,.05);color:#374151}
        .btn-ghost:hover{background:rgba(0,0,0,.09)}
        .inp{width:100%;padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:7px;font:400 13.5px/1 system-ui;color:#111827;outline:none;background:#fff;transition:border-color .15s;box-sizing:border-box}
        .inp:focus{border-color:#DB2648;}
        .sel{appearance:none;width:100%;padding:9px 12px;border:1.5px solid #E5E7EB;border-radius:7px;font:400 13.5px/1 system-ui;color:#111827;outline:none;background:#fff;cursor:pointer;box-sizing:border-box}
        .sel:focus{border-color:#DB2648;}
        .tag{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.3px;text-transform:uppercase}
        .table-row:hover{background:#F9FAFB}
        .page{animation:fadeIn .2s ease}
        .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
        .modal{background:#fff;border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.25)}
      `}</style>

      {/* Sidebar */}
      <div style={{width:220,background:"#0C0F1A",display:"flex",flexDirection:"column",flexShrink:0,borderRight:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{padding:"20px 16px 16px",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          <Logo size={24}/>
        </div>
        <nav style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
          {visibleNav.map(n=>(
            <button key={n.id} className={`nav-item${activeNav===n.id?" active":""}`} onClick={()=>setActiveNav(n.id)}>
              <span style={{fontSize:15}}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{r.icon}</div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontFamily:"system-ui",fontSize:12.5,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name}</div>
              <div style={{fontFamily:"system-ui",fontSize:10.5,color:"rgba(255,255,255,.35)"}}>{r.label}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:"100%",padding:"7px",background:"rgba(219,38,72,.15)",color:"#FB7185",border:"1px solid rgba(219,38,72,.25)",borderRadius:7,fontFamily:"system-ui",fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"0 24px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontFamily:"system-ui",fontSize:15,fontWeight:700,color:"#0F172A"}}>
            {visibleNav.find(n=>n.id===activeNav)?.icon} {visibleNav.find(n=>n.id===activeNav)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"system-ui",fontSize:12,color:"#6B7280"}}>FY {FY}</span>
            <div className="tag" style={{background:`${r.color}15`,color:r.color}}>{user?.branch}</div>
          </div>
        </div>

        {/* Page */}
        <div style={{flex:1,padding:24,overflow:"auto"}}>
          {activeNav==="dashboard"  && <DashboardPage />}
          {activeNav==="enquiries"  && <EnquiriesPage />}
          {activeNav==="surveys"    && <SurveysPage />}
          {activeNav==="quotations" && <QuotationsPage />}
          {activeNav==="bookings"   && <BookingsPage />}
          {activeNav==="operations" && <OperationsPage />}
          {activeNav==="invoices"   && <InvoicesPage />}
          {activeNav==="vendors"    && <VendorsPage />}
          {activeNav==="users"      && <UsersPage />}
          {activeNav==="settings"   && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color="#DB2648", icon }) {
  return (
    <div className="card" style={{display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:22}}>{icon}</span>
        <span className="tag" style={{background:`${color}12`,color}}>{sub}</span>
      </div>
      <div style={{fontFamily:"system-ui",fontSize:28,fontWeight:800,color:"#0F172A",lineHeight:1}}>{value}</div>
      <div style={{fontFamily:"system-ui",fontSize:12.5,color:"#6B7280",fontWeight:500}}>{label}</div>
    </div>
  );
}

function StageTag({ stage, type="enquiry" }) {
  const COLORS = {
    new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626",
    pending:"#D97706",assigned:"#2563EB",scheduled:"#7C3AED","in-progress":"#0D9488",completed:"#059669","report-filed":"#059669",
    draft:"#6B7280",sent:"#2563EB",viewed:"#D97706",negotiating:"#7C3AED",approved:"#059669",converted:"#059669",
    "token-pending":"#D97706","token-received":"#059669",confirmed:"#2563EB","vendor-assigned":"#7C3AED","ops-ready":"#0D9488","in-transit":"#DB2648",delivered:"#059669",cancelled:"#DC2626",
    "dispatch-mat":"#D97706",packing:"#7C3AED",loading:"#2563EB",unloading:"#0D9488",
    partial:"#D97706",paid:"#059669",overdue:"#DC2626",
    active:"#059669",inactive:"#6B7280",open:"#2563EB","in-progress2":"#D97706",resolved:"#059669",closed:"#6B7280",
    low:"#6B7280",medium:"#D97706",high:"#DB2648",critical:"#DC2626",
  };
  const c = COLORS[stage] || "#6B7280";
  return <span className="tag" style={{background:`${c}15`,color:c}}>{stage}</span>;
}

function EmptyState({ icon="📭", text="No records found" }) {
  return (
    <div style={{textAlign:"center",padding:"48px 20px",color:"#9CA3AF"}}>
      <div style={{fontSize:36,marginBottom:10}}>{icon}</div>
      <div style={{fontFamily:"system-ui",fontSize:14,fontWeight:500}}>{text}</div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{width:28,height:28,border:"3px solid rgba(219,38,72,.2)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-bg" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal">
        <div style={{padding:"20px 24px",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontFamily:"system-ui",fontSize:16,fontWeight:700,color:"#0F172A",margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#6B7280",cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"20px 24px"}}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontFamily:"system-ui",fontSize:12,fontWeight:600,color:"#4B5563",marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>
        {label}{required&&<span style={{color:"#DB2648"}}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Table({ cols, rows, loading, empty="No records" }) {
  if(loading) return <Loader/>;
  if(!rows?.length) return <EmptyState text={empty}/>;
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"2px solid #E5E7EB"}}>
            {cols.map(c=>(
              <th key={c.key} style={{padding:"8px 12px",textAlign:"left",fontFamily:"system-ui",fontSize:11,fontWeight:700,color:"#6B7280",textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap"}}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={row.id||i} className="table-row" style={{borderBottom:"1px solid #F3F4F6",transition:"background .1s"}}>
              {cols.map(c=>(
                <td key={c.key} style={{padding:"10px 12px",fontFamily:"system-ui",fontSize:13,color:"#374151",whiteSpace:c.wrap?"normal":"nowrap"}}>
                  {c.render ? c.render(row) : row[c.key] || <span style={{color:"#D1D5DB"}}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { items:enqs,    loading:eL } = useCollection("enquiries",  {sort:"-created",perPage:5});
  const { items:cfrs,    loading:cL } = useCollection("cfr",        {sort:"-created",perPage:5});
  const { items:invs,    loading:iL } = useCollection("invoices",   {sort:"-created",perPage:5});
  const { items:vendors, loading:vL } = useCollection("vendors",    {sort:"-created"});

  const totalEnq   = enqs.length;
  const openCFR    = cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).length;
  const outstanding = invs.reduce((s,i)=>s+(i.outstanding||0),0);
  const activeVen  = vendors.filter(v=>v.status==="active").length;

  return (
    <div className="page">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <StatCard label="Total Enquiries" value={eL?"…":totalEnq} sub="this page" icon="📥" color="#2563EB"/>
        <StatCard label="Active Bookings" value={cL?"…":openCFR} sub="in progress" icon="📦" color="#D97706"/>
        <StatCard label="Outstanding (₹)" value={iL?"…":`₹${(outstanding/1000).toFixed(0)}K`} sub="pending" icon="💳" color="#DB2648"/>
        <StatCard label="Active Vendors" value={vL?"…":activeVen} sub="registered" icon="🤝" color="#059669"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="card">
          <div style={{fontFamily:"system-ui",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:14}}>Recent Enquiries</div>
          <Table
            loading={eL}
            cols={[
              {key:"enq_number",label:"Ref"},
              {key:"name",label:"Customer"},
              {key:"move_type",label:"Type",render:r=><StageTag stage={r.move_type}/>},
              {key:"stage",label:"Stage",render:r=><StageTag stage={r.stage}/>},
            ]}
            rows={enqs.slice(0,5)}
          />
        </div>
        <div className="card">
          <div style={{fontFamily:"system-ui",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:14}}>Recent Bookings</div>
          <Table
            loading={cL}
            cols={[
              {key:"cfr_number",label:"CFR"},
              {key:"grand_total",label:"Value",render:r=>`₹${(r.grand_total||0).toLocaleString()}`},
              {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
            ]}
            rows={cfrs.slice(0,5)}
          />
        </div>
      </div>
    </div>
  );
}

// ── ENQUIRIES ────────────────────────────────────────────────────────────────
function EnquiriesPage() {
  const { user } = useAppAuth();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const { items, loading, refresh } = useCollection("enquiries",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("enquiries");
  const [form, setForm] = useState({ name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",move_type:"household",source:"website",stage:"new",branch:user?.branch||"NDLH",fy:FY,seq:"0",apt_size:"",move_date:"",notes:"" });

  const filtered = items.filter(e=>{
    const q = filter.toLowerCase();
    const matchQ = !q || e.name?.toLowerCase().includes(q) || e.phone?.includes(q) || e.enq_number?.toLowerCase().includes(q);
    const matchS = !stageFilter || e.stage===stageFilter;
    return matchQ && matchS;
  });

  const handleCreate = async () => {
    if(!form.name||!form.phone||!form.from_address||!form.to_address){alert("Fill required fields");return;}
    try{
      await create(form);
      setShowForm(false);
      setForm({...form,name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",apt_size:"",move_date:"",notes:""});
      refresh();
    }catch(e){alert(e.message);}
  };

  return (
    <div className="page">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{display:"flex",gap:8}}>
          <input className="inp" style={{width:220}} placeholder="Search name, phone, ref…" value={filter} onChange={e=>setFilter(e.target.value)}/>
          <select className="sel" style={{width:140}} value={stageFilter} onChange={e=>setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            {ENQ_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Enquiry</button>
      </div>

      <div className="card">
        <Table
          loading={loading}
          cols={[
            {key:"enq_number",label:"Ref #"},
            {key:"name",label:"Customer"},
            {key:"phone",label:"Phone"},
            {key:"from_address",label:"From",wrap:true},
            {key:"to_address",label:"To",wrap:true},
            {key:"move_type",label:"Type",render:r=><StageTag stage={r.move_type}/>},
            {key:"source",label:"Source",render:r=><StageTag stage={r.source}/>},
            {key:"stage",label:"Stage",render:r=><StageTag stage={r.stage}/>},
            {key:"move_date",label:"Move Date"},
          ]}
          rows={filtered}
          empty="No enquiries yet"
        />
      </div>

      {showForm && (
        <Modal title="New Enquiry" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Customer Name" required><input className="inp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name"/></FormField>
            <FormField label="Phone" required><input className="inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile"/></FormField>
            <FormField label="Alt Phone"><input className="inp" value={form.alt_phone} onChange={e=>setForm({...form,alt_phone:e.target.value})} placeholder="Optional"/></FormField>
            <FormField label="Email"><input className="inp" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email"/></FormField>
            <FormField label="From Address" required><input className="inp" value={form.from_address} onChange={e=>setForm({...form,from_address:e.target.value})} placeholder="Pickup address"/></FormField>
            <FormField label="To Address" required><input className="inp" value={form.to_address} onChange={e=>setForm({...form,to_address:e.target.value})} placeholder="Drop address"/></FormField>
            <FormField label="Move Type"><select className="sel" value={form.move_type} onChange={e=>setForm({...form,move_type:e.target.value})}>{MOVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></FormField>
            <FormField label="Source"><select className="sel" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
            <FormField label="Branch"><select className="sel" value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></FormField>
            <FormField label="Move Date"><input className="inp" type="date" value={form.move_date} onChange={e=>setForm({...form,move_date:e.target.value})}/></FormField>
            <FormField label="Apt Size"><input className="inp" value={form.apt_size} onChange={e=>setForm({...form,apt_size:e.target.value})} placeholder="e.g. 2BHK"/></FormField>
          </div>
          <FormField label="Notes"><textarea className="inp" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any additional notes" style={{resize:"vertical"}}/></FormField>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Enquiry"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── SURVEYS ───────────────────────────────────────────────────────────────────
function SurveysPage() {
  const { items, loading, refresh } = useCollection("surveys",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("surveys");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({enquiry_id:"",agent_name:"",survey_date:"",survey_time:"",floor:"",has_lift:false,distance:"",condition:"new",agent_notes:"",status:"pending"});
  const STATUSES = ["pending","assigned","scheduled","in-progress","completed","report-filed"];
  const handleCreate = async () => {
    try{ await create(form); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Survey</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"survey_number",label:"Survey #"},
          {key:"enquiry_id",label:"Enquiry ID"},
          {key:"agent_name",label:"Agent"},
          {key:"survey_date",label:"Date"},
          {key:"survey_time",label:"Time"},
          {key:"floor",label:"Floor"},
          {key:"has_lift",label:"Lift",render:r=>r.has_lift?"✅":"❌"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No surveys yet"/>
      </div>
      {showForm&&(
        <Modal title="New Survey" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Enquiry ID" required><input className="inp" value={form.enquiry_id} onChange={e=>setForm({...form,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></FormField>
            <FormField label="Agent Name"><input className="inp" value={form.agent_name} onChange={e=>setForm({...form,agent_name:e.target.value})} placeholder="Surveyor name"/></FormField>
            <FormField label="Survey Date"><input className="inp" type="date" value={form.survey_date} onChange={e=>setForm({...form,survey_date:e.target.value})}/></FormField>
            <FormField label="Survey Time"><input className="inp" type="time" value={form.survey_time} onChange={e=>setForm({...form,survey_time:e.target.value})}/></FormField>
            <FormField label="Floor"><input className="inp" type="number" value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})} placeholder="Floor number"/></FormField>
            <FormField label="Has Lift">
              <select className="sel" value={form.has_lift} onChange={e=>setForm({...form,has_lift:e.target.value==="true"})}>
                <option value="true">Yes</option><option value="false">No</option>
              </select>
            </FormField>
            <FormField label="Distance"><input className="inp" value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})} placeholder="e.g. 450 km"/></FormField>
            <FormField label="Status"><select className="sel" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
          </div>
          <FormField label="Notes"><textarea className="inp" rows={2} value={form.agent_notes} onChange={e=>setForm({...form,agent_notes:e.target.value})} style={{resize:"vertical"}}/></FormField>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Survey"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── QUOTATIONS ────────────────────────────────────────────────────────────────
function QuotationsPage() {
  const { items, loading, refresh } = useCollection("quotations",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("quotations");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({enquiry_id:"",subtotal:"",discount_pct:"0",tax_amt:"",grand_total:"",valid_days:"7",move_date:"",notes:"",status:"draft",revisions:0,base_id:"",quot_number:""});
  const STATUSES = ["draft","sent","viewed","negotiating","approved","recalling","converted","lost"];
  const handleCreate = async () => {
    try{ await create({...form,subtotal:+form.subtotal,discount_pct:+form.discount_pct,tax_amt:+form.tax_amt,grand_total:+form.grand_total,valid_days:+form.valid_days}); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Quotation</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"quot_number",label:"Quot #"},
          {key:"enquiry_id",label:"Enquiry"},
          {key:"subtotal",label:"Subtotal",render:r=>`₹${(r.subtotal||0).toLocaleString()}`},
          {key:"discount_pct",label:"Disc%",render:r=>`${r.discount_pct||0}%`},
          {key:"grand_total",label:"Total",render:r=><strong>₹{(r.grand_total||0).toLocaleString()}</strong>},
          {key:"move_date",label:"Move Date"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No quotations yet"/>
      </div>
      {showForm&&(
        <Modal title="New Quotation" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Enquiry ID" required><input className="inp" value={form.enquiry_id} onChange={e=>setForm({...form,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></FormField>
            <FormField label="Status"><select className="sel" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
            <FormField label="Subtotal (₹)" required><input className="inp" type="number" value={form.subtotal} onChange={e=>setForm({...form,subtotal:e.target.value})}/></FormField>
            <FormField label="Discount %"><input className="inp" type="number" value={form.discount_pct} onChange={e=>setForm({...form,discount_pct:e.target.value})}/></FormField>
            <FormField label="Tax Amount (₹)"><input className="inp" type="number" value={form.tax_amt} onChange={e=>setForm({...form,tax_amt:e.target.value})}/></FormField>
            <FormField label="Grand Total (₹)" required><input className="inp" type="number" value={form.grand_total} onChange={e=>setForm({...form,grand_total:e.target.value})}/></FormField>
            <FormField label="Valid Days"><input className="inp" type="number" value={form.valid_days} onChange={e=>setForm({...form,valid_days:e.target.value})}/></FormField>
            <FormField label="Move Date"><input className="inp" type="date" value={form.move_date} onChange={e=>setForm({...form,move_date:e.target.value})}/></FormField>
          </div>
          <FormField label="Notes"><textarea className="inp" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{resize:"vertical"}}/></FormField>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Quotation"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── BOOKINGS (CFR) ────────────────────────────────────────────────────────────
function BookingsPage() {
  const { items, loading, refresh } = useCollection("cfr",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("cfr");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({enquiry_id:"",quotation_id:"",grand_total:"",token_amt:"",move_date:"",vehicle:"",vehicle_no:"",is_interstate:false,status:"token-pending"});
  const STATUSES = ["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"];
  const handleCreate = async () => {
    try{ await create({...form,grand_total:+form.grand_total,token_amt:+form.token_amt,total_paid:0}); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Booking</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"cfr_number",label:"CFR #"},
          {key:"enquiry_id",label:"Enquiry"},
          {key:"grand_total",label:"Value",render:r=>`₹${(r.grand_total||0).toLocaleString()}`},
          {key:"token_amt",label:"Token",render:r=>`₹${(r.token_amt||0).toLocaleString()}`},
          {key:"total_paid",label:"Paid",render:r=>`₹${(r.total_paid||0).toLocaleString()}`},
          {key:"move_date",label:"Move Date"},
          {key:"vehicle",label:"Vehicle"},
          {key:"is_interstate",label:"Interstate",render:r=>r.is_interstate?"✅":"❌"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No bookings yet"/>
      </div>
      {showForm&&(
        <Modal title="New Booking (CFR)" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Enquiry ID" required><input className="inp" value={form.enquiry_id} onChange={e=>setForm({...form,enquiry_id:e.target.value})}/></FormField>
            <FormField label="Quotation ID" required><input className="inp" value={form.quotation_id} onChange={e=>setForm({...form,quotation_id:e.target.value})}/></FormField>
            <FormField label="Grand Total (₹)" required><input className="inp" type="number" value={form.grand_total} onChange={e=>setForm({...form,grand_total:e.target.value})}/></FormField>
            <FormField label="Token Amount (₹)"><input className="inp" type="number" value={form.token_amt} onChange={e=>setForm({...form,token_amt:e.target.value})}/></FormField>
            <FormField label="Move Date"><input className="inp" type="date" value={form.move_date} onChange={e=>setForm({...form,move_date:e.target.value})}/></FormField>
            <FormField label="Vehicle"><input className="inp" value={form.vehicle} onChange={e=>setForm({...form,vehicle:e.target.value})} placeholder="e.g. 20ft container"/></FormField>
            <FormField label="Vehicle No"><input className="inp" value={form.vehicle_no} onChange={e=>setForm({...form,vehicle_no:e.target.value})} placeholder="DL 1C 0000"/></FormField>
            <FormField label="Interstate">
              <select className="sel" value={form.is_interstate} onChange={e=>setForm({...form,is_interstate:e.target.value==="true"})}>
                <option value="false">No</option><option value="true">Yes</option>
              </select>
            </FormField>
            <FormField label="Status"><select className="sel" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Booking"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── OPERATIONS ────────────────────────────────────────────────────────────────
function OperationsPage() {
  const { items, loading, refresh } = useCollection("operations",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("operations");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({cfr_id:"",bilty_no:"",invoice_no:"",stage:"dispatch-mat"});
  const STAGES = ["dispatch-mat","packing","loading","in-transit","unloading","delivered"];
  const handleCreate = async () => {
    try{ await create(form); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Operation</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"ops_number",label:"Ops #"},
          {key:"cfr_id",label:"CFR"},
          {key:"bilty_no",label:"Bilty #"},
          {key:"invoice_no",label:"Invoice #"},
          {key:"stage",label:"Stage",render:r=><StageTag stage={r.stage}/>},
        ]} rows={items} empty="No operations yet"/>
      </div>
      {showForm&&(
        <Modal title="New Operation" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="CFR ID" required><input className="inp" value={form.cfr_id} onChange={e=>setForm({...form,cfr_id:e.target.value})}/></FormField>
            <FormField label="Stage"><select className="sel" value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
            <FormField label="Bilty #"><input className="inp" value={form.bilty_no} onChange={e=>setForm({...form,bilty_no:e.target.value})}/></FormField>
            <FormField label="Invoice #"><input className="inp" value={form.invoice_no} onChange={e=>setForm({...form,invoice_no:e.target.value})}/></FormField>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Operation"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── INVOICES ──────────────────────────────────────────────────────────────────
function InvoicesPage() {
  const { items, loading, refresh } = useCollection("invoices",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("invoices");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({cfr_id:"",grand_total:"",paid_amt:"0",outstanding:"",invoice_date:"",due_date:"",gst_no:"",hsn_code:"998543",status:"draft"});
  const STATUSES = ["draft","sent","partial","paid","overdue","cancelled"];
  const handleCreate = async () => {
    const gt = +form.grand_total, pa = +form.paid_amt;
    try{ await create({...form,grand_total:gt,paid_amt:pa,outstanding:gt-pa}); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Invoice</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"inv_number",label:"Invoice #"},
          {key:"cfr_id",label:"CFR"},
          {key:"grand_total",label:"Amount",render:r=>`₹${(r.grand_total||0).toLocaleString()}`},
          {key:"paid_amt",label:"Paid",render:r=>`₹${(r.paid_amt||0).toLocaleString()}`},
          {key:"outstanding",label:"Outstanding",render:r=><strong style={{color:r.outstanding>0?"#DC2626":"#059669"}}>₹{(r.outstanding||0).toLocaleString()}</strong>},
          {key:"invoice_date",label:"Date"},
          {key:"due_date",label:"Due"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No invoices yet"/>
      </div>
      {showForm&&(
        <Modal title="New Invoice" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="CFR ID" required><input className="inp" value={form.cfr_id} onChange={e=>setForm({...form,cfr_id:e.target.value})}/></FormField>
            <FormField label="Status"><select className="sel" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></FormField>
            <FormField label="Grand Total (₹)" required><input className="inp" type="number" value={form.grand_total} onChange={e=>setForm({...form,grand_total:e.target.value})}/></FormField>
            <FormField label="Paid Amount (₹)"><input className="inp" type="number" value={form.paid_amt} onChange={e=>setForm({...form,paid_amt:e.target.value})}/></FormField>
            <FormField label="Invoice Date"><input className="inp" type="date" value={form.invoice_date} onChange={e=>setForm({...form,invoice_date:e.target.value})}/></FormField>
            <FormField label="Due Date"><input className="inp" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></FormField>
            <FormField label="GST No"><input className="inp" value={form.gst_no} onChange={e=>setForm({...form,gst_no:e.target.value})}/></FormField>
            <FormField label="HSN Code"><input className="inp" value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})}/></FormField>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create Invoice"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── VENDORS ───────────────────────────────────────────────────────────────────
function VendorsPage() {
  const { items, loading, refresh } = useCollection("vendors",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("vendors");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:"",type:"vehicle_vendor",contact:"",phone:"",email:"",gst:"",branch:"NDLH",status:"active",rating:5});
  const handleCreate = async () => {
    if(!form.name||!form.contact){alert("Name and contact required");return;}
    try{ await create({...form,rating:+form.rating}); setShowForm(false); refresh(); }catch(e){alert(e.message);}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New Vendor</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"name",label:"Vendor Name"},
          {key:"type",label:"Type",render:r=><StageTag stage={r.type}/>},
          {key:"contact",label:"Contact"},
          {key:"phone",label:"Phone"},
          {key:"branch",label:"Branch"},
          {key:"rating",label:"Rating",render:r=>`${"⭐".repeat(Math.min(5,r.rating||0))}`},
          {key:"total_jobs",label:"Jobs"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No vendors yet"/>
      </div>
      {showForm&&(
        <Modal title="New Vendor" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Vendor Name" required><input className="inp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></FormField>
            <FormField label="Type"><select className="sel" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="vehicle_vendor">Vehicle Vendor</option><option value="manpower_vendor">Manpower Vendor</option></select></FormField>
            <FormField label="Contact Person" required><input className="inp" value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})}/></FormField>
            <FormField label="Phone"><input className="inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FormField>
            <FormField label="Email"><input className="inp" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FormField>
            <FormField label="GST"><input className="inp" value={form.gst} onChange={e=>setForm({...form,gst:e.target.value})}/></FormField>
            <FormField label="Branch"><select className="sel" value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></FormField>
            <FormField label="Rating (1–5)"><input className="inp" type="number" min="1" max="5" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})}/></FormField>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Add Vendor"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UsersPage() {
  const { items, loading, refresh } = useCollection("users",{sort:"-created",perPage:100});
  const { create, loading:saving } = useMutation("users");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});
  const handleCreate = async () => {
    if(!form.email||!form.password||!form.name){alert("Email, password and name required");return;}
    try{
      await pb.collection("users").create({...form,passwordConfirm:form.password,emailVisibility:true});
      setShowForm(false);
      setForm({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});
      refresh();
    }catch(e){alert(e.message||"Failed to create user");}
  };
  return (
    <div className="page">
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New User</button>
      </div>
      <div className="card">
        <Table loading={loading} cols={[
          {key:"name",label:"Name"},
          {key:"email",label:"Email"},
          {key:"phone",label:"Phone"},
          {key:"role",label:"Role",render:r=>{const rr=ROLES[r.role]||{};return <span className="tag" style={{background:`${rr.color||"#6B7280"}15`,color:rr.color||"#6B7280"}}>{rr.icon} {rr.label}</span>;}},
          {key:"branch",label:"Branch"},
          {key:"status",label:"Status",render:r=><StageTag stage={r.status}/>},
        ]} rows={items} empty="No users yet"/>
      </div>
      {showForm&&(
        <Modal title="New User" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
            <FormField label="Full Name" required><input className="inp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></FormField>
            <FormField label="Phone"><input className="inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FormField>
            <FormField label="Email" required><input className="inp" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FormField>
            <FormField label="Password" required><input className="inp" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></FormField>
            <FormField label="Role"><select className="sel" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></FormField>
            <FormField label="Branch"><select className="sel" value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></FormField>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving?"Saving…":"Create User"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage() {
  const { settings, saveSetting } = useAppAuth();
  const co = settings?.company || {};
  const [form, setForm] = useState({ name:"", gst:"", address:"", phone:"", email:"", website:"" });
  const [saved, setSaved] = useState(false);

  useEffect(()=>{
    if(co.name) setForm({ name:co.name||"", gst:co.gst||"", address:co.address||"", phone:co.phone||"", email:co.email||"", website:co.website||"" });
  },[settings]);

  const handleSave = async () => {
    await saveSetting("company", form, "company");
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  return (
    <div className="page">
      <div className="card" style={{maxWidth:640}}>
        <div style={{fontFamily:"system-ui",fontSize:15,fontWeight:700,color:"#0F172A",marginBottom:20}}>🏢 Company Settings</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <FormField label="Company Name" required><input className="inp" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></FormField>
          <FormField label="GST Number"><input className="inp" value={form.gst} onChange={e=>setForm({...form,gst:e.target.value})}/></FormField>
          <FormField label="Phone"><input className="inp" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></FormField>
          <FormField label="Email"><input className="inp" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></FormField>
          <FormField label="Website"><input className="inp" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></FormField>
        </div>
        <FormField label="Address"><textarea className="inp" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={{resize:"vertical"}}/></FormField>
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:8}}>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
          {saved&&<span style={{fontFamily:"system-ui",fontSize:13,color:"#059669",fontWeight:600}}>✅ Saved!</span>}
        </div>
      </div>
    </div>
  );
}
