import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────
const GUMROAD_URL = "https://cutgo.gumroad.com/l/djcbif"; // ← remplace par ton lien Gumroad
const FREE_DECISIONS = 3;
const VALID_CODE_PREFIX = "CUTGO-"; // codes valides : CUTGO-XXXX

// ─── MODULES ──────────────────────────────────────────────
const MODULES = [
  {
    id: "LOVE", label: "LOVE", icon: "♥", color: "#FF2D55", desc: "Relations & émotions",
    systemPrompt: `Tu es CUT/GO™ LOVE. Décision froide sur les relations. Analyse : respect, toxicité, dépendance, cohérence actes/paroles. Si urgence élevée : verdict sur respect + toxicité uniquement. Réponds UNIQUEMENT en JSON valide : {"verdict":"RESTE"|"QUITTE"|"PRENDS DU RECUL","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SAIN"|"INSTABLE"|"TOXIQUE"}`
  },
  {
    id: "MONEY", label: "MONEY", icon: "◈", color: "#FFD60A", desc: "Décisions financières",
    systemPrompt: `Tu es CUT/GO™ MONEY. Décision froide sur l'argent. Analyse : gain potentiel, perte possible, coût de l'inaction, retour rapide. Si urgence élevée : perte immédiate + opportunité rapide. Réponds UNIQUEMENT en JSON valide : {"verdict":"INVESTIS"|"REFUSE"|"ATTENDS","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"RENTABLE"|"RISQUÉ"|"MAUVAIS"}`
  },
  {
    id: "BUSINESS", label: "BUSINESS", icon: "⬡", color: "#0A84FF", desc: "Décisions entrepreneuriales",
    systemPrompt: `Tu es CUT/GO™ BUSINESS. Décision froide sur le business. Analyse : potentiel de gain, vitesse d'exécution, coût/bénéfice, perte si inaction. Si urgence élevée : gain rapide + risque immédiat. Réponds UNIQUEMENT en JSON valide : {"verdict":"LANCE"|"STOP"|"TEST","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SCALABLE"|"FAIBLE"|"À TESTER"}`
  },
  {
    id: "CREATOR", label: "CREATOR", icon: "▲", color: "#30D158", desc: "Création de contenu",
    systemPrompt: `Tu es CUT/GO™ CREATOR. Décision froide sur la création. Analyse : potentiel d'attention, clarté, différenciation, impact émotionnel. Si urgence élevée : attention + impact immédiats. Réponds UNIQUEMENT en JSON valide : {"verdict":"PUBLIE"|"STOP"|"OPTIMISE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"VIRAL"|"MOYEN"|"INVISIBLE"}`
  },
  {
    id: "CAREER", label: "CAREER", icon: "◆", color: "#BF5AF2", desc: "Décisions professionnelles",
    systemPrompt: `Tu es CUT/GO™ CAREER. Décision froide sur la carrière. Analyse : évolution, compétences, sécurité, opportunité externe, alignement objectif. Si urgence élevée : sécurité + opportunité immédiate. Réponds UNIQUEMENT en JSON valide : {"verdict":"ACCEPTE"|"REFUSE"|"PRÉPARE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"ÉVOLUTIF"|"STABLE"|"BLOQUÉ"}`
  }
];

const SIGNAL_COLORS = {
  SAIN:"#30D158",INSTABLE:"#FFD60A",TOXIQUE:"#FF2D55",
  RENTABLE:"#30D158","RISQUÉ":"#FFD60A",MAUVAIS:"#FF2D55",
  SCALABLE:"#30D158",FAIBLE:"#FF2D55","À TESTER":"#FFD60A",
  VIRAL:"#30D158",MOYEN:"#FFD60A",INVISIBLE:"#FF2D55",
  "ÉVOLUTIF":"#30D158",STABLE:"#FFD60A","BLOQUÉ":"#FF2D55"
};
const VERDICT_COLORS = {
  RESTE:"#30D158",QUITTE:"#FF2D55","PRENDS DU RECUL":"#FFD60A",
  INVESTIS:"#30D158",REFUSE:"#FF2D55",ATTENDS:"#FFD60A",
  LANCE:"#30D158",STOP:"#FF2D55",TEST:"#FFD60A",
  PUBLIE:"#30D158",OPTIMISE:"#FFD60A",
  ACCEPTE:"#30D158","PRÉPARE":"#FFD60A"
};

