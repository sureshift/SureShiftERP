/**
 * SureShift ERP v2.0 — Full App
 * Design: Poppins + Inter | #0F172A · #DB2648 · #E8ECF4 | Matching login UI
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useCollection, useMutation, useSettings } from "./hooks/useCollection.js";
import pb from "./lib/pb.js";

// ── Auth Context ──────────────────────────────────────────────────────────────
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
const BRANCHES   = ["NDLH","MUMB","BANG","CHEN","HYDB","KOLK"];
const MOVE_TYPES = ["household","office","international","vehicle","bike","storage","commercial","courier"];
const SOURCES    = ["website","gmb","phone","whatsapp","reference"];
const ENQ_STAGES = ["new","survey","quotation","recalling","cfr","lost"];
const FY = (()=>{ const n=new Date(),y=n.getFullYear(),m=n.getMonth(); return m>=3?`${String(y).slice(-2)}${String(y+1).slice(-2)}`:`${String(y-1).slice(-2)}${String(y).slice(-2)}`; })();

export function hasPerm(user,mod,action){
  if(!user) return false;
  if(user.role==="super_admin") return true;
  return(user.permissions?.[mod]||[]).includes(action);
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const authHook = useAuth();
  const { settings, loading:settingsLoading, save:saveSetting } = useSettings();
  const ctx = { ...authHook, settings, settingsLoading, saveSetting, ROLES,
    hasPerm:(mod,action)=>hasPerm(authHook.user,mod,action),
    isSuperAdmin:authHook.user?.role==="super_admin" };
  return (
    <AuthCtx.Provider value={ctx}>
      {authHook.loading?<Splash/>:authHook.user?<Shell/>:<Login/>}
    </AuthCtx.Provider>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0F172A"}}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
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

// ── Login ─────────────────────────────────────────────────────────────────────
function Login() {
  const { login, error } = useAppAuth();
  const [tab, setTab]           = useState("login");
  const [showPwd, setShowPwd]   = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [localErr, setLocalErr] = useState("");
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [remember, setRemember] = useState(false);

  const [lf, setLf] = useState({ email:"", password:"" });
  const [sf, setSf] = useState({ name:"", email:"", phone:"", company:"", partnerType:"", password:"", confirm:"" });

  const QUOTES = [
    { q:"You are not just moving boxes — you are moving lives, memories and new beginnings.", by:"Founding Team, Sure Shift" },
    { q:"Every route planned, every item packed safely, every customer smile — that's your achievement.", by:"Operations Leadership" },
    { q:"Our strength isn't our trucks or warehouses. It's each one of you showing up every day.", by:"HR & People Team" },
    { q:"The best partners don't just deliver goods. They deliver trust. Thank you for being ours.", by:"Vendor Relations" },
  ];

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const STATS = [
    { n:"10,000+", l:"Moves completed", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { n:"500+",    l:"Trusted partners", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { n:"98%",     l:"Satisfaction rate", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> },
    { n:"24 / 7",  l:"Operations support", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!lf.email || !lf.password) { setLocalErr("Please fill in both fields to continue."); return; }
    setBusy(true); setLocalErr("");
    try { await login(lf.email.trim().toLowerCase(), lf.password); }
    catch (err) { setLocalErr(err.message); }
    finally { setBusy(false); }
  };

  const handleSignup = (e) => {
    e?.preventDefault();
    const { name, email, phone, partnerType, password, confirm } = sf;
    if (!name || !email || !phone || !partnerType || !password || !confirm) { setLocalErr("All fields are required to complete registration."); return; }
    if (password !== confirm) { setLocalErr("Passwords do not match. Please re-enter."); return; }
    setLocalErr("");
    setLocalErr("✅ Registration submitted! Your account will be activated within 24 hours. Check your email for credentials.");
  };

  const err = localErr || error;
  const isSuccess = err?.startsWith("✅");

  return (
    <div style={{minHeight:"100vh",background:"#0C1222",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlide{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes quoteIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .auth-wrap{display:grid;grid-template-columns:1.1fr 1fr;width:100%;max-width:1020px;min-height:620px;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,.07)}
        .auth-left{background:#0F172A;padding:48px 44px;display:flex;flex-direction:column;position:relative;overflow:hidden;border-right:1px solid rgba(255,255,255,.06)}
        .auth-left::before{content:"";position:absolute;top:-140px;right:-140px;width:380px;height:380px;border-radius:50%;background:rgba(219,38,72,.12);pointer-events:none}
        .auth-left::after{content:"";position:absolute;bottom:-100px;left:-80px;width:260px;height:260px;border-radius:50%;background:rgba(219,38,72,.07);pointer-events:none}
        .auth-dot-pattern{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px);background-size:24px 24px;pointer-events:none}
        .auth-right{background:#FAFBFC;display:flex;flex-direction:column}
        .auth-right-inner{flex:1;padding:40px 44px;display:flex;flex-direction:column;justify-content:center}
        .tabs-bar{display:flex;border-bottom:1.5px solid #E8ECF4;padding:0 44px}
        .tab-btn{padding:16px 0;margin-right:28px;border:none;background:transparent;font:600 13.5px 'Inter',sans-serif;cursor:pointer;transition:all .2s;border-bottom:2.5px solid transparent;margin-bottom:-1.5px;color:#94A3B8;letter-spacing:.1px}
        .tab-btn.active{color:#DB2648;border-bottom-color:#DB2648}
        .tab-btn:hover:not(.active){color:#475569}
        .a-label{display:block;font:600 11px 'Inter',sans-serif;color:#64748B;letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px}
        .a-inp{width:100%;padding:11px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font:400 14px 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:all .18s;box-sizing:border-box}
        .a-inp:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.09)}
        .a-inp::placeholder{color:#CBD5E1}
        .a-inp.err-field{border-color:#F87171}
        .a-sel{appearance:none;width:100%;padding:11px 38px 11px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font:400 14px 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none' stroke='%2394A3B8' stroke-width='1.6'%3E%3Cpath d='M1 1l4.5 4.5L10 1'/%3E%3C/svg%3E") no-repeat right 13px center;cursor:pointer;transition:all .18s;box-sizing:border-box}
        .a-sel:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.09)}
        .a-sel.placeholder{color:#CBD5E1}
        .pw-wrap{position:relative}
        .pw-wrap .a-inp{padding-right:44px}
        .eye-btn{position:absolute;right:13px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;padding:3px;border-radius:5px;transition:color .15s}
        .eye-btn:hover{color:#475569}
        .a-btn{width:100%;padding:13px;background:#DB2648;color:#fff;border:none;border-radius:11px;font:600 14.5px 'Inter',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .18s;letter-spacing:.1px}
        .a-btn:hover{background:#B91C3C;transform:translateY(-1px)}
        .a-btn:active{transform:translateY(0)}
        .a-btn:disabled{background:#CBD5E1;cursor:not-allowed;transform:none}
        .a-link{color:#DB2648;font:600 13px 'Inter',sans-serif;text-decoration:none;cursor:pointer;background:none;border:none;padding:0;transition:color .15s}
        .a-link:hover{color:#991B2F}
        .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .stat-card{padding:16px;border-radius:13px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);display:flex;flex-direction:column;gap:10px;transition:border-color .2s}
        .stat-card:hover{border-color:rgba(219,38,72,.3)}
        .quote-box{border-left:2.5px solid rgba(219,38,72,.6);padding-left:16px;margin-top:auto}
        .quote-text{font:400 13.5px/1.65 'Inter',sans-serif;color:rgba(255,255,255,.65);font-style:italic;animation:quoteIn .5s ease}
        .quote-by{font:600 11px 'Inter',sans-serif;color:rgba(219,38,72,.8);letter-spacing:.5px;text-transform:uppercase;margin-top:7px}
        .dot-nav{display:flex;gap:5px;margin-top:12px}
        .dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.2);transition:all .4s;cursor:pointer}
        .dot.active{width:18px;border-radius:3px;background:#DB2648}
        .remember-row{display:flex;align-items:center;justify-content:space-between;margin:6px 0 20px}
        .check-label{display:flex;align-items:center;gap:7px;font:400 13px 'Inter',sans-serif;color:#475569;cursor:pointer}
        .check-label input{accent-color:#DB2648;width:15px;height:15px;cursor:pointer}
        .divider{display:flex;align-items:center;gap:12px;margin:20px 0}
        .divider-line{flex:1;height:1px;background:#E2E8F0}
        .divider-text{font:400 12px 'Inter',sans-serif;color:#94A3B8}
        .bottom-note{text-align:center;font:400 13px 'Inter',sans-serif;color:#94A3B8;margin-top:18px}
        .form-section{animation:fadeUp .2s ease}
        @media(max-width:900px){.auth-wrap{grid-template-columns:1fr;max-width:500px}.auth-left{padding:32px 28px;min-height:0}.auth-left .quota-box,.auth-left .clients-section{display:none}.auth-right-inner,.tabs-bar{padding-left:28px;padding-right:28px}.grid-2{grid-template-columns:1fr}}
        @media(max-width:520px){.auth-right-inner,.tabs-bar{padding-left:20px;padding-right:20px}.auth-left{padding:24px 20px}.a-btn{padding:12px}}
      `}</style>

      <div className="auth-wrap">
        {/* ── LEFT PANEL ── */}
        <div className="auth-left">
          <div className="auth-dot-pattern"/>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:36,position:"relative"}}>
            <div style={{width:40,height:40,borderRadius:11,background:"rgba(219,38,72,.2)",border:"1px solid rgba(219,38,72,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={22} height={22} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:17,color:"#fff",letterSpacing:"1.2px",lineHeight:1}}>SURE<span style={{color:"#DB2648"}}>SHIFT</span></div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9.5,color:"rgba(255,255,255,.3)",letterSpacing:"2.5px",textTransform:"uppercase",marginTop:2}}>Relocation ERP · v2.0</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"4px 10px",border:"1px solid rgba(255,255,255,.1)",borderRadius:"99px",background:"rgba(255,255,255,.04)"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",animation:"pulse 2s ease infinite"}}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,color:"rgba(255,255,255,.5)",fontWeight:600}}>Systems live</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{position:"relative",marginBottom:28}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 11px",background:"rgba(219,38,72,.12)",border:"1px solid rgba(219,38,72,.2)",borderRadius:99,marginBottom:14}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,fontWeight:700,color:"#FB7185",letterSpacing:".6px",textTransform:"uppercase"}}>Welcome, Team Sure Shift</span>
            </div>
            <h1 style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:27,color:"#fff",lineHeight:1.22,marginBottom:12}}>
              You Keep<br/>
              <span style={{color:"#DB2648"}}>India Moving.</span><br/>
              We've Got Your Back.
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,.5)",lineHeight:1.7}}>Your platform for enquiries, surveys, quotations, operations, and invoices — built for speed, built for you.</p>
          </div>

          {/* Stats grid */}
          <div className="grid-2" style={{marginBottom:28}}>
            {STATS.map(s=>(
              <div key={s.l} className="stat-card">
                <div style={{width:32,height:32,borderRadius:9,background:"rgba(219,38,72,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>{s.icon}</div>
                <div>
                  <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:17,color:"#fff",lineHeight:1}}>{s.n}</div>
                  <div style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"rgba(255,255,255,.4)",marginTop:3}}>{s.l}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rotating quote */}
          <div className="quote-box">
            <div className="quote-text" key={quoteIdx}>"{QUOTES[quoteIdx].q}"</div>
            <div className="quote-by">— {QUOTES[quoteIdx].by}</div>
            <div className="dot-nav">
              {QUOTES.map((_,i)=>(
                <div key={i} className={`dot${quoteIdx===i?" active":""}`} onClick={()=>setQuoteIdx(i)}/>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{paddingTop:24,marginTop:8,borderTop:"1px solid rgba(255,255,255,.06)",fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span>© 2026 Sure Shift Relocation Services Pvt. Ltd.</span>
            <span>Delhi · Mumbai · Bangalore</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="auth-right">
          {/* Tabs */}
          <div className="tabs-bar">
            {[{id:"login",l:"Employee Login"},{id:"signup",l:"Partner Sign Up"}].map(t=>(
              <button key={t.id} className={`tab-btn${tab===t.id?" active":""}`}
                onClick={()=>{setTab(t.id);setLocalErr("");}}>
                {t.l}
              </button>
            ))}
          </div>

          <div className="auth-right-inner">
            {/* Error / Success banner */}
            {err && (
              <div style={{
                background: isSuccess ? "rgba(5,150,105,.07)" : "rgba(220,38,38,.06)",
                border: `1px solid ${isSuccess?"rgba(5,150,105,.25)":"rgba(220,38,38,.2)"}`,
                borderRadius:10,padding:"11px 14px",marginBottom:20,
                fontFamily:"'Inter',sans-serif",fontSize:13,
                color:isSuccess?"#065F46":"#DC2626",
                display:"flex",gap:9,alignItems:"flex-start",lineHeight:1.5
              }}>
                <span style={{flexShrink:0}}>{isSuccess?"✅":"⚠️"}</span>
                <span>{err}</span>
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {tab==="login" && (
              <div className="form-section">
                <div style={{marginBottom:24}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:23,color:"#0F172A",marginBottom:5}}>Good {timeGreeting()} 👋</h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.55}}>Sign in to your Sure Shift ERP workspace and get things moving.</p>
                </div>

                <form onSubmit={handleLogin}>
                  <div style={{marginBottom:16}}>
                    <label className="a-label">Email address</label>
                    <input className="a-inp" type="email" placeholder="you@sureshift.in"
                      value={lf.email} autoFocus
                      onChange={e=>{setLf({...lf,email:e.target.value});setLocalErr("");}}
                      onKeyDown={e=>e.key==="Enter"&&handleLogin(e)}/>
                  </div>

                  <div style={{marginBottom:4}}>
                    <label className="a-label">Password</label>
                    <div className="pw-wrap">
                      <input className="a-inp" type={showPwd?"text":"password"} placeholder="Enter your password"
                        value={lf.password}
                        onChange={e=>{setLf({...lf,password:e.target.value});setLocalErr("");}}
                        onKeyDown={e=>e.key==="Enter"&&handleLogin(e)}/>
                      <button type="button" className="eye-btn" onClick={()=>setShowPwd(v=>!v)} aria-label={showPwd?"Hide password":"Show password"}>
                        {showPwd
                          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="remember-row">
                    <label className="check-label">
                      <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
                      Keep me signed in
                    </label>
                    <button type="button" className="a-link">Forgot password?</button>
                  </div>

                  <button type="submit" className="a-btn" disabled={busy}>
                    {busy
                      ? <><div style={{width:16,height:16,border:"2.5px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .75s linear infinite"}}/> Signing in…</>
                      : "Sign in to ERP →"
                    }
                  </button>
                </form>

                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:20,padding:"12px 14px",background:"#F8FAFC",borderRadius:10,border:"1px solid #E8ECF4"}}>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#64748B"}}>🔒 Secured with role-based access control</span>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#94A3B8"}}>PocketBase v0.36</span>
                </div>

                <p className="bottom-note">
                  A vendor or partner?{" "}
                  <button className="a-link" onClick={()=>{setTab("signup");setLocalErr("");}}>Sign up here</button>
                </p>
              </div>
            )}

            {/* ── SIGNUP FORM ── */}
            {tab==="signup" && (
              <div className="form-section">
                <div style={{marginBottom:22}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:22,color:"#0F172A",marginBottom:5}}>Join Our Partner Network</h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.55}}>Register as a Sure Shift partner. Your account will be activated within 24 hours.</p>
                </div>

                <form onSubmit={handleSignup}>
                  <div className="grid-2" style={{marginBottom:12}}>
                    <div>
                      <label className="a-label">Full name</label>
                      <input className="a-inp" placeholder="Your full name" value={sf.name} autoFocus
                        onChange={e=>{setSf({...sf,name:e.target.value});setLocalErr("");}}/>
                    </div>
                    <div>
                      <label className="a-label">Phone number</label>
                      <input className="a-inp" placeholder="+91 9XXXXXXXXX" type="tel" value={sf.phone}
                        onChange={e=>{setSf({...sf,phone:e.target.value});setLocalErr("");}}/>
                    </div>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label className="a-label">Business email</label>
                    <input className="a-inp" placeholder="you@company.com" type="email" value={sf.email}
                      onChange={e=>{setSf({...sf,email:e.target.value});setLocalErr("");}}/>
                  </div>

                  <div className="grid-2" style={{marginBottom:12}}>
                    <div>
                      <label className="a-label">Company / Firm name</label>
                      <input className="a-inp" placeholder="Your company name" value={sf.company}
                        onChange={e=>{setSf({...sf,company:e.target.value});setLocalErr("");}}/>
                    </div>
                    <div>
                      <label className="a-label">Partner type</label>
                      <select className={`a-sel${!sf.partnerType?" placeholder":""}`} value={sf.partnerType}
                        onChange={e=>{setSf({...sf,partnerType:e.target.value});setLocalErr("");}}>
                        <option value="" disabled>Select type…</option>
                        <option value="vehicle">🚛 Vehicle Partner</option>
                        <option value="manpower">👷 Manpower Partner</option>
                        <option value="material">📦 Material Partner</option>
                        <option value="business">🤝 Business Partner</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2" style={{marginBottom:20}}>
                    <div>
                      <label className="a-label">Password</label>
                      <div className="pw-wrap">
                        <input className="a-inp" type={showPwd?"text":"password"} placeholder="Min 8 characters" value={sf.password}
                          onChange={e=>{setSf({...sf,password:e.target.value});setLocalErr("");}}/>
                        <button type="button" className="eye-btn" onClick={()=>setShowPwd(v=>!v)} aria-label="Toggle password">
                          {showPwd
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="a-label">Confirm password</label>
                      <div className="pw-wrap">
                        <input className="a-inp" type={showCpwd?"text":"password"} placeholder="Repeat password"
                          value={sf.confirm}
                          style={{borderColor: sf.confirm && sf.confirm!==sf.password ? "#F87171" : ""}}
                          onChange={e=>{setSf({...sf,confirm:e.target.value});setLocalErr("");}}/>
                        <button type="button" className="eye-btn" onClick={()=>setShowCpwd(v=>!v)} aria-label="Toggle confirm">
                          {showCpwd
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="a-btn">Register as Partner →</button>
                </form>

                <p className="bottom-note">
                  Already have an account?{" "}
                  <button className="a-link" onClick={()=>{setTab("login");setLocalErr("");}}>Sign in here</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

function Shell() {
  const {user,logout}=useAppAuth();
  const [nav,setNav]=useState("dashboard");
  const r=ROLES[user?.role]||{};
  const visNav=NAV.filter(n=>n.roles.includes("*")||n.roles.includes(user?.role));
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#F7F9FC",fontFamily:"'Inter',sans-serif"}}>
      {/* Sidebar */}
      <div style={{width:232,background:"#0F172A",display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Logo */}
        <div style={{padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(219,38,72,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={19} height={19} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#DB2648" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:15,color:"#fff",letterSpacing:"1px"}}>SURESHIFT</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,.3)",letterSpacing:"2px",textTransform:"uppercase"}}>ERP v2.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"12px 10px",overflowY:"auto"}}>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.25)",letterSpacing:"1.5px",textTransform:"uppercase",padding:"0 10px 8px"}}>MAIN MENU</div>
          {visNav.map(n=>(
            <button key={n.id} className={`nav-btn${nav===n.id?" active":""}`} onClick={()=>setNav(n.id)}>
              <span style={{fontSize:14,width:18,textAlign:"center"}}>{n.icon}</span>
              <span>{n.label}</span>
              {nav===n.id&&<span style={{marginLeft:"auto",width:6,height:6,borderRadius:"50%",background:"#DB2648"}}/>}
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{padding:"14px 12px",borderTop:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"8px 10px",background:"rgba(255,255,255,.04)",borderRadius:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:`${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{r.icon}</div>
            <div style={{flex:1,overflow:"hidden"}}>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,fontWeight:700,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name}</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,color:"rgba(255,255,255,.35)"}}>{r.label} · {user?.branch}</div>
            </div>
          </div>
          <button onClick={logout} style={{width:"100%",padding:"8px",background:"rgba(219,38,72,.12)",color:"#FB7185",border:"1px solid rgba(219,38,72,.2)",borderRadius:9,fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Top bar */}
        <div style={{background:"#fff",borderBottom:"1px solid #E8ECF4",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,boxShadow:"0 1px 3px rgba(15,23,42,.04)"}}>
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:15,fontWeight:700,color:"#0F172A"}}>
            {visNav.find(n=>n.id===nav)?.icon}&nbsp; {visNav.find(n=>n.id===nav)?.label}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#94A3B8"}}>FY {FY}</span>
            <span className="erp-tag" style={{background:`${r.color}15`,color:r.color}}>{user?.branch}</span>
            <span className="erp-tag" style={{background:"rgba(15,23,42,.06)",color:"#0F172A"}}>{r.label}</span>
          </div>
        </div>

        {/* Page */}
        <div style={{flex:1,overflow:"auto",padding:24}}>
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

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Tag({children,color="#6B7280"}){
  return <span className="erp-tag" style={{background:`${color}15`,color}}>{children}</span>;
}

const STAGE_COLORS={
  new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626",
  pending:"#D97706",assigned:"#2563EB",scheduled:"#7C3AED","in-progress":"#0D9488",completed:"#059669","report-filed":"#059669",
  draft:"#94A3B8",sent:"#2563EB",viewed:"#D97706",negotiating:"#7C3AED",approved:"#059669",converted:"#059669",
  "token-pending":"#D97706","token-received":"#059669",confirmed:"#2563EB","vendor-assigned":"#7C3AED","ops-ready":"#0D9488","in-transit":"#DB2648",delivered:"#059669",cancelled:"#DC2626",
  "dispatch-mat":"#D97706",packing:"#7C3AED",loading:"#2563EB",unloading:"#0D9488",
  partial:"#D97706",paid:"#059669",overdue:"#DC2626",
  active:"#059669",inactive:"#94A3B8",
  open:"#2563EB",resolved:"#059669",closed:"#94A3B8",
  vehicle_vendor:"#0284C7",manpower_vendor:"#7C3AED",
  low:"#94A3B8",medium:"#D97706",high:"#DB2648",critical:"#DC2626",
  household:"#2563EB",office:"#7C3AED",international:"#059669",vehicle:"#D97706",bike:"#0D9488",storage:"#0284C7",commercial:"#DB2648",courier:"#94A3B8",
  website:"#2563EB",gmb:"#D97706",phone:"#0D9488",whatsapp:"#059669",reference:"#7C3AED",
};
function STag({v}){ const c=STAGE_COLORS[v]||"#94A3B8"; return <Tag color={c}>{v}</Tag>; }

function Loader(){return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48}}><div style={{width:28,height:28,border:"3px solid rgba(219,38,72,.15)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .8s linear infinite"}}/></div>;}
function Empty({icon="📭",text="No records found"}){return <div style={{textAlign:"center",padding:"48px 20px"}}><div style={{fontSize:32,marginBottom:10}}>{icon}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"#94A3B8",fontWeight:500}}>{text}</div></div>;}

function Modal({title,onClose,children,wide}){
  return(
    <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-box" style={{maxWidth:wide?680:540}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid #E8ECF4",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#0F172A",margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,color:"#94A3B8",cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
        </div>
        <div style={{padding:"22px 24px"}}>{children}</div>
      </div>
    </div>
  );
}

function Field({label,req,half,children}){
  return(
    <div style={{marginBottom:14,gridColumn:half?"span 1":"span 2"}}>
      <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11.5,fontWeight:600,color:"#64748B",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>
        {label}{req&&<span style={{color:"#DB2648"}}> *</span>}
      </label>
      {children}
    </div>
  );
}

function FormGrid({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>{children}</div>;}

function DataTable({cols,rows,loading,empty="No records"}){
  if(loading) return <Loader/>;
  if(!rows?.length) return <Empty text={empty}/>;
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead>
          <tr style={{borderBottom:"2px solid #E8ECF4"}}>
            {cols.map(c=><th key={c.key} style={{padding:"9px 14px",textAlign:"left",fontFamily:"'Inter',sans-serif",fontSize:10.5,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={row.id||i} className="trow" style={{borderBottom:"1px solid #F1F5F9"}}>
              {cols.map(c=><td key={c.key} style={{padding:"11px 14px",fontFamily:"'Inter',sans-serif",fontSize:13,color:"#374151",whiteSpace:c.wrap?"normal":"nowrap"}}>{c.render?c.render(row):row[c.key]||<span style={{color:"#CBD5E1"}}>—</span>}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({label,value,sub,color="#DB2648",icon}){
  return(
    <div className="erp-card">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
        <div style={{width:42,height:42,borderRadius:11,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{icon}</div>
        <span className="erp-tag" style={{background:`${color}10`,color,fontSize:10}}>{sub}</span>
      </div>
      <div style={{fontFamily:"'Poppins',sans-serif",fontSize:28,fontWeight:800,color:"#0F172A",lineHeight:1,marginBottom:4}}>{value}</div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#94A3B8",fontWeight:500}}>{label}</div>
    </div>
  );
}

function PageHeader({title,action}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#0F172A"}}>{title}</div>
      {action}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function DashboardPage(){
  const {items:enqs,loading:eL}=useCollection("enquiries",{sort:"-created",perPage:100});
  const {items:cfrs,loading:cL}=useCollection("cfr",{sort:"-created",perPage:100});
  const {items:invs,loading:iL}=useCollection("invoices",{sort:"-created",perPage:100});
  const {items:vens,loading:vL}=useCollection("vendors",{sort:"-created"});
  const open=cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).length;
  const outstanding=invs.reduce((s,i)=>s+(i.outstanding||0),0);
  const active=vens.filter(v=>v.status==="active").length;
  return(
    <div className="page-fade">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <StatCard label="Total Enquiries" value={eL?"…":enqs.length} sub="loaded" icon="📥" color="#2563EB"/>
        <StatCard label="Active Bookings" value={cL?"…":open} sub="in progress" icon="📦" color="#D97706"/>
        <StatCard label="Outstanding" value={iL?"…":`₹${(outstanding/1000).toFixed(0)}K`} sub="pending" icon="💳" color="#DB2648"/>
        <StatCard label="Active Vendors" value={vL?"…":active} sub="registered" icon="🤝" color="#059669"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="erp-card">
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A",marginBottom:14}}>Recent Enquiries</div>
          <DataTable loading={eL} rows={enqs.slice(0,6)} cols={[
            {key:"enq_number",label:"Ref #"},
            {key:"name",label:"Customer"},
            {key:"move_type",label:"Type",render:r=><STag v={r.move_type}/>},
            {key:"stage",label:"Stage",render:r=><STag v={r.stage}/>},
          ]} empty="No enquiries"/>
        </div>
        <div className="erp-card">
          <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A",marginBottom:14}}>Recent Bookings</div>
          <DataTable loading={cL} rows={cfrs.slice(0,6)} cols={[
            {key:"cfr_number",label:"CFR #"},
            {key:"grand_total",label:"Value",render:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
            {key:"move_date",label:"Move Date"},
            {key:"status",label:"Status",render:r=><STag v={r.status}/>},
          ]} empty="No bookings"/>
        </div>
      </div>
    </div>
  );
}

// ── ENQUIRIES ─────────────────────────────────────────────────────────────────
function EnquiriesPage(){
  const {user}=useAppAuth();
  const [show,setShow]=useState(false);
  const [q,setQ]=useState(""); const [sf,setSf]=useState("");
  const {items,loading,refresh}=useCollection("enquiries",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("enquiries");
  const [f,setF]=useState({name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",move_type:"household",source:"website",stage:"new",branch:user?.branch||"NDLH",fy:FY,seq:"0",apt_size:"",move_date:"",notes:""});
  const filtered=items.filter(e=>{
    const qq=q.toLowerCase();
    return(!qq||e.name?.toLowerCase().includes(qq)||e.phone?.includes(qq)||e.enq_number?.toLowerCase().includes(qq))&&(!sf||e.stage===sf);
  });
  const save=async()=>{
    if(!f.name||!f.phone||!f.from_address||!f.to_address){alert("Fill required fields");return;}
    try{await create(f);setShow(false);setF({...f,name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",apt_size:"",move_date:"",notes:""});refresh();}catch(e){alert(e.message);}
  };
  return(
    <div className="page-fade">
      <PageHeader title={`Enquiries (${filtered.length})`} action={
        <div style={{display:"flex",gap:10}}>
          <input className="erp-inp" style={{width:220}} placeholder="Search name, phone, ref…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select className="erp-sel" style={{width:150}} value={sf} onChange={e=>setSf(e.target.value)}>
            <option value="">All Stages</option>
            {ENQ_STAGES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Enquiry</button>
        </div>
      }/>
      <div className="erp-card">
        <DataTable loading={loading} rows={filtered} empty="No enquiries yet" cols={[
          {key:"enq_number",label:"Ref #",render:r=><strong style={{color:"#0F172A",fontFamily:"'Inter',sans-serif"}}>{r.enq_number||"—"}</strong>},
          {key:"name",label:"Customer"},
          {key:"phone",label:"Phone"},
          {key:"from_address",label:"From",wrap:true},
          {key:"to_address",label:"To",wrap:true},
          {key:"move_type",label:"Type",render:r=><STag v={r.move_type}/>},
          {key:"source",label:"Source",render:r=><STag v={r.source}/>},
          {key:"stage",label:"Stage",render:r=><STag v={r.stage}/>},
          {key:"move_date",label:"Move Date"},
        ]}/>
      </div>
      {show&&<Modal title="New Enquiry" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Customer Name" req half><input className="erp-inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Full name"/></Field>
          <Field label="Phone" req half><input className="erp-inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="10-digit mobile"/></Field>
          <Field label="Alt Phone" half><input className="erp-inp" value={f.alt_phone} onChange={e=>setF({...f,alt_phone:e.target.value})} placeholder="Optional"/></Field>
          <Field label="Email" half><input className="erp-inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} placeholder="email@example.com"/></Field>
          <Field label="From Address" req half><input className="erp-inp" value={f.from_address} onChange={e=>setF({...f,from_address:e.target.value})} placeholder="Pickup address"/></Field>
          <Field label="To Address" req half><input className="erp-inp" value={f.to_address} onChange={e=>setF({...f,to_address:e.target.value})} placeholder="Drop address"/></Field>
          <Field label="Move Type" half><select className="erp-sel" value={f.move_type} onChange={e=>setF({...f,move_type:e.target.value})}>{MOVE_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Source" half><select className="erp-sel" value={f.source} onChange={e=>setF({...f,source:e.target.value})}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Branch" half><select className="erp-sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Field>
          <Field label="Move Date" half><input className="erp-inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Field>
          <Field label="Apt Size" half><input className="erp-inp" value={f.apt_size} onChange={e=>setF({...f,apt_size:e.target.value})} placeholder="e.g. 2BHK"/></Field>
        </FormGrid>
        <Field label="Notes"><textarea className="erp-inp" rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Additional notes" style={{resize:"vertical"}}/></Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create Enquiry"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── SURVEYS ───────────────────────────────────────────────────────────────────
function SurveysPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("surveys",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("surveys");
  const [f,setF]=useState({enquiry_id:"",agent_name:"",survey_date:"",survey_time:"",floor:"",has_lift:false,distance:"",condition:"",agent_notes:"",status:"pending"});
  const SS=["pending","assigned","scheduled","in-progress","completed","report-filed"];
  const save=async()=>{try{await create(f);setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Surveys (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Survey</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No surveys yet" cols={[
          {key:"survey_number",label:"Survey #"},
          {key:"enquiry_id",label:"Enquiry"},
          {key:"agent_name",label:"Agent"},
          {key:"survey_date",label:"Date"},
          {key:"survey_time",label:"Time"},
          {key:"floor",label:"Floor"},
          {key:"has_lift",label:"Lift",render:r=>r.has_lift?"✅":"❌"},
          {key:"distance",label:"Distance"},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Survey" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Enquiry ID" req half><input className="erp-inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></Field>
          <Field label="Agent Name" half><input className="erp-inp" value={f.agent_name} onChange={e=>setF({...f,agent_name:e.target.value})} placeholder="Surveyor name"/></Field>
          <Field label="Survey Date" half><input className="erp-inp" type="date" value={f.survey_date} onChange={e=>setF({...f,survey_date:e.target.value})}/></Field>
          <Field label="Survey Time" half><input className="erp-inp" type="time" value={f.survey_time} onChange={e=>setF({...f,survey_time:e.target.value})}/></Field>
          <Field label="Floor" half><input className="erp-inp" type="number" value={f.floor} onChange={e=>setF({...f,floor:e.target.value})} placeholder="Floor number"/></Field>
          <Field label="Has Lift" half><select className="erp-sel" value={f.has_lift} onChange={e=>setF({...f,has_lift:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="Distance" half><input className="erp-inp" value={f.distance} onChange={e=>setF({...f,distance:e.target.value})} placeholder="e.g. 450 km"/></Field>
          <Field label="Status" half><select className="erp-sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
        </FormGrid>
        <Field label="Notes"><textarea className="erp-inp" rows={2} value={f.agent_notes} onChange={e=>setF({...f,agent_notes:e.target.value})} style={{resize:"vertical"}}/></Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create Survey"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── QUOTATIONS ────────────────────────────────────────────────────────────────
function QuotationsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("quotations",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("quotations");
  const [f,setF]=useState({enquiry_id:"",subtotal:"",discount_pct:"0",tax_amt:"",grand_total:"",valid_days:"7",move_date:"",notes:"",status:"draft",revisions:0,base_id:"",quot_number:""});
  const SS=["draft","sent","viewed","negotiating","approved","recalling","converted","lost"];
  const save=async()=>{try{await create({...f,subtotal:+f.subtotal,discount_pct:+f.discount_pct,tax_amt:+f.tax_amt,grand_total:+f.grand_total,valid_days:+f.valid_days});setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Quotations (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Quotation</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No quotations yet" cols={[
          {key:"quot_number",label:"Quot #"},
          {key:"enquiry_id",label:"Enquiry"},
          {key:"subtotal",label:"Subtotal",render:r=>`₹${(r.subtotal||0).toLocaleString("en-IN")}`},
          {key:"discount_pct",label:"Disc%",render:r=>`${r.discount_pct||0}%`},
          {key:"tax_amt",label:"Tax",render:r=>`₹${(r.tax_amt||0).toLocaleString("en-IN")}`},
          {key:"grand_total",label:"Total",render:r=><strong style={{color:"#0F172A"}}>₹{(r.grand_total||0).toLocaleString("en-IN")}</strong>},
          {key:"valid_days",label:"Valid",render:r=>`${r.valid_days||0}d`},
          {key:"move_date",label:"Move Date"},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Quotation" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Enquiry ID" req half><input className="erp-inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})} placeholder="Enquiry record ID"/></Field>
          <Field label="Status" half><select className="erp-sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Subtotal (₹)" req half><input className="erp-inp" type="number" value={f.subtotal} onChange={e=>setF({...f,subtotal:e.target.value})}/></Field>
          <Field label="Discount %" half><input className="erp-inp" type="number" value={f.discount_pct} onChange={e=>setF({...f,discount_pct:e.target.value})}/></Field>
          <Field label="Tax Amount (₹)" half><input className="erp-inp" type="number" value={f.tax_amt} onChange={e=>setF({...f,tax_amt:e.target.value})}/></Field>
          <Field label="Grand Total (₹)" req half><input className="erp-inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})}/></Field>
          <Field label="Valid Days" half><input className="erp-inp" type="number" value={f.valid_days} onChange={e=>setF({...f,valid_days:e.target.value})}/></Field>
          <Field label="Move Date" half><input className="erp-inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Field>
        </FormGrid>
        <Field label="Notes"><textarea className="erp-inp" rows={2} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} style={{resize:"vertical"}}/></Field>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create Quotation"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── BOOKINGS ──────────────────────────────────────────────────────────────────
function BookingsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("cfr",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("cfr");
  const [f,setF]=useState({enquiry_id:"",quotation_id:"",grand_total:"",token_amt:"",move_date:"",vehicle:"",vehicle_no:"",is_interstate:false,status:"token-pending"});
  const SS=["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"];
  const save=async()=>{try{await create({...f,grand_total:+f.grand_total,token_amt:+f.token_amt,total_paid:0});setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Bookings / CFR (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Booking</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No bookings yet" cols={[
          {key:"cfr_number",label:"CFR #"},
          {key:"enquiry_id",label:"Enquiry"},
          {key:"grand_total",label:"Value",render:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
          {key:"token_amt",label:"Token",render:r=>`₹${(r.token_amt||0).toLocaleString("en-IN")}`},
          {key:"total_paid",label:"Paid",render:r=>`₹${(r.total_paid||0).toLocaleString("en-IN")}`},
          {key:"move_date",label:"Move Date"},
          {key:"vehicle",label:"Vehicle"},
          {key:"vehicle_no",label:"Veh No"},
          {key:"is_interstate",label:"Interstate",render:r=>r.is_interstate?"✅":"❌"},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Booking (CFR)" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Enquiry ID" req half><input className="erp-inp" value={f.enquiry_id} onChange={e=>setF({...f,enquiry_id:e.target.value})}/></Field>
          <Field label="Quotation ID" req half><input className="erp-inp" value={f.quotation_id} onChange={e=>setF({...f,quotation_id:e.target.value})}/></Field>
          <Field label="Grand Total (₹)" req half><input className="erp-inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})}/></Field>
          <Field label="Token Amount (₹)" half><input className="erp-inp" type="number" value={f.token_amt} onChange={e=>setF({...f,token_amt:e.target.value})}/></Field>
          <Field label="Move Date" half><input className="erp-inp" type="date" value={f.move_date} onChange={e=>setF({...f,move_date:e.target.value})}/></Field>
          <Field label="Vehicle Type" half><input className="erp-inp" value={f.vehicle} onChange={e=>setF({...f,vehicle:e.target.value})} placeholder="e.g. 20ft container"/></Field>
          <Field label="Vehicle No" half><input className="erp-inp" value={f.vehicle_no} onChange={e=>setF({...f,vehicle_no:e.target.value})} placeholder="DL 1C 0000"/></Field>
          <Field label="Interstate" half><select className="erp-sel" value={f.is_interstate} onChange={e=>setF({...f,is_interstate:e.target.value==="true"})}><option value="false">No</option><option value="true">Yes</option></select></Field>
          <Field label="Status" half><select className="erp-sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
        </FormGrid>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create Booking"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── OPERATIONS ────────────────────────────────────────────────────────────────
function OperationsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("operations",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("operations");
  const [f,setF]=useState({cfr_id:"",bilty_no:"",invoice_no:"",stage:"dispatch-mat"});
  const SS=["dispatch-mat","packing","loading","in-transit","unloading","delivered"];
  const save=async()=>{try{await create(f);setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Operations (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Operation</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No operations yet" cols={[
          {key:"ops_number",label:"Ops #"},
          {key:"cfr_id",label:"CFR"},
          {key:"bilty_no",label:"Bilty #"},
          {key:"invoice_no",label:"Invoice #"},
          {key:"stage",label:"Stage",render:r=><STag v={r.stage}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Operation" onClose={()=>setShow(false)}>
        <FormGrid>
          <Field label="CFR ID" req half><input className="erp-inp" value={f.cfr_id} onChange={e=>setF({...f,cfr_id:e.target.value})}/></Field>
          <Field label="Stage" half><select className="erp-sel" value={f.stage} onChange={e=>setF({...f,stage:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Bilty #" half><input className="erp-inp" value={f.bilty_no} onChange={e=>setF({...f,bilty_no:e.target.value})}/></Field>
          <Field label="Invoice #" half><input className="erp-inp" value={f.invoice_no} onChange={e=>setF({...f,invoice_no:e.target.value})}/></Field>
        </FormGrid>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── INVOICES ──────────────────────────────────────────────────────────────────
function InvoicesPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("invoices",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("invoices");
  const [f,setF]=useState({cfr_id:"",grand_total:"",paid_amt:"0",outstanding:"",invoice_date:"",due_date:"",gst_no:"",hsn_code:"998543",status:"draft"});
  const SS=["draft","sent","partial","paid","overdue","cancelled"];
  const save=async()=>{const gt=+f.grand_total,pa=+f.paid_amt;try{await create({...f,grand_total:gt,paid_amt:pa,outstanding:gt-pa});setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Invoices (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Invoice</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No invoices yet" cols={[
          {key:"inv_number",label:"Invoice #"},
          {key:"cfr_id",label:"CFR"},
          {key:"grand_total",label:"Amount",render:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
          {key:"paid_amt",label:"Paid",render:r=>`₹${(r.paid_amt||0).toLocaleString("en-IN")}`},
          {key:"outstanding",label:"Outstanding",render:r=><strong style={{color:(r.outstanding||0)>0?"#DC2626":"#059669"}}>₹{(r.outstanding||0).toLocaleString("en-IN")}</strong>},
          {key:"invoice_date",label:"Date"},
          {key:"due_date",label:"Due"},
          {key:"gst_no",label:"GST"},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New Invoice" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="CFR ID" req half><input className="erp-inp" value={f.cfr_id} onChange={e=>setF({...f,cfr_id:e.target.value})}/></Field>
          <Field label="Status" half><select className="erp-sel" value={f.status} onChange={e=>setF({...f,status:e.target.value})}>{SS.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="Grand Total (₹)" req half><input className="erp-inp" type="number" value={f.grand_total} onChange={e=>setF({...f,grand_total:e.target.value})}/></Field>
          <Field label="Paid Amount (₹)" half><input className="erp-inp" type="number" value={f.paid_amt} onChange={e=>setF({...f,paid_amt:e.target.value})}/></Field>
          <Field label="Invoice Date" half><input className="erp-inp" type="date" value={f.invoice_date} onChange={e=>setF({...f,invoice_date:e.target.value})}/></Field>
          <Field label="Due Date" half><input className="erp-inp" type="date" value={f.due_date} onChange={e=>setF({...f,due_date:e.target.value})}/></Field>
          <Field label="GST No" half><input className="erp-inp" value={f.gst_no} onChange={e=>setF({...f,gst_no:e.target.value})} placeholder="07AABCS1234A1Z1"/></Field>
          <Field label="HSN Code" half><input className="erp-inp" value={f.hsn_code} onChange={e=>setF({...f,hsn_code:e.target.value})}/></Field>
        </FormGrid>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Create Invoice"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── VENDORS ───────────────────────────────────────────────────────────────────
function VendorsPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("vendors",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("vendors");
  const [f,setF]=useState({name:"",type:"vehicle_vendor",contact:"",phone:"",email:"",gst:"",branch:"NDLH",status:"active",rating:5});
  const save=async()=>{if(!f.name||!f.contact){alert("Name and contact required");return;}try{await create({...f,rating:+f.rating});setShow(false);refresh();}catch(e){alert(e.message);}};
  return(
    <div className="page-fade">
      <PageHeader title={`Vendors (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New Vendor</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No vendors yet" cols={[
          {key:"name",label:"Vendor Name",render:r=><strong style={{color:"#0F172A"}}>{r.name}</strong>},
          {key:"type",label:"Type",render:r=><STag v={r.type}/>},
          {key:"contact",label:"Contact"},
          {key:"phone",label:"Phone"},
          {key:"branch",label:"Branch"},
          {key:"rating",label:"Rating",render:r=><span title={`${r.rating}/5`}>{"⭐".repeat(Math.min(5,r.rating||0))}</span>},
          {key:"total_jobs",label:"Jobs",render:r=>r.total_jobs||0},
          {key:"pending_payout",label:"Payout",render:r=>`₹${(r.pending_payout||0).toLocaleString("en-IN")}`},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="Add Vendor" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Vendor Name" req half><input className="erp-inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
          <Field label="Type" half><select className="erp-sel" value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="vehicle_vendor">Vehicle Vendor</option><option value="manpower_vendor">Manpower Vendor</option></select></Field>
          <Field label="Contact Person" req half><input className="erp-inp" value={f.contact} onChange={e=>setF({...f,contact:e.target.value})}/></Field>
          <Field label="Phone" half><input className="erp-inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Field>
          <Field label="Email" half><input className="erp-inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field>
          <Field label="GST" half><input className="erp-inp" value={f.gst} onChange={e=>setF({...f,gst:e.target.value})}/></Field>
          <Field label="Branch" half><select className="erp-sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Field>
          <Field label="Rating (1–5)" half><input className="erp-inp" type="number" min="1" max="5" value={f.rating} onChange={e=>setF({...f,rating:e.target.value})}/></Field>
        </FormGrid>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Add Vendor"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────────────────────
function UsersPage(){
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("users",{sort:"-created",perPage:200});
  const [f,setF]=useState({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!f.email||!f.password||!f.name){alert("Email, password and name required");return;}
    setSaving(true);
    try{await pb.collection("users").create({...f,passwordConfirm:f.password,emailVisibility:true});setShow(false);setF({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});refresh();}
    catch(e){alert(e.message||"Failed to create user");}
    finally{setSaving(false);}
  };
  return(
    <div className="page-fade">
      <PageHeader title={`Users (${items.length})`} action={<button className="erp-btn erp-btn-primary" onClick={()=>setShow(true)}>+ New User</button>}/>
      <div className="erp-card">
        <DataTable loading={loading} rows={items} empty="No users yet" cols={[
          {key:"name",label:"Name",render:r=><strong style={{color:"#0F172A"}}>{r.name}</strong>},
          {key:"email",label:"Email"},
          {key:"phone",label:"Phone"},
          {key:"role",label:"Role",render:r=>{const rr=ROLES[r.role]||{};return <span className="erp-tag" style={{background:`${rr.color||"#94A3B8"}15`,color:rr.color||"#94A3B8"}}>{rr.icon} {rr.label}</span>;}},
          {key:"branch",label:"Branch"},
          {key:"status",label:"Status",render:r=><STag v={r.status}/>},
        ]}/>
      </div>
      {show&&<Modal title="New User" onClose={()=>setShow(false)} wide>
        <FormGrid>
          <Field label="Full Name" req half><input className="erp-inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
          <Field label="Phone" half><input className="erp-inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Field>
          <Field label="Email" req half><input className="erp-inp" type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field>
          <Field label="Password" req half><input className="erp-inp" type="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></Field>
          <Field label="Role" half><select className="erp-sel" value={f.role} onChange={e=>setF({...f,role:e.target.value})}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Field>
          <Field label="Branch" half><select className="erp-sel" value={f.branch} onChange={e=>setF({...f,branch:e.target.value})}>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}</select></Field>
        </FormGrid>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:6}}>
          <button className="erp-btn erp-btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
          <button className="erp-btn erp-btn-primary" onClick={save} disabled={saving}>{saving?"Creating…":"Create User"}</button>
        </div>
      </Modal>}
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────
function SettingsPage(){
  const {settings,saveSetting}=useAppAuth();
  const co=settings?.company||{};
  const [f,setF]=useState({name:"",gst:"",address:"",phone:"",email:"",website:""});
  const [saved,setSaved]=useState(false);
  useEffect(()=>{if(co.name)setF({name:co.name||"",gst:co.gst||"",address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||""});},[settings]);
  const save=async()=>{await saveSetting("company",f,"company");setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return(
    <div className="page-fade">
      <PageHeader title="Settings"/>
      <div className="erp-card" style={{maxWidth:640}}>
        <div style={{fontFamily:"'Poppins',sans-serif",fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:20}}>🏢 Company Information</div>
        <FormGrid>
          <Field label="Company Name" req half><input className="erp-inp" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
          <Field label="GST Number" half><input className="erp-inp" value={f.gst} onChange={e=>setF({...f,gst:e.target.value})}/></Field>
          <Field label="Phone" half><input className="erp-inp" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></Field>
          <Field label="Email" half><input className="erp-inp" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></Field>
          <Field label="Website" half><input className="erp-inp" value={f.website} onChange={e=>setF({...f,website:e.target.value})}/></Field>
        </FormGrid>
        <Field label="Registered Address"><textarea className="erp-inp" rows={2} value={f.address} onChange={e=>setF({...f,address:e.target.value})} style={{resize:"vertical"}}/></Field>
        <div style={{display:"flex",alignItems:"center",gap:14,marginTop:8}}>
          <button className="erp-btn erp-btn-primary" onClick={save}>Save Settings</button>
          {saved&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#059669",fontWeight:600}}>✅ Saved successfully</span>}
        </div>
      </div>
    </div>
  );
}
