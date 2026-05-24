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

// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL TOAST SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="success", dur=4000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur);
  }, []);
  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <ToastContainer toasts={toasts} remove={remove}/>
    </ToastCtx.Provider>
  );
}

function ToastContainer({ toasts, remove }) {
  if (!toasts.length) return null;
  const ICONS = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
    error:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    info:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  };
  const COLORS = { success:["#F0FDF4","#22C55E","#166534"], error:["#FFF5F5","#EF4444","#991B1B"], warning:["#FFFBEB","#F59E0B","#92400E"], info:["#EFF6FF","#3B82F6","#1E3A5F"] };
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10,maxWidth:380}}>
      <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {toasts.map(t => {
        const [bg,accent,text] = COLORS[t.type]||COLORS.info;
        return (
          <div key={t.id} style={{background:bg,border:`1px solid ${accent}40`,borderLeft:`4px solid ${accent}`,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10,boxShadow:"0 4px 16px rgba(0,0,0,.1)",animation:"slideInRight .25s ease",fontFamily:"'Inter',sans-serif"}}>
            <span style={{color:accent,flexShrink:0,marginTop:1}}>{ICONS[t.type]}</span>
            <span style={{flex:1,fontSize:13,color:text,lineHeight:1.5,fontWeight:500}}>{t.msg}</span>
            <button onClick={()=>remove(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:text,opacity:.5,fontSize:16,lineHeight:1,padding:"0 2px",flexShrink:0}}>×</button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  VALIDATION UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
const V = {
  required:  v => (!v || !String(v).trim()) ? "This field is required" : null,
  email:     v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email address" : null,
  phone:     v => v && !/^[+]?[\d\s\-().]{8,15}$/.test(v) ? "Enter a valid phone number" : null,
  minLen:    n => v => v && v.length < n ? `Minimum ${n} characters required` : null,
  numeric:   v => v && isNaN(Number(v)) ? "Must be a number" : null,
  positive:  v => v && Number(v) < 0 ? "Must be a positive number" : null,
  maxLen:    n => v => v && v.length > n ? `Maximum ${n} characters allowed` : null,
};

function validate(rules, data) {
  const errs = {};
  Object.entries(rules).forEach(([field, fns]) => {
    for (const fn of (Array.isArray(fns)?fns:[fns])) {
      const err = fn(data[field]);
      if (err) { errs[field] = err; break; }
    }
  });
  return errs;
}

// ─────────────────────────────────────────────────────────────────────────────
//  REALTIME INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function RealtimeBadge() {
  const [live, setLive] = useState(true);
  useEffect(() => {
    const check = () => setLive(pb.authStore.isValid || true);
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:live?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:`1px solid ${live?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"}`,borderRadius:99}}>
      <div style={{width:6,height:6,borderRadius:"50%",background:live?"#22C55E":"#EF4444",animation:"pulseDot 2s ease infinite"}}/>
      <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,fontWeight:600,color:live?"#166534":"#991B1B"}}>{live?"Live":"Offline"}</span>
    </div>
  );
}

// Validated Input component
function VInput({ label, name, value, onChange, errors, type="text", placeholder, req, icon, half, rows }) {
  const [focused, setFocused] = useState(false);
  const err = errors?.[name];
  const borderColor = err ? "#EF4444" : focused ? "#DB2648" : "#E2E8F0";
  const shadow = err ? "0 0 0 3px rgba(239,68,68,.09)" : focused ? "0 0 0 3px rgba(219,38,72,.09)" : "none";
  const baseStyle = { width:"100%", padding:"10px 13px", border:`1.5px solid ${borderColor}`, borderRadius:9, font:"400 13.5px/1.2 'Inter',sans-serif", color:"#0F172A", outline:"none", background:"#fff", transition:"all .18s", boxSizing:"border-box", boxShadow:shadow, paddingLeft: icon ? 36 : "10px 13px" };
  const labelStyle = { display:"block", fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color: err ? "#EF4444" : "#64748B", marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" };
  return (
    <div style={{ marginBottom:14, gridColumn: half ? "span 1" : "span 2" }}>
      <label style={labelStyle}>{label}{req && <span style={{color:"#DB2648"}}> *</span>}</label>
      <div style={{position:"relative"}}>
        {icon && <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"color .15s",color: focused ? "#DB2648" : err ? "#EF4444" : "#CBD5E1"}}>{icon}</span>}
        {rows
          ? <textarea className="inp" rows={rows} value={value} placeholder={placeholder}
              onChange={e=>onChange(name,e.target.value)}
              onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              style={{...baseStyle,resize:"vertical"}}/>
          : <input type={type} value={value} placeholder={placeholder}
              onChange={e=>onChange(name,e.target.value)}
              onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              style={baseStyle}/>
        }
      </div>
      {err && <p style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#EF4444",marginTop:4,display:"flex",alignItems:"center",gap:4}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {err}
      </p>}
    </div>
  );
}

function VSelect({ label, name, value, onChange, errors, options, req, half }) {
  const [focused, setFocused] = useState(false);
  const err = errors?.[name];
  const borderColor = err ? "#EF4444" : focused ? "#DB2648" : "#E2E8F0";
  return (
    <div style={{ marginBottom:14, gridColumn: half ? "span 1" : "span 2" }}>
      <label style={{display:"block",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:err?"#EF4444":"#64748B",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px"}}>{label}{req && <span style={{color:"#DB2648"}}> *</span>}</label>
      <select value={value} onChange={e=>onChange(name,e.target.value)}
        onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{appearance:"none",width:"100%",padding:"10px 36px 10px 13px",border:`1.5px solid ${borderColor}`,borderRadius:9,font:"400 13.5px/1 'Inter',sans-serif",color:value?"#0F172A":"#CBD5E1",outline:"none",background:`#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none' stroke='%2394A3B8' stroke-width='1.7'%3E%3Cpath d='M1 1l4.5 4.5L10 1'/%3E%3C/svg%3E") no-repeat right 13px center`,cursor:"pointer",boxSizing:"border-box",boxShadow:focused?"0 0 0 3px rgba(219,38,72,.09)":"none",transition:"all .18s"}}>
        <option value="">Select…</option>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
      {err && <p style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#EF4444",marginTop:4,display:"flex",alignItems:"center",gap:4}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {err}
      </p>}
    </div>
  );
}


export default function App() {
  const authHook = useAuth();
  const { settings, loading:settingsLoading, save:saveSetting } = useSettings();

  // Read token from URL immediately — before any auth check runs
  const [resetToken, setResetToken] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("view") === "reset" && p.get("token")) {
        const t = p.get("token");
        window.history.replaceState({}, "", window.location.pathname);
        return t;
      }
    } catch(_) {}
    return null;
  });

  const ctx = { ...authHook, settings, settingsLoading, saveSetting, ROLES,
    hasPerm:(mod,action)=>hasPerm(authHook.user,mod,action),
    isSuperAdmin:authHook.user?.role==="super_admin" };

  // Show reset page immediately — no auth needed
  if (resetToken) {
    return <ResetPasswordPage token={resetToken} onDone={()=>setResetToken(null)}/>;
  }

  // Show reset page immediately before auth check
  if (resetToken) return <ResetPasswordPage token={resetToken} onDone={()=>setResetToken(null)}/>;
  return (
    <ToastProvider>
      <AuthCtx.Provider value={ctx}>
        {authHook.loading?<Splash/>:authHook.user?<Shell/>:<Login/>}
      </AuthCtx.Provider>
    </ToastProvider>
  );
}