// ─── STORAGE HELPERS ──────────────────────────────────────
const getCount = () => parseInt(localStorage.getItem("cg_count") || "0");
const addCount = () => localStorage.setItem("cg_count", getCount() + 1);
const isUnlocked = () => localStorage.getItem("cg_unlocked") === "true";
const unlock = () => localStorage.setItem("cg_unlocked", "true");

// ─── STYLES ───────────────────────────────────────────────
const S = {
  app: { minHeight:"100vh", background:"#0A0A0A", fontFamily:"'Courier New',monospace", color:"#F0F0F0" },
  wrap: { maxWidth:640, margin:"0 auto", padding:"32px 20px" },
  label: { fontSize:10, letterSpacing:4, color:"#555", display:"block", marginBottom:8 },
  input: (c) => ({ width:"100%", background:"#0F0F0F", border:"1px solid #1E1E1E", borderBottom:`1px solid ${c}33`, color:"#F0F0F0", padding:"12px 14px", fontFamily:"'Courier New',monospace", fontSize:13, outline:"none", boxSizing:"border-box" }),
  btn: (bg,fg,extra={}) => ({ background:bg, border:`1px solid ${bg==="transparent"?"#222":bg}`, color:fg, padding:"14px 0", cursor:"pointer", fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:3, fontSize:11, ...extra }),
};

// ─── APP ──────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState("select");
  const [mod, setMod] = useState(null);
  const [form, setForm] = useState({ situation:"", optionA:"", optionB:"", urgence:"moyenne", objectif:"", peur:"" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [count, setCount] = useState(getCount());
  const [showPaywall, setShowPaywall] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const remaining = Math.max(0, FREE_DECISIONS - count);

  const selectModule = (m) => {
    if (!unlocked && count >= FREE_DECISIONS) { setShowPaywall(true); return; }
    setMod(m); setStep("form");
    setForm({ situation:"", optionA:"", optionB:"", urgence:"moyenne", objectif:"", peur:"" });
    setResult(null); setError("");
  };

  const handleSubmit = async () => {
    if (!form.situation||!form.optionA||!form.optionB||!form.objectif||!form.peur) { setError("Remplis tous les champs."); return; }
    setError(""); setStep("loading");
    const userMsg = `SITUATION : ${form.situation}\nOPTION A : ${form.optionA}\nOPTION B : ${form.optionB}\nURGENCE : ${form.urgence}\nOBJECTIF : ${form.objectif}\nPEUR PRINCIPALE : ${form.peur}`;
    try {
      const res = await fetch("/api/decide", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ systemPrompt: mod.systemPrompt, userMsg })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      addCount(); setCount(getCount());
      setResult(data); setStep("result");
    } catch(e) { setError("Erreur. Réessaie."); setStep("form"); }
  };

  const handleCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.startsWith(VALID_CODE_PREFIX) && code.length >= 10) {
      unlock(); setUnlocked(true); setShowPaywall(false); setCodeError("");
    } else {
      setCodeError("Code invalide. Vérifie ton email Gumroad.");
    }
  };

  const handleShare = () => {
    if (!result || !mod) return;
    const text = `CUT/GO™ ${mod.label}\n\nVERDICT : ${result.verdict}\nSIGNAL : ${result.signal}\nACTION : ${result.action}\n\ncutgo.app`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const reset = () => { setStep("select"); setMod(null); setResult(null); setError(""); };

  return (
    <div style={S.app}>
      <style>{`
        * { box-sizing: border-box; }
        textarea { resize: none; }
        @keyframes pulse { 0%,100%{opacity:.2;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(2.5)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeIn .3s ease forwards; }
        button:hover { opacity: .85; }
        input::placeholder, textarea::placeholder { color: #333; }
      `}</style>

      {/* PAYWALL MODAL */}
      {showPaywall && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.92)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div className="fade" style={{ maxWidth:440, width:"100%", border:"1px solid #222", padding:"36px 28px", background:"#0D0D0D" }}>
            <div style={{ fontSize:10, letterSpacing:5, color:"#555", marginBottom:16 }}>ACCÈS LIMITÉ</div>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:-1, marginBottom:8 }}>
              Tu as utilisé tes {FREE_DECISIONS} décisions gratuites.
            </div>
            <div style={{ fontSize:13, color:"#666", marginBottom:28, lineHeight:1.6 }}>
              Pour continuer, rejoins le CUT/GO™ CLUB.<br/>
              7 jours offerts. Ensuite 9€/mois.
            </div>

            {/* Avantages */}
            <div style={{ border:"1px solid #1A1A1A", padding:"16px 18px", marginBottom:20 }}>
              {["5 modules de base","Décisions illimitées","Modes exclusifs à venir","Formats de sortie avancés","Nouveaux scénarios chaque semaine"].map((f,i) => (
                <div key={i} style={{ fontSize:12, color:"#888", marginBottom:6, display:"flex", gap:10 }}>
                  <span style={{ color:"#30D158" }}>✓</span>{f}
                </div>
              ))}
            </div>

            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ display:"block", textDecoration:"none" }}>
              <button style={{ ...S.btn("#F0F0F0","#000"), width:"100%", padding:"18px 0", fontSize:13 }}>
                ⚡ COMMENCER — 7 JOURS OFFERTS
              </button>
            </a>

            <div style={{ textAlign:"center", margin:"20px 0 16px", fontSize:11, color:"#333", letterSpacing:2 }}>— OU —</div>

            {/* Code input */}
            <div style={{ fontSize:10, letterSpacing:3, color:"#555", marginBottom:8 }}>J'AI DÉJÀ UN CODE D'ACCÈS</div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={codeInput} onChange={e => setCodeInput(e.target.value)}
                placeholder="CUTGO-XXXXXX"
                style={{ ...S.input("#F0F0F0"), flex:1 }}
                onKeyDown={e => e.key === "Enter" && handleCode()}
              />
              <button onClick={handleCode} style={{ ...S.btn("#222","#F0F0F0"), padding:"0 20px", border:"1px solid #333" }}>OK</button>
            </div>
            {codeError && <div style={{ color:"#FF2D55", fontSize:11, marginTop:8, letterSpacing:1 }}>{codeError}</div>}

            <button onClick={() => setShowPaywall(false)} style={{ background:"none", border:"none", color:"#333", fontSize:11, cursor:"pointer", marginTop:20, letterSpacing:2, fontFamily:"inherit", display:"block", width:"100%", textAlign:"center" }}>
              Retour
            </button>
          </div>
        </div>
      )}

      <div style={S.wrap}>

        {/* HEADER */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:11, letterSpacing:6, color:"#333", marginBottom:6 }}>DECISION ENGINE</div>
          <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2, lineHeight:1 }}>CUT/GO™</div>
          <div style={{ width:32, height:2, background:"#222", margin:"12px auto 0" }} />
          {!unlocked && (
            <div style={{ marginTop:14, fontSize:11, letterSpacing:2, color:"#444" }}>
              {remaining > 0 ? `${remaining} décision${remaining>1?"s":""} gratuite${remaining>1?"s":""} restante${remaining>1?"s":""}` : "Essai terminé"}
              {remaining > 0 && <span style={{ display:"inline-block", width:remaining*18, height:4, background:"#1A1A1A", marginLeft:12, verticalAlign:"middle", position:"relative" }}>
                <span style={{ position:"absolute", left:0, top:0, height:"100%", width:`${(remaining/FREE_DECISIONS)*100}%`, background:"#333" }} />
              </span>}
            </div>
          )}
          {unlocked && <div style={{ marginTop:14, fontSize:10, letterSpacing:3, color:"#30D158" }}>✓ CLUB — ACCÈS COMPLET</div>}
        </div>

        {/* SELECT */}
        {step === "select" && (
          <div className="fade">
            <div style={{ fontSize:10, letterSpacing:4, color:"#333", marginBottom:16 }}>— CHOISIS TON MODULE</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {MODULES.map(m => (
                <button key={m.id} onClick={() => selectModule(m)} style={{
                  background:"transparent", border:"1px solid #1A1A1A", borderLeft:`3px solid ${m.color}`,
                  color:"#F0F0F0", padding:"16px 20px", cursor:"pointer", textAlign:"left",
                  display:"flex", alignItems:"center", gap:14, fontFamily:"inherit", transition:"background .15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background="#111"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:18, color:m.color, width:24, textAlign:"center" }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, letterSpacing:2 }}>{m.label}</div>
                    <div style={{ fontSize:11, color:"#444", marginTop:2 }}>{m.desc}</div>
                  </div>
                  <span style={{ color:"#2A2A2A" }}>→</span>
                </button>
              ))}
            </div>

            {!unlocked && (
              <div style={{ marginTop:24, border:"1px solid #151515", padding:"18px 20px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#444", marginBottom:12, letterSpacing:1 }}>
                  Décisions illimitées + modes exclusifs
                </div>
                <button onClick={() => setShowPaywall(true)} style={{ ...S.btn("#F0F0F0","#000"), padding:"12px 28px", fontSize:11 }}>
                  ⚡ 7 JOURS OFFERTS — 9€/MOIS
                </button>
              </div>
            )}
          </div>
        )}

        {/* FORM */}
        {step === "form" && mod && (
          <div className="fade">
            <button onClick={reset} style={{ background:"none", border:"none", color:"#333", fontSize:11, cursor:"pointer", letterSpacing:2, marginBottom:22, fontFamily:"inherit", padding:0 }}>← RETOUR</button>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingBottom:18, borderBottom:"1px solid #151515" }}>
              <span style={{ fontSize:20, color:mod.color }}>{mod.icon}</span>
              <div>
                <div style={{ fontSize:16, fontWeight:700, letterSpacing:2, color:mod.color }}>{mod.label}</div>
                <div style={{ fontSize:11, color:"#444" }}>{mod.desc}</div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {[
                { key:"situation", label:"SITUATION", ph:"Décris en 1 à 3 phrases...", multi:true },
                { key:"optionA", label:"OPTION A", ph:"Choix principal" },
                { key:"optionB", label:"OPTION B", ph:"Alternative" },
                { key:"objectif", label:"OBJECTIF", ph:"Ce que tu veux vraiment" },
                { key:"peur", label:"PEUR PRINCIPALE", ph:"Ce qui te bloque" },
              ].map(f => (
                <div key={f.key}>
                  <label style={S.label}>{f.label}</label>
                  {f.multi
                    ? <textarea value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph} rows={3} style={S.input(mod.color)} />
                    : <input value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.ph} style={S.input(mod.color)} />
                  }
                </div>
              ))}
              <div>
                <label style={S.label}>URGENCE</label>
                <div style={{ display:"flex", gap:8 }}>
                  {["faible","moyenne","élevée"].map(u => (
                    <button key={u} onClick={() => setForm({...form,urgence:u})} style={{
                      flex:1, padding:"10px 0", background:form.urgence===u?mod.color:"transparent",
                      border:`1px solid ${form.urgence===u?mod.color:"#222"}`, color:form.urgence===u?"#000":"#444",
                      fontSize:10, letterSpacing:2, cursor:"pointer", fontFamily:"inherit",
                      fontWeight:form.urgence===u?700:400, textTransform:"uppercase"
                    }}>{u}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div style={{ color:"#FF2D55", fontSize:11, marginTop:14, letterSpacing:1 }}>{error}</div>}
            <button onClick={handleSubmit} style={{ ...S.btn(mod.color,"#000"), width:"100%", marginTop:24, padding:"17px 0", fontSize:13 }}>
              ANALYSER →
            </button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:10, letterSpacing:6, color:"#2A2A2A", marginBottom:28 }}>ANALYSE EN COURS</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:5, height:5, background:mod?.color||"#F0F0F0", animation:`pulse 1.2s ${i*.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === "result" && result && mod && (
          <div className="fade" ref={cardRef}>
            <button onClick={() => setStep("form")} style={{ background:"none", border:"none", color:"#333", fontSize:11, cursor:"pointer", letterSpacing:2, marginBottom:22, fontFamily:"inherit", padding:0 }}>← MODIFIER</button>

            {/* Verdict */}
            <div style={{ border:`1px solid ${VERDICT_COLORS[result.verdict]||mod.color}22`, background:`${VERDICT_COLORS[result.verdict]||mod.color}08`, padding:"24px 22px", marginBottom:10, position:"relative" }}>
              <div style={{ fontSize:9, letterSpacing:4, color:"#444", marginBottom:10 }}>VERDICT</div>
              <div style={{ fontSize:52, fontWeight:900, letterSpacing:-2, color:VERDICT_COLORS[result.verdict]||mod.color, lineHeight:1 }}>
                {result.verdict}
              </div>
              <div style={{ position:"absolute", top:18, right:18, background:SIGNAL_COLORS[result.signal]||"#555", color:"#000", fontSize:9, letterSpacing:3, padding:"5px 10px", fontWeight:900 }}>
                {result.signal}
              </div>
            </div>

            {/* Pourquoi */}
            <div style={{ border:"1px solid #151515", padding:"18px 22px", marginBottom:8 }}>
              <div style={{ fontSize:9, letterSpacing:4, color:"#444", marginBottom:12 }}>POURQUOI</div>
              {result.pourquoi.map((r,i) => (
                <div key={i} style={{ fontSize:13, color:"#BBBBBB", marginBottom:8, paddingLeft:14, borderLeft:`2px solid #1E1E1E`, lineHeight:1.5 }}>{r}</div>
              ))}
            </div>

            {/* Action */}
            <div style={{ background:`${mod.color}0D`, border:`1px solid ${mod.color}22`, padding:"18px 22px", marginBottom:8 }}>
              <div style={{ fontSize:9, letterSpacing:4, color:mod.color, marginBottom:8 }}>ACTION IMMÉDIATE</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#F0F0F0", lineHeight:1.5 }}>{result.action}</div>
            </div>

            {/* Risque + Conséquence */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
              <div style={{ border:"1px solid #151515", padding:"14px 16px" }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#444", marginBottom:8 }}>RISQUE SI INACTION</div>
                <div style={{ fontSize:12, color:"#666", lineHeight:1.5 }}>{result.risque}</div>
              </div>
              <div style={{ border:"1px solid #151515", padding:"14px 16px" }}>
                <div style={{ fontSize:9, letterSpacing:3, color:"#444", marginBottom:8 }}>SI TU TE TROMPES</div>
                <div style={{ fontSize:12, color:"#666", lineHeight:1.5 }}>{result.consequence}</div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <button onClick={handleShare} style={{ flex:1, ...S.btn("transparent","#666"), border:"1px solid #1A1A1A" }}>
                {copied ? "✓ COPIÉ" : "PARTAGER"}
              </button>
              <button onClick={() => selectModule(mod)} style={{ flex:1, ...S.btn("transparent","#666"), border:"1px solid #1A1A1A" }}>
                NOUVELLE
              </button>
              <button onClick={reset} style={{ flex:1, ...S.btn(mod.color,"#000") }}>
                MODULES
              </button>
            </div>

            {/* Upsell post-résultat si presque à la limite */}
            {!unlocked && count >= FREE_DECISIONS - 1 && (
              <div style={{ marginTop:16, border:"1px solid #1A1A1A", padding:"16px 20px", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#555", marginBottom:10, letterSpacing:1 }}>
                  {count >= FREE_DECISIONS ? "C'était ta dernière décision gratuite." : "Plus qu'une décision gratuite."}
                </div>
                <button onClick={() => setShowPaywall(true)} style={{ ...S.btn("#F0F0F0","#000"), padding:"12px 24px", fontSize:11 }}>
                  ⚡ CONTINUER — 7 JOURS OFFERTS
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:36, fontSize:9, letterSpacing:4, color:"#1E1E1E" }}>CUT/GO™ — DECISION ENGINE</div>
      </div>
    </div>
  );
}