// ── Standalone Reset Password Page ────────────────────────────────────────────
function ResetPasswordPage({ token, onDone }) {
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPwd,   setShowPwd]   = useState(false);
  const [showCpwd,  setShowCpwd]  = useState(false);
  const [busy,      setBusy]      = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [done,      setDone]      = useState(false);
  const [ff,        setFf]        = useState(null);
  const ic = f => ff === f ? "#DB2648" : "#CBD5E1";

  const strength = !password ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ["#E2E8F0","#EF4444","#F59E0B","#22C55E"][strength];
  const strengthLabel = ["","Weak","Fair","Strong"][strength];

  const handleReset = async (e) => {
    e?.preventDefault();
    if (!password || !confirm) { setMsg({type:"error",text:"Please fill in both password fields."}); return; }
    if (password.length < 8)   { setMsg({type:"error",text:"Password must be at least 8 characters."}); return; }
    if (password !== confirm)  { setMsg({type:"error",text:"Passwords do not match."}); return; }
    setBusy(true); setMsg(null);
    try {
      await pb.collection("users").confirmPasswordReset(token, password, confirm);
      setDone(true);
      setTimeout(() => onDone(), 3000);
    } catch(_) {
      setMsg({type:"error",text:"This reset link is invalid or has expired. Please request a new one."});
    } finally { setBusy(false); }
  };

  const EyeOn  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const EyeOff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>;

  return (
    <div style={{minHeight:"100vh",background:"#F0F2F5",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Inter',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
        .rp-inp{width:100%;padding:11px 14px;border:1.5px solid #E2E8F0;border-radius:9px;font:400 14px 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:border-color .18s,box-shadow .18s;box-sizing:border-box}
        .rp-inp:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.09)}
        .rp-inp::placeholder{color:#CBD5E1}
        .rp-btn{width:100%;padding:13px;background:#DB2648;color:#fff;border:none;border-radius:10px;font:600 14.5px 'Inter',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .18s}
        .rp-btn:hover:not(:disabled){background:#B91C3C;transform:translateY(-1px)}
        .rp-btn:disabled{background:#CBD5E1;cursor:not-allowed}
        .rp-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;padding:3px;transition:color .15s}
        .rp-eye:hover{color:#475569}
        .rp-lbl{display:block;font:600 10.5px 'Inter',sans-serif;color:#64748B;letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px}
      `}</style>



      <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:1}}>
        {/* Card with brand color logo header */}
        <div style={{borderRadius:20,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.14)",animation:"fadeUp .25s ease"}}>

          {/* Logo section — brand color */}
          <div style={{background:"#DB2648",padding:"24px 36px",display:"flex",alignItems:"center",gap:11,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:-40,right:-40,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.07)",pointerEvents:"none"}}/>
            <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,.2)",border:"1.5px solid rgba(255,255,255,.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative"}}>
              <svg width={22} height={22} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{position:"relative"}}>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:16,color:"#fff",letterSpacing:"1.2px",lineHeight:1}}>SURESHIFT</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9,color:"rgba(255,255,255,.55)",letterSpacing:"2.5px",textTransform:"uppercase",marginTop:2}}>ERP v2.0</div>
            </div>
          </div>

          {/* Form section — white */}
          <div style={{background:"#fff",padding:"32px 36px 32px"}}>
          {done ? (
            <div style={{textAlign:"center",padding:"12px 0"}}>
              <div style={{width:72,height:72,borderRadius:"50%",background:"#F0FDF4",border:"2px solid #86EFAC",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"scaleIn .4s ease"}}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              </div>
              <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:22,color:"#0F172A",marginBottom:10}}>Password Updated!</h2>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,color:"#64748B",lineHeight:1.7,marginBottom:24}}>Your password has been reset successfully. Redirecting to login…</p>
              <div style={{width:24,height:24,border:"3px solid rgba(219,38,72,.2)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .75s linear infinite",margin:"0 auto"}}/>
            </div>
          ) : (
            <>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{width:58,height:58,borderRadius:14,background:"rgba(219,38,72,.08)",border:"1.5px solid rgba(219,38,72,.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#DB2648" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:21,color:"#0F172A",marginBottom:7}}>Set New Password</h2>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.65}}>Choose a strong password for your SureShift ERP account.</p>
              </div>

              {msg && (
                <div style={{background:msg.type==="success"?"#F0FDF4":"#FFF5F5",border:"1px solid "+(msg.type==="success"?"#A7F3D0":"#FECACA"),borderRadius:10,padding:"11px 14px",marginBottom:20,display:"flex",gap:9,alignItems:"flex-start"}}>
                  {msg.type==="success"
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  }
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:msg.type==="success"?"#065F46":"#991B1B",lineHeight:1.5}}>{msg.text}</span>
                </div>
              )}

              <form onSubmit={handleReset}>
                <div style={{marginBottom:14}}>
                  <label className="rp-lbl">New password</label>
                  <div style={{position:"relative"}}>
                    <input className="rp-inp" type={showPwd?"text":"password"} placeholder="Minimum 8 characters"
                      value={password} autoFocus
                      onChange={e=>{setPassword(e.target.value);setMsg(null);}}
                      onFocus={()=>setFf("pwd")} onBlur={()=>setFf(null)}
                      style={{paddingLeft:38,paddingRight:42}}/>
                    <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("pwd")} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <button type="button" className="rp-eye" onClick={()=>setShowPwd(v=>!v)}>{showPwd?<EyeOff/>:<EyeOn/>}</button>
                  </div>
                  {password && (
                    <div style={{marginTop:7,display:"flex",alignItems:"center",gap:8}}>
                      <div style={{flex:1,height:4,background:"#F1F5F9",borderRadius:20,overflow:"hidden"}}>
                        <div style={{height:"100%",width:[0,33,66,100][strength]+"%",background:strengthColor,borderRadius:20,transition:"all .3s"}}/>
                      </div>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:600,color:strengthColor,minWidth:36}}>{strengthLabel}</span>
                    </div>
                  )}
                </div>

                <div style={{marginBottom:24}}>
                  <label className="rp-lbl">Confirm password</label>
                  <div style={{position:"relative"}}>
                    <input className="rp-inp" type={showCpwd?"text":"password"} placeholder="Repeat your password"
                      value={confirm}
                      onChange={e=>{setConfirm(e.target.value);setMsg(null);}}
                      onFocus={()=>setFf("cpwd")} onBlur={()=>setFf(null)}
                      style={{paddingLeft:38,paddingRight:42,borderColor:confirm&&confirm!==password?"#FCA5A5":""}}/>
                    <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("cpwd")} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <button type="button" className="rp-eye" onClick={()=>setShowCpwd(v=>!v)}>{showCpwd?<EyeOff/>:<EyeOn/>}</button>
                  </div>
                  {confirm && confirm!==password && (
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#DC2626",marginTop:5}}>Passwords do not match</p>
                  )}
                </div>

                <button type="submit" className="rp-btn" disabled={busy}>
                  {busy
                    ? <><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Resetting…</>
                    : <>Reset Password <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></>
                  }
                </button>
              </form>

              <div style={{marginTop:18,textAlign:"center"}}>
                <button onClick={onDone} style={{fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:"#DB2648",background:"none",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5,transition:"color .15s",textDecoration:"none"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#991B2F"} onMouseLeave={e=>e.currentTarget.style.color="#DB2648"}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Sign In
                </button>
              </div>

              <div style={{marginTop:14,padding:"10px 13px",background:"rgba(219,38,72,.05)",border:"1px solid rgba(219,38,72,.15)",borderRadius:8,display:"flex",gap:7,alignItems:"flex-start"}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DB2648" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#DB2648",lineHeight:1.55}}>Reset links expire in <strong>30 minutes</strong>. If expired, go back and request a new one.</span>
              </div>
            </>
          )}
        </div>
        </div>{/* end card */}

        <p style={{textAlign:"center",marginTop:20,fontFamily:"'Inter',sans-serif",fontSize:11,color:"#94A3B8"}}>© 2026 Sure Shift Relocation Services Pvt. Ltd.</p>
      </div>
    </div>
  );
}

const INIT_SF = { name:"", email:"", phone:"", company:"", partnerType:"" };

function Login() {
  const { login, error } = useAppAuth();
  const [tab, setTab]         = useState("login"); // login | signup | forgot | reset
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [ff, setFf]           = useState(null);
  const ic = f => ff === f ? "#DB2648" : "#CBD5E1";
  const [msg, setMsg]         = useState(null); // {type:"error"|"success", text}
  const [remember, setRemember]= useState(false);
  const [quoteIdx, setQuoteIdx]= useState(0);
  const [lf, setLf] = useState({ email:"", password:"" });
  const [sf, setSf] = useState(INIT_SF);
  const [fgEmail, setFgEmail] = useState("");        // forgot password
  const [rtData, setRtData]   = useState({ password:"", confirm:"" }); // reset
  const [rtToken, setRtToken] = useState("");
  const [showRt, setShowRt]   = useState(false);
  const [showRtC, setShowRtC] = useState(false);

  // Detect ?view=reset&token=xxx in URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("view") === "reset" && p.get("token")) {
      setRtToken(p.get("token"));
      setTab("reset");
      // Clean URL without reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Rotate quotes every 5s
  const QUOTES = [
    { q:"You are not just moving boxes — you are moving lives, memories and new beginnings.", by:"Founding Team, Sure Shift" },
    { q:"Every route planned, every item packed safely, every customer smile — that's your achievement.", by:"Operations Leadership" },
    { q:"Our strength isn't our trucks or warehouses. It's each one of you showing up every single day.", by:"HR & People Team" },
    { q:"The best partners don't just deliver goods. They deliver trust. Thank you for being ours.", by:"Vendor Relations" },
  ];
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  /* SVG icon helpers */
  const IcoMove    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const IcoHeart   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
  const IcoStar    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  const IcoClock   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const IcoEyeOn   = ({s=17}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  const IcoEyeOff  = ({s=17}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>;
  const IcoCheck   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>;
  const IcoWarn    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  const IcoShield  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const IcoBack    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
  const IcoMail    = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#DB2648" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  const IcoLock    = () => <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;

  const STATS = [
    { n:"10,000+", l:"Moves Completed",    Icon:IcoMove },
    { n:"500+",    l:"Trusted Partners",   Icon:IcoHeart },
    { n:"98%",     l:"Satisfaction Rate",  Icon:IcoStar },
    { n:"24 / 7",  l:"Operations Support", Icon:IcoClock },
  ];

  const PARTNER_TYPES = [
    { v:"vehicle",  l:"Vehicle Partner",  Icon:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { v:"manpower", l:"Manpower Partner", Icon:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { v:"material", l:"Material Partner", Icon:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
    { v:"business", l:"Business Partner", Icon:()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  ];

  /* Handlers */
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!lf.email || !lf.password) { setMsg({type:"error",text:"Please enter your email and password."}); return; }
    setBusy(true); setMsg(null);
    try { await login(lf.email.trim().toLowerCase(), lf.password); }
    catch (err) { setMsg({type:"error",text:err.message}); }
    finally { setBusy(false); }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    const { name, email, phone, company, partnerType } = sf;
    if (!name || !email || !phone || !company || !partnerType) {
      setMsg({type:"error",text:"All fields are required to complete registration."}); return;
    }
    setBusy(true); setMsg(null);
    try {
      await pb.collection("partner_requests").create({
        name, email:email.trim().toLowerCase(), phone, company,
        partner_type:partnerType, status:"pending",
        submitted_at:new Date().toISOString(),
      });
      setSf(INIT_SF);
      setMsg({type:"success",text:`Registration submitted! Your account will be activated within 24 hours. We'll send credentials to ${email}.`});
    } catch (err) {
      setMsg({type:"error",text:err?.response?.data?.email?.message||err.message||"Submission failed."});
    } finally { setBusy(false); }
  };

  const handleForgot = async (e) => {
    e?.preventDefault();
    if (!fgEmail) { setMsg({type:"error",text:"Please enter your email address."}); return; }
    setBusy(true); setMsg(null);
    try {
      await pb.collection("users").requestPasswordReset(fgEmail.trim().toLowerCase());
      setMsg({type:"success",text:`Reset link sent to ${fgEmail}. Check your inbox — it expires in 30 minutes.`});
      setFgEmail("");
    } catch (err) {
      // Always show success to prevent email enumeration
      setMsg({type:"success",text:`If ${fgEmail} is registered, you'll receive a reset link shortly.`});
    } finally { setBusy(false); }
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    if (!rtData.password || !rtData.confirm) { setMsg({type:"error",text:"Please fill in both password fields."}); return; }
    if (rtData.password.length < 8) { setMsg({type:"error",text:"Password must be at least 8 characters."}); return; }
    if (rtData.password !== rtData.confirm) { setMsg({type:"error",text:"Passwords do not match."}); return; }
    if (!rtToken) { setMsg({type:"error",text:"Invalid or expired reset link. Please request a new one."}); return; }
    setBusy(true); setMsg(null);
    try {
      await pb.collection("users").confirmPasswordReset(rtToken, rtData.password, rtData.confirm);
      setMsg({type:"success",text:"Password reset successfully! You can now sign in with your new password."});
      setRtToken("");
      setRtData({password:"",confirm:""});
      setTimeout(() => { setTab("login"); setMsg(null); }, 3000);
    } catch (err) {
      setMsg({type:"error",text:"This reset link is invalid or has expired. Please request a new one."});
    } finally { setBusy(false); }
  };

  const h = new Date().getHours();
  const greeting = h<12?"morning":h<17?"afternoon":"evening";
  const isSuccess = msg?.type === "success";

  return (
    <div style={{minHeight:"100vh",background:"#F0F2F5",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes quoteIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseDot{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        .aw{display:grid;grid-template-columns:1.05fr 1fr;width:100%;max-width:1040px;min-height:640px;border-radius:22px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.18)}
        .al{background:#DB2648;padding:50px 44px;display:flex;flex-direction:column;position:relative;overflow:hidden}
        .al::before{content:"";position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
        .al::after{content:"";position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none}
        .adp{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:22px 22px;pointer-events:none}
        .ar{background:#fff;display:flex;flex-direction:column}
        .tabs-bar{display:flex;border-bottom:1.5px solid #F1F5F9;padding:0 44px}
        .tab-btn{padding:18px 0;margin-right:30px;border:none;background:transparent;font:600 13.5px 'Inter',sans-serif;cursor:pointer;transition:all .2s;border-bottom:2.5px solid transparent;margin-bottom:-1.5px;color:#94A3B8;letter-spacing:.1px;white-space:nowrap}
        .tab-btn.on{color:#DB2648;border-bottom-color:#DB2648}
        .tab-btn:hover:not(.on){color:#475569}
        .ari{flex:1;padding:40px 44px;display:flex;flex-direction:column;justify-content:center}
        .lbl{display:block;font:600 10.5px 'Inter',sans-serif;color:#64748B;letter-spacing:.6px;text-transform:uppercase;margin-bottom:5px}
        .inp{width:100%;padding:11px 14px;border:1.5px solid #E2E8F0;border-radius:9px;font:400 13.5px 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff;transition:border-color .18s,box-shadow .18s;box-sizing:border-box}
        .inp:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
        .inp::placeholder{color:#CBD5E1}
        .pw{position:relative}.pw .inp{padding-right:44px}
        .eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;padding:3px;border-radius:5px;transition:color .15s}
        .eye:hover{color:#475569}
        .sel{appearance:none;width:100%;padding:11px 38px 11px 14px;border:1.5px solid #E2E8F0;border-radius:9px;font:400 13.5px 'Inter',sans-serif;color:#0F172A;outline:none;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' fill='none' stroke='%2394A3B8' stroke-width='1.7'%3E%3Cpath d='M1 1l4.5 4.5L10 1'/%3E%3C/svg%3E") no-repeat right 13px center;cursor:pointer;transition:border-color .18s;box-sizing:border-box}
        .sel:focus{border-color:#DB2648;box-shadow:0 0 0 3px rgba(219,38,72,.08)}
        .abtn{width:100%;padding:13px;background:#DB2648;color:#fff;border:none;border-radius:10px;font:600 14px 'Inter',sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .18s;letter-spacing:.15px}
        .abtn:hover{background:#B91C3C;transform:translateY(-1px)}
        .abtn:active{transform:translateY(0)}
        .abtn:disabled{background:#CBD5E1;cursor:not-allowed;transform:none}
        .alink{color:#DB2648;font:600 13px 'Inter',sans-serif;text-decoration:none;cursor:pointer;background:none;border:none;padding:0;transition:color .15s}
        .alink:hover{color:#991B2F;text-decoration:underline}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .sc{padding:16px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.1);display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;transition:border-color .2s}
        .sc:hover{border-color:rgba(255,255,255,.35)}
        .sico{width:46px;height:46px;border-radius:13px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,.3)}
        .qbox{border-left:2.5px solid rgba(255,255,255,.4);padding-left:16px;margin-top:auto}
        .qt{font:400 13px/1.7 'Inter',sans-serif;color:rgba(255,255,255,.75);font-style:italic;animation:quoteIn .45s ease}
        .qby{font:700 10px 'Inter',sans-serif;color:rgba(255,255,255,.5);letter-spacing:.8px;text-transform:uppercase;margin-top:6px}
        .dnav{display:flex;gap:5px;margin-top:10px}
        .dd{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.25);transition:all .4s;cursor:pointer}
        .dd.on{width:20px;border-radius:3px;background:#fff}
        .remrow{display:flex;align-items:center;justify-content:space-between;margin:8px 0 20px}
        .chk{display:flex;align-items:center;gap:7px;font:400 13px 'Inter',sans-serif;color:#475569;cursor:pointer}
        .chk input{accent-color:#DB2648;width:15px;height:15px;cursor:pointer}
        .bn{text-align:center;font:400 12.5px 'Inter',sans-serif;color:#94A3B8;margin-top:16px}
        .fs{animation:fadeUp .18s ease}
        .notify{border-radius:10px;padding:12px 14px;margin-bottom:20px;display:flex;gap:10px;align-items:flex-start;line-height:1.5;font:400 13px 'Inter',sans-serif}
        .notify.ok{background:#F0FDF4;border:1px solid #A7F3D0;color:#065F46}
        .notify.er{background:#FFF5F5;border:1px solid #FECACA;color:#991B1B}
        .pt-opt{display:flex;align-items:center;gap:8px;padding:10px 13px;border:1.5px solid #E2E8F0;border-radius:9px;cursor:pointer;transition:all .15s;font:400 13.5px 'Inter',sans-serif;color:#374151}
        .pt-opt.sel2{border-color:#DB2648;background:rgba(219,38,72,.04);color:#DB2648;font-weight:600}
        .pt-opt:hover:not(.sel2){border-color:#CBD5E1;background:#FAFAFA}
        .trust-bar{display:flex;align-items:center;gap:8px;padding:11px 14px;background:#F8FAFC;border-radius:9px;border:1px solid #F1F5F9;margin-top:20px}
        .pg-icon{width:68px;height:68px;border-radius:18px;background:rgba(219,38,72,.08);border:1.5px solid rgba(219,38,72,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:scaleIn .3s ease}
        .pw-strength{height:3px;border-radius:2px;margin-top:6px;transition:all .3s}
        @media(max-width:900px){.aw{grid-template-columns:1fr;max-width:480px}.al{padding:28px 24px;min-height:auto}.ari,.tabs-bar{padding-left:28px;padding-right:28px}.g2{grid-template-columns:1fr}}
        @media(max-width:520px){.ari,.tabs-bar{padding-left:18px;padding-right:18px}.al{padding:22px 18px}}
      `}</style>

      <div className="aw">
        {/* ══ LEFT PANEL ══ */}
        <div className="al">
          <div className="adp"/>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:36,position:"relative",zIndex:1}}>
            <div style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,.2)",border:"1.5px solid rgba(255,255,255,.35)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width={24} height={24} viewBox="0 0 60 60" fill="none"><path d="M12 8 L48 30 L12 52" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:17,color:"#fff",letterSpacing:"1.2px",lineHeight:1}}>SURESHIFT</div>
              <div style={{fontFamily:"'Inter',sans-serif",fontSize:9.5,color:"rgba(255,255,255,.55)",letterSpacing:"2.5px",textTransform:"uppercase",marginTop:2}}>Relocation ERP · v2.0</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"4px 11px",border:"1px solid rgba(255,255,255,.25)",borderRadius:99,background:"rgba(255,255,255,.1)"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#4ADE80",animation:"pulseDot 2s ease infinite"}}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,color:"rgba(255,255,255,.8)",fontWeight:600}}>All systems live</span>
            </div>
          </div>
          {/* Headline */}
          <div style={{position:"relative",zIndex:1,marginBottom:28}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:99,marginBottom:14}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,fontWeight:700,color:"#fff",letterSpacing:".5px",textTransform:"uppercase"}}>Welcome, Team Sure Shift</span>
            </div>
            <h1 style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:26,color:"#fff",lineHeight:1.25,marginBottom:11}}>
              You Keep<br/>India Moving.<br/>
              <span style={{color:"rgba(255,255,255,.7)",fontWeight:600,fontSize:22}}>We've Got Your Back.</span>
            </h1>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"rgba(255,255,255,.65)",lineHeight:1.7}}>Your command centre for enquiries, surveys, quotations, operations and invoices.</p>
          </div>
          {/* Stats */}
          <div className="g2" style={{marginBottom:26,position:"relative",zIndex:1}}>
            {STATS.map(({n,l,Icon})=>(
              <div key={l} className="sc">
                <div className="sico"><Icon/></div>
                <div style={{fontFamily:"'Poppins',sans-serif",fontWeight:800,fontSize:18,color:"#fff",lineHeight:1}}>{n}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(255,255,255,.6)",lineHeight:1.3}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Rotating quote */}
          <div className="qbox" style={{position:"relative",zIndex:1}}>
            <div className="qt" key={quoteIdx}>"{QUOTES[quoteIdx].q}"</div>
            <div className="qby">— {QUOTES[quoteIdx].by}</div>
            <div className="dnav">{QUOTES.map((_,i)=><div key={i} className={`dd${quoteIdx===i?" on":""}`} onClick={()=>setQuoteIdx(i)}/>)}</div>
          </div>
          {/* Footer */}
          <div style={{paddingTop:22,marginTop:12,borderTop:"1px solid rgba(255,255,255,.15)",fontFamily:"'Inter',sans-serif",fontSize:10.5,color:"rgba(255,255,255,.4)",display:"flex",justifyContent:"space-between",position:"relative",zIndex:1}}>
            <span>© 2026 Sure Shift Relocation Services Pvt. Ltd.</span>
            <span>Delhi · Mumbai · Bengaluru</span>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="ar">
          {/* Tabs — only show for login/signup */}
          {(tab==="login"||tab==="signup") && (
            <div className="tabs-bar">
              {[{id:"login",l:"Employee Login"},{id:"signup",l:"Partner Sign Up"}].map(t=>(
                <button key={t.id} className={`tab-btn${tab===t.id?" on":""}`}
                  onClick={()=>{setTab(t.id);setMsg(null);}}>
                  {t.l}
                </button>
              ))}
            </div>
          )}

          <div className="ari" style={{justifyContent:tab==="forgot"||tab==="reset"?"center":"center"}}>
            {/* Notification */}
            {msg && (
              <div className={`notify${isSuccess?" ok":" er"}`}>
                <span style={{flexShrink:0,marginTop:1}}>{isSuccess?<IcoCheck/>:<IcoWarn/>}</span>
                <span>{msg.text}</span>
              </div>
            )}

            {/* ── LOGIN ── */}
            {tab==="login" && (
              <div className="fs">
                <div style={{marginBottom:24}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:22,color:"#0F172A",marginBottom:5,display:"flex",alignItems:"center",gap:9}}>
                    Good {greeting}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2648" strokeWidth="1.8" strokeLinecap="round"><path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0M14 10V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2M10 10.5V6a2 2 0 00-2-2v0a2 2 0 00-2 2v8a6 6 0 006 6h2a6 6 0 006-6v-2a2 2 0 00-2-2v0a2 2 0 00-2 2v0"/></svg>
                  </h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.55}}>Sign in to your Sure Shift ERP workspace.</p>
                </div>
                <form onSubmit={handleLogin}>
                  <div style={{marginBottom:14}}>
                    <label className="lbl">Email address</label>
                    <div style={{position:"relative"}}>
                      <input className="inp" type="email" placeholder="you@sureshift.in" value={lf.email} autoFocus
                        onChange={e=>{setLf({...lf,email:e.target.value});setMsg(null);}}
                        onFocus={()=>setFf("l-email")} onBlur={()=>setFf(null)}
                        onKeyDown={e=>e.key==="Enter"&&handleLogin(e)}
                        style={{paddingLeft:38}}/>
                      <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("l-email")} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                  </div>
                  <div style={{marginBottom:4}}>
                    <label className="lbl">Password</label>
                    <div className="pw">
                      <input className="inp" type={showPwd?"text":"password"} placeholder="Enter your password" value={lf.password}
                        onChange={e=>{setLf({...lf,password:e.target.value});setMsg(null);}}
                        onFocus={()=>setFf("l-pwd")} onBlur={()=>setFf(null)}
                        onKeyDown={e=>e.key==="Enter"&&handleLogin(e)}
                        style={{paddingLeft:38}}/>
                      <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("l-pwd")} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <button type="button" className="eye" onClick={()=>setShowPwd(v=>!v)}>{showPwd?<IcoEyeOff/>:<IcoEyeOn/>}</button>
                    </div>
                  </div>
                  <div className="remrow">
                    <label className="chk"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/> Keep me signed in</label>
                    <button type="button" className="alink" style={{fontSize:12.5}} onClick={()=>{setTab("forgot");setMsg(null);}}>Forgot password?</button>
                  </div>
                  <button type="submit" className="abtn" disabled={busy}>
                    {busy?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Signing in…</>:
                    <>Sign in to ERP <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>}
                  </button>
                </form>
                <div className="trust-bar"><IcoShield/><span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#059669",fontWeight:600}}>Secured with Bank Grade Security Systems</span></div>
                <p className="bn">A vendor or partner? <button className="alink" onClick={()=>{setTab("signup");setMsg(null);}}>Sign up here</button></p>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab==="forgot" && (
              <div className="fs" style={{maxWidth:360,margin:"0 auto",width:"100%"}}>
                <div className="pg-icon"><IcoMail/></div>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:21,color:"#0F172A",marginBottom:8}}>Forgot Password?</h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.65}}>No worries. Enter your registered email and we'll send you a reset link immediately.</p>
                </div>
                <form onSubmit={handleForgot}>
                  <div style={{marginBottom:20}}>
                    <label className="lbl">Email address</label>
                    <div style={{position:"relative"}}>
                      <input className="inp" type="email" placeholder="you@sureshift.in" value={fgEmail} autoFocus
                        onChange={e=>{setFgEmail(e.target.value);setMsg(null);}}
                        onFocus={()=>setFf("fg-email")} onBlur={()=>setFf(null)}
                        onKeyDown={e=>e.key==="Enter"&&handleForgot(e)}
                        style={{paddingLeft:38}}/>
                      <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("fg-email")} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                  </div>
                  <button type="submit" className="abtn" disabled={busy}>
                    {busy?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Sending…</>:
                    <>Send Reset Link <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></>}
                  </button>
                </form>
                <div style={{marginTop:20,display:"flex",justifyContent:"center"}}>
                  <button className="alink" style={{display:"flex",alignItems:"center",gap:6,color:"#64748B",fontSize:13}} onClick={()=>{setTab("login");setMsg(null);}}>
                    <IcoBack/> Back to Sign In
                  </button>
                </div>
                <div style={{marginTop:16,padding:"11px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:9,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#92400E",lineHeight:1.55}}>The reset link expires in <strong>30 minutes</strong>. If you don't see the email, check your spam folder.</span>
                </div>
              </div>
            )}

            {/* ── RESET PASSWORD ── */}
            {tab==="reset" && (
              <div className="fs" style={{maxWidth:360,margin:"0 auto",width:"100%"}}>
                <div className="pg-icon" style={{background:"rgba(5,150,105,.08)",borderColor:"rgba(5,150,105,.2)"}}><IcoLock/></div>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:21,color:"#0F172A",marginBottom:8}}>Set New Password</h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B",lineHeight:1.65}}>Choose a strong password you haven't used before. Minimum 8 characters.</p>
                </div>
                {!rtToken && !msg && (
                  <div style={{padding:"14px",background:"#FFF5F5",border:"1px solid #FECACA",borderRadius:10,marginBottom:20,fontFamily:"'Inter',sans-serif",fontSize:13,color:"#991B1B",textAlign:"center"}}>
                    ⚠️ Invalid or expired reset link.<br/>
                    <button className="alink" style={{marginTop:6}} onClick={()=>{setTab("forgot");setMsg(null);}}>Request a new one →</button>
                  </div>
                )}
                {rtToken && (
                  <form onSubmit={handleReset}>
                    <div style={{marginBottom:14}}>
                      <label className="lbl">New Password</label>
                      <div className="pw">
                        <input className="inp" type={showRt?"text":"password"} placeholder="Min 8 characters" value={rtData.password}
                          onChange={e=>{setRtData({...rtData,password:e.target.value});setMsg(null);}}
                          onFocus={()=>setFf("rt-pwd")} onBlur={()=>setFf(null)}
                          autoFocus style={{paddingLeft:38}}/>
                        <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("rt-pwd")} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <button type="button" className="eye" onClick={()=>setShowRt(v=>!v)}>{showRt?<IcoEyeOff/>:<IcoEyeOn/>}</button>
                      </div>
                      {/* Password strength bar */}
                      {rtData.password && (
                        <div className="pw-strength" style={{
                          background: rtData.password.length<8?"#FCA5A5":rtData.password.length<12?"#FCD34D":"#6EE7B7",
                          width: rtData.password.length<1?"0%":rtData.password.length<8?"33%":rtData.password.length<12?"66%":"100%"
                        }}/>
                      )}
                    </div>
                    <div style={{marginBottom:20}}>
                      <label className="lbl">Confirm New Password</label>
                      <div className="pw">
                        <input className="inp" type={showRtC?"text":"password"} placeholder="Repeat password" value={rtData.confirm}
                          onChange={e=>{setRtData({...rtData,confirm:e.target.value});setMsg(null);}}
                          onFocus={()=>setFf("rt-cpwd")} onBlur={()=>setFf(null)}
                          style={{paddingLeft:38,borderColor:rtData.confirm&&rtData.confirm!==rtData.password?"#FCA5A5":""}}/>
                        <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ic("rt-cpwd")} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        <button type="button" className="eye" onClick={()=>setShowRtC(v=>!v)}>{showRtC?<IcoEyeOff/>:<IcoEyeOn/>}</button>
                      </div>
                      {rtData.confirm && rtData.confirm!==rtData.password && (
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#DC2626",marginTop:5}}>Passwords do not match</p>
                      )}
                    </div>
                    <button type="submit" className="abtn" disabled={busy||!rtToken}>
                      {busy?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Resetting…</>:
                      <>Reset Password <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></>}
                    </button>
                  </form>
                )}
                <div style={{marginTop:16,display:"flex",justifyContent:"center"}}>
                  <button className="alink" style={{display:"flex",alignItems:"center",gap:6,color:"#64748B",fontSize:13}} onClick={()=>{setTab("login");setMsg(null);}}>
                    <IcoBack/> Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ── PARTNER SIGNUP ── */}
            {tab==="signup" && (
              <div className="fs">
                <div style={{marginBottom:20}}>
                  <h2 style={{fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:21,color:"#0F172A",marginBottom:5}}>Join Our Partner Network</h2>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:"#64748B",lineHeight:1.6}}>Register as a Sure Shift partner. Our team activates your account within 24 hours.</p>
                </div>
                <form onSubmit={handleSignup}>
                  <div className="g2" style={{marginBottom:12}}>
                    <div>
                      <label className="lbl">Full name</label>
                      <div style={{position:"relative"}}>
                        <input className="inp" placeholder="Your full name" value={sf.name} autoFocus
                          onChange={e=>{setSf({...sf,name:e.target.value});setMsg(null);}}
                          onFocus={()=>setFf("s-name")} onBlur={()=>setFf(null)}
                          style={{paddingLeft:36}}/>
                        <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ic("s-name")} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    </div>
                    <div>
                      <label className="lbl">Phone number</label>
                      <div style={{position:"relative"}}>
                        <input className="inp" placeholder="+91 9XXXXXXXXX" type="tel" value={sf.phone}
                          onChange={e=>{setSf({...sf,phone:e.target.value});setMsg(null);}}
                          onFocus={()=>setFf("s-phone")} onBlur={()=>setFf(null)}
                          style={{paddingLeft:36}}/>
                        <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ic("s-phone")} strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.24 2.18 2 2 0 012.21 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.28-1.29a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label className="lbl">Business email</label>
                    <div style={{position:"relative"}}>
                      <input className="inp" placeholder="you@yourcompany.com" type="email" value={sf.email}
                        onChange={e=>{setSf({...sf,email:e.target.value});setMsg(null);}}
                        onFocus={()=>setFf("s-email")} onBlur={()=>setFf(null)}
                        style={{paddingLeft:36}}/>
                      <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ic("s-email")} strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label className="lbl">Company / Firm name</label>
                    <div style={{position:"relative"}}>
                      <input className="inp" placeholder="Your company or firm name" value={sf.company}
                        onChange={e=>{setSf({...sf,company:e.target.value});setMsg(null);}}
                        onFocus={()=>setFf("s-company")} onBlur={()=>setFf(null)}
                        style={{paddingLeft:36}}/>
                      <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",transition:"stroke .15s"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ic("s-company")} strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                  </div>
                  <div style={{marginBottom:18}}>
                    <label className="lbl">Partner type</label>
                    <div className="g2">
                      {PARTNER_TYPES.map(({v,l,Icon})=>(
                        <div key={v} className={`pt-opt${sf.partnerType===v?" sel2":""}`}
                          onClick={()=>{setSf({...sf,partnerType:v});setMsg(null);}}>
                          <Icon/><span style={{fontSize:13}}>{l}</span>
                          {sf.partnerType===v&&<svg style={{marginLeft:"auto",flexShrink:0}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DB2648" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="abtn" disabled={busy}>
                    {busy?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Submitting…</>:
                    <>Submit Registration <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></>}
                  </button>
                </form>
                <div style={{marginTop:16,padding:"11px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:9,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#92400E",lineHeight:1.55}}>Partner accounts are reviewed by our team. You'll receive credentials by email within 24 hours of approval.</span>
                </div>
                <p className="bn">Already have an account? <button className="alink" onClick={()=>{setTab("login");setMsg(null);}}>Sign in here</button></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD — role-aware router
// ─────────────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { user } = useAppAuth();
  const role = user?.role;
  if (role === "super_admin")  return <SuperAdminDash/>;
  if (role === "branch_head")  return <BranchHeadDash/>;
  if (role === "sales_exec")   return <SalesDash/>;
  if (role === "ops_exec")     return <OpsDash/>;
  if (role === "finance_exec") return <FinanceDash/>;
  if (role === "surveyor")     return <SurveyorDash/>;
  if (role === "vehicle_vendor" || role === "manpower_vendor") return <VendorDash/>;
  return <SuperAdminDash/>;
}

// ── shared mini primitives ────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color="#DB2648", icon, loading }) {
  return (
    <div style={{background:"#fff",borderRadius:14,border:"1px solid #F1F5F9",padding:"18px 20px",boxShadow:"0 1px 4px rgba(15,23,42,.04)"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}12`,border:`1px solid ${color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {icon}
        </div>
        {sub && <span style={{fontFamily:"'Inter',sans-serif",fontSize:10.5,fontWeight:700,color,background:`${color}10`,padding:"3px 9px",borderRadius:99,textTransform:"uppercase",letterSpacing:".4px"}}>{sub}</span>}
      </div>
      <div style={{fontFamily:"'Poppins',sans-serif",fontSize:27,fontWeight:800,color:"#0F172A",lineHeight:1,marginBottom:5}}>
        {loading ? <span style={{color:"#E2E8F0"}}>—</span> : value}
      </div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#94A3B8",fontWeight:500}}>{label}</div>
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
      <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13.5,fontWeight:700,color:"#0F172A"}}>{children}</div>
      {right}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{background:"#fff",borderRadius:14,border:"1px solid #F1F5F9",padding:"20px",boxShadow:"0 1px 4px rgba(15,23,42,.04)",...style}}>{children}</div>;
}

function Pipeline({ stages, data, colorMap }) {
  const total = data.length || 1;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {stages.map(s => {
        const n = data.filter(d => d.stage === s || d.status === s).length;
        const pct = Math.round(n / total * 100);
        const c = colorMap[s] || "#94A3B8";
        return (
          <div key={s}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,fontWeight:600,color:"#374151",textTransform:"capitalize"}}>{s}</span>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#94A3B8"}}>{n} <span style={{color:c,fontWeight:700}}>({pct}%)</span></span>
            </div>
            <div style={{height:7,background:"#F1F5F9",borderRadius:20,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:20,transition:"width .6s ease"}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniTable({ cols, rows, loading }) {
  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:28}}><div style={{width:24,height:24,border:"3px solid rgba(219,38,72,.15)",borderTopColor:"#DB2648",borderRadius:"50%",animation:"spin .75s linear infinite"}}/></div>;
  if (!rows?.length) return <div style={{textAlign:"center",padding:"24px 0",fontFamily:"'Inter',sans-serif",fontSize:13,color:"#CBD5E1"}}>No records yet</div>;
  return (
    <table style={{width:"100%",borderCollapse:"collapse"}}>
      <thead>
        <tr style={{borderBottom:"1.5px solid #F1F5F9"}}>
          {cols.map(c=><th key={c.k} style={{padding:"6px 10px",textAlign:"left",fontFamily:"'Inter',sans-serif",fontSize:9.5,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".6px",whiteSpace:"nowrap"}}>{c.l}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0,7).map((r,i)=>(
          <tr key={r.id||i} style={{borderBottom:"1px solid #F8FAFC"}}>
            {cols.map(c=><td key={c.k} style={{padding:"9px 10px",fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#374151",whiteSpace:"nowrap"}}>{c.r?c.r(r):r[c.k]||<span style={{color:"#E2E8F0"}}>—</span>}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GreetBanner({ name, role, branch, sub }) {
  const h = new Date().getHours();
  const g = h<12?"Good morning":"Good afternoon";
  const rInfo = ROLES[role]||{};
  return (
    <div style={{marginBottom:24,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div>
        <h2 style={{fontFamily:"'Poppins',sans-serif",fontSize:21,fontWeight:700,color:"#0F172A",marginBottom:4}}>{g}, {(name||"").split(" ")[0]} {rInfo.icon}</h2>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:13.5,color:"#64748B"}}>{sub}</p>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,fontWeight:700,color:rInfo.color,background:`${rInfo.color}12`,padding:"5px 12px",borderRadius:99}}>{rInfo.label}</span>
        {branch && <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,fontWeight:700,color:"#475569",background:"#F1F5F9",padding:"5px 12px",borderRadius:99}}>{branch} branch</span>}
      </div>
    </div>
  );
}

// ── SVG icon set ─────────────────────────────────────────────────────────────
const I = {
  enquiry:   c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#DB2648"} strokeWidth="1.9" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  booking:   c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#D97706"} strokeWidth="1.9" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  revenue:   c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#059669"} strokeWidth="1.9" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  invoice:   c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#7C3AED"} strokeWidth="1.9" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  vendor:    c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#0D9488"} strokeWidth="1.9" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  survey:    c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#2563EB"} strokeWidth="1.9" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  truck:     c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#0284C7"} strokeWidth="1.9" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  users:     c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#DB2648"} strokeWidth="1.9" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  trend:     c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#059669"} strokeWidth="1.9" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  job:       c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#D97706"} strokeWidth="1.9" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  payout:    c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#7C3AED"} strokeWidth="1.9" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  rating:    c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#D97706"} strokeWidth="1.9" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  pending:   c => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c||"#DB2648"} strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};
const fmt = n => { if(!n)return"₹0"; if(n>=10000000)return`₹${(n/10000000).toFixed(1)}Cr`; if(n>=100000)return`₹${(n/100000).toFixed(1)}L`; if(n>=1000)return`₹${(n/1000).toFixed(0)}K`; return`₹${n}`; };

// ──────────────────────────────────────────────────────────────────────────────
//  1. SUPER ADMIN DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function SuperAdminDash() {
  const { user } = useAppAuth();
  const { items:enqs,  loading:eL } = useCollection("enquiries",  { sort:"-created", perPage:500, realtime:true });
  const { items:cfrs,  loading:cL } = useCollection("cfr",        { sort:"-created", perPage:500, realtime:true });
  const { items:invs,  loading:iL } = useCollection("invoices",   { sort:"-created", perPage:500 });
  const { items:vens,  loading:vL } = useCollection("vendors",    { sort:"-created" });
  const { items:users, loading:uL } = useCollection("users",      { sort:"-created" });
  const { items:pReqs, loading:pL } = useCollection("partner_requests", { sort:"-created", filter:`status="pending"` });

  const totalRev    = cfrs.reduce((s,c)=>s+(c.grand_total||0),0);
  const collected   = cfrs.reduce((s,c)=>s+(c.total_paid||0),0);
  const outstanding = invs.reduce((s,i)=>s+(i.outstanding||0),0);
  const openCFR     = cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).length;

  const stageColors = { new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626" };
  const cfrColors   = { "token-pending":"#D97706","token-received":"#059669",confirmed:"#2563EB","vendor-assigned":"#7C3AED","ops-ready":"#0D9488","in-transit":"#DB2648",delivered:"#059669",cancelled:"#DC2626" };

  const branchRevenue = BRANCHES.map(b => ({
    b, rev: cfrs.filter(c => {
      const enq = enqs.find(e => e.id === c.enquiry_id);
      return enq?.branch === b;
    }).reduce((s,c)=>s+(c.grand_total||0),0)
  })).sort((a,b)=>b.rev-a.rev);

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub="Full system overview — all branches, all operations, all financials."/>

      {/* KPI row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:16}}>
        <KpiCard label="Total Enquiries"   value={eL?"—":enqs.length}        sub="all time"     color="#2563EB" loading={eL} icon={I.enquiry("#2563EB")}/>
        <KpiCard label="Active Bookings"   value={cL?"—":openCFR}            sub="in progress"  color="#D97706" loading={cL} icon={I.booking("#D97706")}/>
        <KpiCard label="Gross Revenue"     value={cL?"—":fmt(totalRev)}      sub="all CFRs"     color="#059669" loading={cL} icon={I.revenue("#059669")}/>
        <KpiCard label="Outstanding"       value={iL?"—":fmt(outstanding)}   sub="unpaid"       color="#DB2648" loading={iL} icon={I.invoice("#DB2648")}/>
      </div>
      {/* KPI row 2 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Cash Collected"    value={cL?"—":fmt(collected)}     sub="payments in"  color="#059669" loading={cL} icon={I.payout("#059669")}/>
        <KpiCard label="Active Vendors"    value={vL?"—":vens.filter(v=>v.status==="active").length} sub="registered" color="#0D9488" loading={vL} icon={I.vendor("#0D9488")}/>
        <KpiCard label="Total Users"       value={uL?"—":users.length}       sub="all roles"    color="#7C3AED" loading={uL} icon={I.users("#7C3AED")}/>
        <KpiCard label="Partner Requests"  value={pL?"—":pReqs.length}       sub="pending"      color="#DB2648" loading={pL} icon={I.pending("#DB2648")}/>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>Enquiry Pipeline</SectionTitle>
          {eL ? <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["new","survey","quotation","recalling","cfr","lost"]} data={enqs} colorMap={stageColors}/>}
        </Card>
        <Card>
          <SectionTitle>Booking Pipeline</SectionTitle>
          {cL ? <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["token-pending","confirmed","vendor-assigned","in-transit","delivered","cancelled"]} data={cfrs.map(c=>({...c,stage:c.status}))} colorMap={cfrColors}/>}
        </Card>
        <Card>
          <SectionTitle>Revenue by Branch</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {branchRevenue.map(({b,rev})=>{
              const max = branchRevenue[0]?.rev||1;
              const pct = Math.round(rev/max*100);
              return (
                <div key={b}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,color:"#374151"}}>{b}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#94A3B8"}}>{fmt(rev)}</span>
                  </div>
                  <div style={{height:6,background:"#F1F5F9",borderRadius:20,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"#DB2648",borderRadius:20,transition:"width .6s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tables row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <SectionTitle>Recent Enquiries</SectionTitle>
          <MiniTable loading={eL} rows={enqs.slice(0,7)} cols={[
            {k:"enq_number",l:"Ref #",r:r=><code style={{fontSize:11,color:"#0F172A",fontWeight:700}}>{r.enq_number||"—"}</code>},
            {k:"name",l:"Customer",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"branch",l:"Branch"},
            {k:"stage",l:"Stage",r:r=><STag v={r.stage}/>},
          ]}/>
        </Card>
        <Card>
          <SectionTitle>Partner Requests{pReqs.length>0&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#DB2648",background:"#FFF1F2",padding:"3px 9px",borderRadius:99}}>{pReqs.length} pending</span>}</SectionTitle>
          <MiniTable loading={pL} rows={pReqs} cols={[
            {k:"name",l:"Name",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"company",l:"Company"},
            {k:"partner_type",l:"Type",r:r=><STag v={r.partner_type}/>},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  2. BRANCH HEAD DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function BranchHeadDash() {
  const { user } = useAppAuth();
  const branch = user?.branch;
  const bFilter = branch ? `branch="${branch}"` : "";

  const { items:enqs, loading:eL } = useCollection("enquiries", { sort:"-created", filter:bFilter, perPage:300 });
  const { items:cfrs, loading:cL } = useCollection("cfr",       { sort:"-created", perPage:300 });
  const { items:invs, loading:iL } = useCollection("invoices",  { sort:"-created", perPage:300 });
  const { items:vens, loading:vL } = useCollection("vendors",   { filter:bFilter });

  const branchCFRs = cfrs.filter(c => enqs.some(e=>e.id===c.enquiry_id));
  const rev = branchCFRs.reduce((s,c)=>s+(c.grand_total||0),0);
  const col = branchCFRs.reduce((s,c)=>s+(c.total_paid||0),0);
  const out = invs.reduce((s,i)=>s+(i.outstanding||0),0);
  const newToday = enqs.filter(e=>e.created?.slice(0,10)===new Date().toISOString().slice(0,10)).length;
  const stageColors = { new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626" };

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={branch}
        sub={`Branch overview for ${branch} — your team's performance at a glance.`}/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Branch Enquiries"  value={eL?"—":enqs.length}        sub="total"       color="#2563EB" loading={eL} icon={I.enquiry("#2563EB")}/>
        <KpiCard label="New Today"         value={eL?"—":newToday}           sub="today"       color="#DB2648" loading={eL} icon={I.pending("#DB2648")}/>
        <KpiCard label="Branch Revenue"    value={cL?"—":fmt(rev)}           sub="all bookings" color="#059669" loading={cL} icon={I.revenue("#059669")}/>
        <KpiCard label="Outstanding"       value={iL?"—":fmt(out)}           sub="to collect"   color="#7C3AED" loading={iL} icon={I.invoice("#7C3AED")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>Enquiry Stages — {branch}</SectionTitle>
          {eL ? <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["new","survey","quotation","recalling","cfr","lost"]} data={enqs} colorMap={stageColors}/>}
        </Card>
        <Card>
          <SectionTitle>Recent Branch Enquiries</SectionTitle>
          <MiniTable loading={eL} rows={enqs.slice(0,7)} cols={[
            {k:"enq_number",l:"Ref #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.enq_number||"—"}</code>},
            {k:"name",l:"Customer",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"phone",l:"Phone"},
            {k:"move_type",l:"Type",r:r=><STag v={r.move_type}/>},
            {k:"stage",l:"Stage",r:r=><STag v={r.stage}/>},
          ]}/>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <SectionTitle>Active Bookings</SectionTitle>
          <MiniTable loading={cL} rows={branchCFRs.filter(c=>!["delivered","cancelled"].includes(c.status)).slice(0,6)} cols={[
            {k:"cfr_number",l:"CFR #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.cfr_number||"—"}</code>},
            {k:"grand_total",l:"Value",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
            {k:"move_date",l:"Date"},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
        <Card>
          <SectionTitle>Vendors — {branch}</SectionTitle>
          <MiniTable loading={vL} rows={vens.slice(0,6)} cols={[
            {k:"name",l:"Vendor",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"type",l:"Type",r:r=><STag v={r.type}/>},
            {k:"total_jobs",l:"Jobs",r:r=>r.total_jobs||0},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  3. SALES EXECUTIVE DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function SalesDash() {
  const { user } = useAppAuth();
  const { items:enqs, loading:eL } = useCollection("enquiries",  { sort:"-created", perPage:200 });
  const { items:quots,loading:qL } = useCollection("quotations", { sort:"-created", perPage:200 });
  const stageColors = { new:"#2563EB",survey:"#D97706",quotation:"#7C3AED",recalling:"#0D9488",cfr:"#059669",lost:"#DC2626" };
  const quotColors  = { draft:"#94A3B8",sent:"#2563EB",viewed:"#D97706",negotiating:"#7C3AED",approved:"#059669",converted:"#059669",lost:"#DC2626" };
  const convRate = enqs.length ? Math.round(enqs.filter(e=>e.stage==="cfr").length/enqs.length*100) : 0;
  const lostRate = enqs.length ? Math.round(enqs.filter(e=>e.stage==="lost").length/enqs.length*100) : 0;

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub="Your pipeline, your conversions, your numbers — keep pushing."/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="My Enquiries"       value={eL?"—":enqs.length}       sub="total"       color="#2563EB" loading={eL} icon={I.enquiry("#2563EB")}/>
        <KpiCard label="Quotations Sent"    value={qL?"—":quots.filter(q=>q.status==="sent"||q.status==="viewed").length} sub="active" color="#7C3AED" loading={qL} icon={I.invoice("#7C3AED")}/>
        <KpiCard label="Conversion Rate"    value={eL?"—":`${convRate}%`}    sub="enq → CFR"   color="#059669" loading={eL} icon={I.trend("#059669")}/>
        <KpiCard label="Lost Rate"          value={eL?"—":`${lostRate}%`}    sub="needs review" color="#DB2648" loading={eL} icon={I.pending("#DB2648")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>My Enquiry Pipeline</SectionTitle>
          {eL ? <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["new","survey","quotation","recalling","cfr","lost"]} data={enqs} colorMap={stageColors}/>}
        </Card>
        <Card>
          <SectionTitle>Quotation Status</SectionTitle>
          {qL ? <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["draft","sent","viewed","negotiating","approved","converted","lost"]} data={quots.map(q=>({...q,stage:q.status}))} colorMap={quotColors}/>}
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:16}}>
        <Card>
          <SectionTitle>Recent Enquiries</SectionTitle>
          <MiniTable loading={eL} rows={enqs.slice(0,8)} cols={[
            {k:"enq_number",l:"Ref",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.enq_number||"—"}</code>},
            {k:"name",l:"Customer",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"phone",l:"Phone"},
            {k:"move_type",l:"Type",r:r=><STag v={r.move_type}/>},
            {k:"stage",l:"Stage",r:r=><STag v={r.stage}/>},
          ]}/>
        </Card>
        <Card>
          <SectionTitle>Recent Quotations</SectionTitle>
          <MiniTable loading={qL} rows={quots.slice(0,7)} cols={[
            {k:"quot_number",l:"Quot #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.quot_number||"—"}</code>},
            {k:"grand_total",l:"Total",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  4. OPS EXECUTIVE DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function OpsDash() {
  const { user } = useAppAuth();
  const { items:cfrs, loading:cL } = useCollection("cfr",        { sort:"-created", perPage:200 });
  const { items:ops,  loading:oL } = useCollection("operations", { sort:"-created", perPage:200 });
  const { items:vens, loading:vL } = useCollection("vendors",    { sort:"name" });

  const active  = cfrs.filter(c=>!["delivered","cancelled"].includes(c.status));
  const inTrans = cfrs.filter(c=>c.status==="in-transit");
  const opColors = { "dispatch-mat":"#D97706",packing:"#7C3AED",loading:"#2563EB","in-transit":"#DB2648",unloading:"#0D9488",delivered:"#059669" };

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub="Manage dispatches, track moves, coordinate vendors. Every route counts."/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Active Bookings"    value={cL?"—":active.length}    sub="ongoing"     color="#D97706" loading={cL} icon={I.booking("#D97706")}/>
        <KpiCard label="In Transit"         value={cL?"—":inTrans.length}   sub="on the road" color="#DB2648" loading={cL} icon={I.truck("#DB2648")}/>
        <KpiCard label="Operations Logged"  value={oL?"—":ops.length}       sub="total"       color="#2563EB" loading={oL} icon={I.job("#2563EB")}/>
        <KpiCard label="Active Vendors"     value={vL?"—":vens.filter(v=>v.status==="active").length} sub="available" color="#059669" loading={vL} icon={I.vendor("#059669")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>Operations Stage Breakdown</SectionTitle>
          {oL ? <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["dispatch-mat","packing","loading","in-transit","unloading","delivered"]} data={ops.map(o=>({...o,stage:o.stage}))} colorMap={opColors}/>}
        </Card>
        <Card>
          <SectionTitle>Active Moves</SectionTitle>
          <MiniTable loading={cL} rows={active.slice(0,7)} cols={[
            {k:"cfr_number",l:"CFR #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.cfr_number||"—"}</code>},
            {k:"move_date",l:"Move Date"},
            {k:"vehicle",l:"Vehicle"},
            {k:"vehicle_no",l:"Reg No"},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card>
          <SectionTitle>Recent Operations</SectionTitle>
          <MiniTable loading={oL} rows={ops.slice(0,7)} cols={[
            {k:"ops_number",l:"Ops #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.ops_number||"—"}</code>},
            {k:"cfr_id",l:"CFR"},
            {k:"bilty_no",l:"Bilty #"},
            {k:"stage",l:"Stage",r:r=><STag v={r.stage}/>},
          ]}/>
        </Card>
        <Card>
          <SectionTitle>Vendor Roster</SectionTitle>
          <MiniTable loading={vL} rows={vens.slice(0,7)} cols={[
            {k:"name",l:"Vendor",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
            {k:"type",l:"Type",r:r=><STag v={r.type}/>},
            {k:"phone",l:"Phone"},
            {k:"rating",l:"Rating",r:r=><span title={`${r.rating||0}/5`}>{"⭐".repeat(Math.min(5,r.rating||0))}</span>},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  5. FINANCE EXECUTIVE DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function FinanceDash() {
  const { user } = useAppAuth();
  const { items:invs, loading:iL } = useCollection("invoices", { sort:"-created", perPage:300 });
  const { items:cfrs, loading:cL } = useCollection("cfr",      { sort:"-created", perPage:300 });

  const totalRev    = cfrs.reduce((s,c)=>s+(c.grand_total||0),0);
  const collected   = cfrs.reduce((s,c)=>s+(c.total_paid||0),0);
  const outstanding = invs.reduce((s,i)=>s+(i.outstanding||0),0);
  const overdue     = invs.filter(i=>i.status==="overdue").length;
  const paid        = invs.filter(i=>i.status==="paid").length;
  const partial     = invs.filter(i=>i.status==="partial").length;
  const invColors   = { draft:"#94A3B8",sent:"#2563EB",partial:"#D97706",paid:"#059669",overdue:"#DC2626",cancelled:"#94A3B8" };

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub="Track revenue, collections, outstanding, and invoice health across all bookings."/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:16}}>
        <KpiCard label="Gross Revenue"    value={cL?"—":fmt(totalRev)}    sub="all CFRs"  color="#059669" loading={cL} icon={I.revenue("#059669")}/>
        <KpiCard label="Cash Collected"   value={cL?"—":fmt(collected)}   sub="received"  color="#2563EB" loading={cL} icon={I.payout("#2563EB")}/>
        <KpiCard label="Outstanding"      value={iL?"—":fmt(outstanding)} sub="pending"   color="#DB2648" loading={iL} icon={I.invoice("#DB2648")}/>
        <KpiCard label="Overdue Invoices" value={iL?"—":overdue}          sub="action needed" color="#DC2626" loading={iL} icon={I.pending("#DC2626")}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Total Invoices" value={iL?"—":invs.length}  sub="raised"   color="#7C3AED" loading={iL} icon={I.invoice("#7C3AED")}/>
        <KpiCard label="Fully Paid"     value={iL?"—":paid}         sub="cleared"  color="#059669" loading={iL} icon={I.trend("#059669")}/>
        <KpiCard label="Partial Paid"   value={iL?"—":partial}      sub="follow up" color="#D97706" loading={iL} icon={I.job("#D97706")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:16}}>
        <Card>
          <SectionTitle>Invoice Status Breakdown</SectionTitle>
          {iL ? <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["draft","sent","partial","paid","overdue","cancelled"]} data={invs.map(i=>({...i,stage:i.status}))} colorMap={invColors}/>}
        </Card>
        <Card>
          <SectionTitle>Invoices Needing Action</SectionTitle>
          <MiniTable loading={iL} rows={invs.filter(i=>["overdue","partial","sent"].includes(i.status)).slice(0,8)} cols={[
            {k:"inv_number",l:"Invoice #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.inv_number||"—"}</code>},
            {k:"grand_total",l:"Amount",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
            {k:"outstanding",l:"Outstanding",r:r=><strong style={{color:(r.outstanding||0)>0?"#DC2626":"#059669"}}>₹{(r.outstanding||0).toLocaleString("en-IN")}</strong>},
            {k:"due_date",l:"Due Date"},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  6. SURVEYOR DASHBOARD
// ──────────────────────────────────────────────────────────────────────────────
function SurveyorDash() {
  const { user } = useAppAuth();
  const { items:surveys, loading:sL } = useCollection("surveys",   { sort:"-created", perPage:200 });
  const { items:enqs,   loading:eL  } = useCollection("enquiries", { sort:"-created", perPage:200 });

  const pending   = surveys.filter(s=>s.status==="pending"||s.status==="assigned").length;
  const scheduled = surveys.filter(s=>s.status==="scheduled").length;
  const completed = surveys.filter(s=>s.status==="completed"||s.status==="report-filed").length;
  const svColors  = { pending:"#D97706",assigned:"#2563EB",scheduled:"#7C3AED","in-progress":"#0D9488",completed:"#059669","report-filed":"#059669" };

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub="Your survey assignments, completion rate, and upcoming visits."/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Total Surveys"    value={sL?"—":surveys.length} sub="assigned"   color="#2563EB" loading={sL} icon={I.survey("#2563EB")}/>
        <KpiCard label="Pending / Assigned" value={sL?"—":pending}     sub="to visit"    color="#D97706" loading={sL} icon={I.pending("#D97706")}/>
        <KpiCard label="Scheduled"        value={sL?"—":scheduled}     sub="upcoming"    color="#7C3AED" loading={sL} icon={I.job("#7C3AED")}/>
        <KpiCard label="Completed"        value={sL?"—":completed}     sub="done"        color="#059669" loading={sL} icon={I.trend("#059669")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>Survey Pipeline</SectionTitle>
          {sL ? <div style={{height:150,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["pending","assigned","scheduled","in-progress","completed","report-filed"]} data={surveys} colorMap={svColors}/>}
        </Card>
        <Card>
          <SectionTitle>Upcoming Surveys</SectionTitle>
          <MiniTable loading={sL} rows={surveys.filter(s=>["pending","assigned","scheduled"].includes(s.status)).slice(0,7)} cols={[
            {k:"survey_number",l:"Survey #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.survey_number||"—"}</code>},
            {k:"enquiry_id",l:"Enquiry"},
            {k:"survey_date",l:"Date"},
            {k:"survey_time",l:"Time"},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>

      <Card>
        <SectionTitle>Recent Enquiries in Survey Stage</SectionTitle>
        <MiniTable loading={eL} rows={enqs.filter(e=>e.stage==="survey").slice(0,8)} cols={[
          {k:"enq_number",l:"Ref #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.enq_number||"—"}</code>},
          {k:"name",l:"Customer",r:r=><span style={{fontWeight:600}}>{r.name}</span>},
          {k:"phone",l:"Phone"},
          {k:"from_address",l:"From",r:r=><span style={{maxWidth:160,display:"block",overflow:"hidden",textOverflow:"ellipsis"}}>{r.from_address}</span>},
          {k:"to_address",l:"To",r:r=><span style={{maxWidth:160,display:"block",overflow:"hidden",textOverflow:"ellipsis"}}>{r.to_address}</span>},
          {k:"move_type",l:"Type",r:r=><STag v={r.move_type}/>},
        ]}/>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
//  7. VENDOR DASHBOARD (vehicle + manpower)
// ──────────────────────────────────────────────────────────────────────────────
function VendorDash() {
  const { user } = useAppAuth();
  const isVehicle = user?.role === "vehicle_vendor";

  // Find this vendor's own record by email match
  const { items:myVendor, loading:vL } = useCollection("vendors", {
    filter: `email="${user?.email||"__none__"}"`,
    perPage: 1
  });
  const vendor = myVendor[0];

  const { items:cfrs, loading:cL } = useCollection("cfr", {
    sort:"-created", perPage:200,
    filter: isVehicle
      ? `vehicle_vendor_id="${vendor?.id||"__none__"}"`
      : `manpower_vendor_id="${vendor?.id||"__none__"}"`,
    enabled: !!vendor
  });
  const { items:ops, loading:oL } = useCollection("operations", { sort:"-created", perPage:200 });

  const myOps     = ops.filter(o => cfrs.some(c=>c.id===o.cfr_id));
  const active    = cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).length;
  const completed = cfrs.filter(c=>c.status==="delivered").length;
  const earnings  = cfrs.filter(c=>c.status==="delivered").reduce((s,c)=>s+(c.total_paid||0),0);
  const pending   = vendor?.pending_payout || 0;
  const opColors  = { "dispatch-mat":"#D97706",packing:"#7C3AED",loading:"#2563EB","in-transit":"#DB2648",unloading:"#0D9488",delivered:"#059669" };

  return (
    <div className="page-fade">
      <GreetBanner name={user?.name} role={user?.role} branch={user?.branch}
        sub={`Welcome back, ${vendor?.name||"Partner"}. Your jobs, earnings and performance.`}/>

      {/* Vendor profile card */}
      {!vL && vendor && (
        <Card style={{marginBottom:20,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
          <div style={{width:56,height:56,borderRadius:14,background:"rgba(219,38,72,.1)",border:"1.5px solid rgba(219,38,72,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:26}}>
            {isVehicle ? "🚛" : "👷"}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:700,color:"#0F172A"}}>{vendor.name}</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:12.5,color:"#64748B",marginTop:2}}>{vendor.email} · {vendor.phone}</div>
            <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
              <STag v={vendor.type}/>
              <STag v={vendor.status}/>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#D97706"}}>{"⭐".repeat(Math.min(5,vendor.rating||0))} {vendor.rating}/5</span>
              <span style={{fontFamily:"'Inter',sans-serif",fontSize:11.5,color:"#64748B"}}>{vendor.branch} branch</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Poppins',sans-serif",fontSize:22,fontWeight:800,color:"#059669"}}>{vendor.total_jobs||0}</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"#64748B"}}>Total jobs done</div>
          </div>
        </Card>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        <KpiCard label="Assigned Jobs"    value={cL?"—":cfrs.length}  sub="total"      color="#2563EB" loading={cL} icon={I.job("#2563EB")}/>
        <KpiCard label="Active Jobs"      value={cL?"—":active}       sub="ongoing"    color="#D97706" loading={cL} icon={I.pending("#D97706")}/>
        <KpiCard label="Completed"        value={cL?"—":completed}    sub="delivered"  color="#059669" loading={cL} icon={I.trend("#059669")}/>
        <KpiCard label="Pending Payout"   value={vL?"—":fmt(pending)} sub="to receive" color="#7C3AED" loading={vL} icon={I.payout("#7C3AED")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.3fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionTitle>Job Stage Breakdown</SectionTitle>
          {oL ? <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:"#E2E8F0"}}>Loading…</div>
              : <Pipeline stages={["dispatch-mat","packing","loading","in-transit","unloading","delivered"]} data={myOps} colorMap={opColors}/>}
        </Card>
        <Card>
          <SectionTitle>My Active Jobs</SectionTitle>
          <MiniTable loading={cL} rows={cfrs.filter(c=>!["delivered","cancelled"].includes(c.status)).slice(0,6)} cols={[
            {k:"cfr_number",l:"CFR #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.cfr_number||"—"}</code>},
            {k:"move_date",l:"Move Date"},
            {k:"vehicle",l:isVehicle?"Vehicle":"Crew"},
            {k:"vehicle_no",l:"Reg No"},
            {k:"status",l:"Status",r:r=><STag v={r.status}/>},
          ]}/>
        </Card>
      </div>

      <Card>
        <SectionTitle>Recent Job History</SectionTitle>
        <MiniTable loading={cL} rows={cfrs.slice(0,8)} cols={[
          {k:"cfr_number",l:"CFR #",r:r=><code style={{fontSize:11,fontWeight:700}}>{r.cfr_number||"—"}</code>},
          {k:"move_date",l:"Date"},
          {k:"grand_total",l:"Job Value",r:r=>`₹${(r.grand_total||0).toLocaleString("en-IN")}`},
          {k:"total_paid",l:"Received",r:r=>`₹${(r.total_paid||0).toLocaleString("en-IN")}`},
          {k:"status",l:"Status",r:r=><STag v={r.status}/>},
        ]}/>
      </Card>
    </div>
  );
}

function EnquiriesPage(){
  const toast=useToast();
  const [ferr,setFerr]=useState({});
  const {user}=useAppAuth();
  const [show,setShow]=useState(false);
  const [q,setQ]=useState(""); const [sf,setSf]=useState("");
  const {items,loading,refresh}=useCollection("enquiries",{sort:"-created",perPage:200,realtime:true});
  const {create,loading:saving}=useMutation("enquiries");
  const [f,setF]=useState({name:"",phone:"",email:"",alt_phone:"",from_address:"",to_address:"",move_type:"household",source:"website",stage:"new",branch:user?.branch||"NDLH",fy:FY,seq:"0",apt_size:"",move_date:"",notes:""});
  const filtered=items.filter(e=>{
    const qq=q.toLowerCase();
    return(!qq||e.name?.toLowerCase().includes(qq)||e.phone?.includes(qq)||e.enq_number?.toLowerCase().includes(qq))&&(!sf||e.stage===sf);
  });
  const save=async()=>{
    const e2=validate({name:[V.required],phone:[V.required,V.phone],email:[V.email],from_address:[V.required],to_address:[V.required]},f);
    if(Object.keys(e2).length){setFerr(e2);return;}
    setFerr({});setErr("");
    try{await create(f);toast("Enquiry created!","success");setShow(false);setF(initF);refresh();}
    catch(e){toast(e.message||"Failed","error");setErr(e.message);}
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
  const toast=useToast();
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("surveys",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("surveys");
  const [f,setF]=useState({enquiry_id:"",agent_name:"",survey_date:"",survey_time:"",floor:"",has_lift:false,distance:"",condition:"",agent_notes:"",status:"pending"});
  const SS=["pending","assigned","scheduled","in-progress","completed","report-filed"];
  const save=async()=>{try{await create(f);toast("Created successfully!","success");setShow(false);refresh();}catch(e){toast(e.message||"Failed","error");}};
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
  const toast=useToast();
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
  const toast=useToast();
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("cfr",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("cfr");
  const [f,setF]=useState({enquiry_id:"",quotation_id:"",grand_total:"",token_amt:"",move_date:"",vehicle:"",vehicle_no:"",is_interstate:false,status:"token-pending"});
  const SS=["token-pending","token-received","confirmed","vendor-assigned","ops-ready","in-transit","delivered","cancelled"];
  const save=async()=>{try{await create({...f,grand_total:+f.grand_total,token_amt:+f.token_amt,total_paid:0});toast("Booking created!","success");setShow(false);refresh();}catch(e){alert(e.message);}};
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
  const toast=useToast();
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("operations",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("operations");
  const [f,setF]=useState({cfr_id:"",bilty_no:"",invoice_no:"",stage:"dispatch-mat"});
  const SS=["dispatch-mat","packing","loading","in-transit","unloading","delivered"];
  const save=async()=>{try{await create(f);toast("Created successfully!","success");setShow(false);refresh();}catch(e){toast(e.message||"Failed","error");}};
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
  const toast=useToast();
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("invoices",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("invoices");
  const [f,setF]=useState({cfr_id:"",grand_total:"",paid_amt:"0",outstanding:"",invoice_date:"",due_date:"",gst_no:"",hsn_code:"998543",status:"draft"});
  const SS=["draft","sent","partial","paid","overdue","cancelled"];
  const save=async()=>{const gt=+f.grand_total,pa=+f.paid_amt;try{await create({...f,grand_total:gt,paid_amt:pa,outstanding:gt-pa});toast("Invoice created!","success");setShow(false);refresh();}catch(e){alert(e.message);}};
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
  const toast=useToast();
  const [ferr,setFerr]=useState({});
  const [show,setShow]=useState(false);
  const {items,loading,refresh}=useCollection("vendors",{sort:"-created",perPage:200});
  const {create,loading:saving}=useMutation("vendors");
  const [f,setF]=useState({name:"",type:"vehicle_vendor",contact:"",phone:"",email:"",gst:"",branch:"NDLH",status:"active",rating:5});
  const save=async()=>{
    const e2=validate({name:[V.required],contact:[V.required],phone:[V.phone],email:[V.email]},f);
    if(Object.keys(e2).length){setFerr(e2);return;}
    setFerr({});setErr("");
    try{await create({...f,rating:+f.rating});toast("Vendor added!","success");setShow(false);setF(init);refresh();}
    catch(e){toast(e.message,"error");setErr(e.message);}
  }try{await create({...f,rating:+f.rating});setShow(false);refresh();}catch(e){alert(e.message);}};
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
  const toast=useToast();
  const [f,setF]=useState({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});
  const [saving,setSaving]=useState(false);
  const save=async()=>{
    if(!f.email||!f.password||!f.name){alert("Email, password and name required");return;}
    setSaving(true);
    try{
      const perms=ROLE_DEFAULT_PERMISSIONS[f.role]||{};
      await pb.collection("users").create({...f,passwordConfirm:f.password,emailVisibility:true,permissions:perms});
      toast("User created successfully!","success");
      setShow(false);setF({email:"",password:"",name:"",phone:"",role:"sales_exec",branch:"NDLH",status:"active"});refresh();
    }catch(e){toast(e.message||"Failed","error");}
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
  const toast=useToast();
  const {settings,saveSetting}=useAppAuth();
  const co=settings?.company||{};
  const [f,setF]=useState({name:"",gst:"",address:"",phone:"",email:"",website:""});
  const [saved,setSaved]=useState(false);
  useEffect(()=>{if(co.name)setF({name:co.name||"",gst:co.gst||"",address:co.address||"",phone:co.phone||"",email:co.email||"",website:co.website||""});},[settings]);
  const save=async()=>{await saveSetting("company",f,"company");toast("Settings saved!","success");setSaved(true);setTimeout(()=>setSaved(false),2500);};
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
