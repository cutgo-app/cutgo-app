import { useState, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────
const GUMROAD_URL = "https://cutgo.gumroad.com/l/djcbif";
const FREE_DECISIONS = 3;
const VALID_CODE_PREFIX = "CUTGO-";
const SITE_URL = "www.cutgo.org";

// ─── DESIGN TOKENS ────────────────────────────────────────────
const SANS = "'Inter','Helvetica Neue','Arial',sans-serif";
const MONO = "'Courier New',monospace";
const BG    = "#0A0A0C";
const CARD  = "#141416";
const CARD2 = "#1C1C1E";
const BORDER = "rgba(255,255,255,0.07)";
const MUTED  = "rgba(255,255,255,0.35)";
const TEXT   = "#F0F0F6";

// ─── MODULES ──────────────────────────────────────────────────
const BASE_MODULES = [
  { id:"LOVE",     label:"LOVE",     icon:"♡", color:"#FF2D55", desc:"Relations & émotions",       systemPrompt:`Tu es CUT/GO™ LOVE. Décision froide sur les relations. Analyse : respect, toxicité, dépendance, cohérence actes/paroles. Réponds UNIQUEMENT en JSON valide : {"verdict":"RESTE"|"QUITTE"|"PRENDS DU RECUL","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SAIN"|"INSTABLE"|"TOXIQUE"}` },
  { id:"MONEY",    label:"MONEY",    icon:"◈", color:"#FFD60A", desc:"Décisions financières",       systemPrompt:`Tu es CUT/GO™ MONEY. Décision froide sur l'argent. Analyse : gain potentiel, perte possible, coût de l'inaction. Réponds UNIQUEMENT en JSON valide : {"verdict":"INVESTIS"|"REFUSE"|"ATTENDS","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"RENTABLE"|"RISQUÉ"|"MAUVAIS"}` },
  { id:"BUSINESS", label:"BUSINESS", icon:"⬡", color:"#0A84FF", desc:"Décisions entrepreneuriales", systemPrompt:`Tu es CUT/GO™ BUSINESS. Décision froide sur le business. Analyse : potentiel, vitesse, coût/bénéfice. Réponds UNIQUEMENT en JSON valide : {"verdict":"LANCE"|"STOP"|"TEST","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SCALABLE"|"FAIBLE"|"À TESTER"}` },
  { id:"CREATOR",  label:"CREATOR",  icon:"▲", color:"#30D158", desc:"Création de contenu",         systemPrompt:`Tu es CUT/GO™ CREATOR. Décision froide sur la création. Analyse : attention, clarté, différenciation. Réponds UNIQUEMENT en JSON valide : {"verdict":"PUBLIE"|"STOP"|"OPTIMISE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"VIRAL"|"MOYEN"|"INVISIBLE"}` },
  { id:"CAREER",   label:"CAREER",   icon:"◆", color:"#BF5AF2", desc:"Décisions professionnelles",  systemPrompt:`Tu es CUT/GO™ CAREER. Décision froide sur la carrière. Analyse : évolution, sécurité, opportunité. Réponds UNIQUEMENT en JSON valide : {"verdict":"ACCEPTE"|"REFUSE"|"PRÉPARE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"ÉVOLUTIF"|"STABLE"|"BLOQUÉ"}` },
];

const EXCLUSIVE_MODES = [
  { id:"URGENCE",     label:"MODE URGENCE",     icon:"◈", color:"#FF2D55", desc:"Verdict en 10 secondes",       clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE URGENCE. Ultra-rapide, pas de nuance. Réponds UNIQUEMENT en JSON valide : {"verdict":"GO"|"STOP","pourquoi":["r1"],"action":"string","risque":"string","consequence":"string","signal":"CRITIQUE"|"URGENT"|"STABLE"}` },
  { id:"HIGH_RISK",   label:"MODE HIGH RISK",   icon:"◬", color:"#FF6B35", desc:"Analyse des risques extrêmes", clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE HIGH RISK. Focus pire scénario. Réponds UNIQUEMENT en JSON valide : {"verdict":"DANGER"|"RISQUE MODÉRÉ"|"ACCEPTABLE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"ATTENTION"|"OK"}` },
  { id:"MANIPULATION",label:"MODE MANIPULATION",icon:"◉", color:"#BF5AF2", desc:"Détecte si on te manipule",    clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE MANIPULATION. Détecte gaslighting, love bombing, manipulation émotionnelle. Réponds UNIQUEMENT en JSON valide : {"verdict":"MANIPULATION DÉTECTÉE"|"SUSPECT"|"SAIN","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"SUSPECT"|"SAIN"}` },
];

const ALL_MODULES = [...BASE_MODULES, ...EXCLUSIVE_MODES];

// ─── SCÉNARIOS ────────────────────────────────────────────────
const SCENARIOS = {
  LOVE: [
    { label:"Ex toxique qui revient",          situation:"Je reviens toujours vers mon ex. Je sais que c'est toxique mais je n'arrive pas à m'en empêcher.",                                                        optionA:"Lui redonner une chance",               optionB:"Couper définitivement",              urgence:"élevée",  objectif:"Sortir de ce cycle une fois pour toutes",             peur:"Le regret et la solitude" },
    { label:"Il/elle veut rien de sérieux",    situation:"Il/elle m'appelle bébé la nuit, dort chez moi... mais en journée dit qu'il/elle veut rien de sérieux.",                                                  optionA:"Continuer en espérant qu'il/elle change",optionB:"Prendre de la distance",              urgence:"élevée",  objectif:"Ne pas m'attacher pour rien",                         peur:"La perdre" },
    { label:"Amoureux de mon meilleur ami",    situation:"Je suis amoureux(se) de mon meilleur ami(e) depuis 2 ans. Je n'ai jamais rien dit.",                                                                     optionA:"Lui avouer mes sentiments",             optionB:"Garder le secret et préserver l'amitié",urgence:"moyenne", objectif:"Ne pas perdre cette personne mais ne plus souffrir",  peur:"Briser une amitié de 10 ans" },
    { label:"Trahison / infidélité",           situation:"Mon/ma partenaire m'a trompé(e). Il/elle dit que c'est fini et veut qu'on continue.",                                                                    optionA:"Pardonner et recommencer",              optionB:"Mettre fin à la relation",           urgence:"moyenne", objectif:"Ne pas regretter ma décision dans 1 an",              peur:"Partir et regretter, ou rester et souffrir" },
    { label:"Relation longue distance",        situation:"Relation longue distance depuis 1 an. On se voit 1 fois tous les 2 mois. Les doutes s'accumulent.",                                                      optionA:"Continuer à distance",                  optionB:"Mettre fin à la relation",           urgence:"faible",  objectif:"Construire quelque chose de stable",                  peur:"Avoir tout sacrifié pour rien" },
    { label:"Retour après 1 an de séparation", situation:"Mon ex et moi sommes restés en contact. On se revoit depuis 2 mois mais on s'était séparé pour de bonnes raisons.",                                     optionA:"Tenter à nouveau la relation",          optionB:"Couper le contact définitivement",   urgence:"moyenne", objectif:"Éviter de revivre la même rupture",                   peur:"Passer à côté de quelque chose de vrai" },
  ],
  MONEY: [
    { label:"Quitter le CDI pour entreprendre",situation:"CDI stable mais sans évolution. Projet de business depuis 8 mois. J'hésite à sauter le pas.",                                                           optionA:"Rester en CDI et lancer en parallèle", optionB:"Démissionner et me lancer à 100%",   urgence:"moyenne", objectif:"Ne plus regretter dans 5 ans",                        peur:"Tout perdre et devoir recommencer à zéro" },
    { label:"Investissement risqué",           situation:"On me propose d'investir mes économies dans un projet avec un fort potentiel mais peu de garanties.",                                                    optionA:"Investir maintenant",                   optionB:"Attendre plus d'informations",       urgence:"élevée",  objectif:"Faire fructifier mon argent",                         peur:"Tout perdre" },
    { label:"Demander une augmentation",       situation:"Pas d'augmentation depuis 2 ans malgré mes résultats. Mon employeur tarde à répondre.",                                                                 optionA:"Demander une augmentation ferme",       optionB:"Chercher ailleurs",                  urgence:"moyenne", objectif:"Être payé à ma juste valeur",                         peur:"Perdre mon poste actuel" },
    { label:"Acheter ou louer",                situation:"J'ai assez pour un apport. Les prix sont hauts. Je me demande si c'est le bon moment d'acheter.",                                                       optionA:"Acheter maintenant",                    optionB:"Continuer à louer et attendre",      urgence:"faible",  objectif:"Construire un patrimoine sans me ruiner",             peur:"Acheter au mauvais moment" },
    { label:"Rembourser dettes ou investir",   situation:"J'ai 10 000€ de dettes à 5% et 10 000€ d'économies. Je me demande quoi faire avec cet argent.",                                                        optionA:"Tout utiliser pour rembourser mes dettes",optionB:"Investir et rembourser progressivement",urgence:"faible", objectif:"Optimiser ma situation financière",                   peur:"Faire le mauvais choix" },
    { label:"Prêt de la famille",              situation:"Ma famille veut me prêter 20 000€ pour financer mon projet. Pas d'intérêts mais pression familiale réelle.",                                            optionA:"Accepter le prêt familial",             optionB:"Chercher un financement externe",    urgence:"élevée",  objectif:"Financer mon projet sans détruire mes relations",     peur:"Créer des tensions familiales en cas d'échec" },
  ],
  BUSINESS: [
    { label:"Lancer sans validation",          situation:"J'ai une idée de produit. Pas encore de client. Je veux lancer sans attendre.",                                                                         optionA:"Lancer maintenant avec ce que j'ai",    optionB:"Valider d'abord avec des clients",   urgence:"élevée",  objectif:"Générer mes premiers revenus rapidement",             peur:"Lancer quelque chose que personne ne veut" },
    { label:"Associé problématique",           situation:"Mon associé ne travaille plus autant que moi mais veut garder 50% des parts.",                                                                          optionA:"Négocier une nouvelle répartition",     optionB:"Se séparer et continuer seul",       urgence:"élevée",  objectif:"Préserver mon projet",                                peur:"Me retrouver seul" },
    { label:"Pivoter ou persévérer",           situation:"Mon produit ne décolle pas après 6 mois. Je me demande si je dois pivoter ou insister.",                                                               optionA:"Pivoter vers une nouvelle direction",   optionB:"Continuer sur la même trajectoire",  urgence:"élevée",  objectif:"Faire fonctionner ce business",                       peur:"Abandonner trop tôt ou persister trop longtemps" },
    { label:"Baisser mes prix",                situation:"Mes concurrents sont moins chers. Je perds des clients. Je me demande si je dois m'aligner.",                                                           optionA:"Baisser mes prix pour être compétitif", optionB:"Maintenir mes prix et travailler ma valeur perçue",urgence:"élevée",objectif:"Gagner des clients sans détruire ma marge",  peur:"Perdre encore plus de clients" },
    { label:"Faire appel à un investisseur",   situation:"Un investisseur propose 50K€ pour 20% de mon business. J'en ai besoin pour accélérer.",                                                                optionA:"Accepter l'investissement",             optionB:"Croître organiquement et rester seul maître",urgence:"moyenne",objectif:"Accélérer sans perdre le contrôle",             peur:"Diluer mon capital et regretter" },
    { label:"Externaliser ou tout faire seul", situation:"Je suis débordé. Je peux externaliser certaines tâches mais ça coûte et je dois faire confiance à quelqu'un.",                                         optionA:"Externaliser et me concentrer sur l'essentiel",optionB:"Tout faire moi-même pour contrôler la qualité",urgence:"moyenne",objectif:"Scaler sans m'épuiser",               peur:"Perdre la qualité ou continuer à me noyer" },
  ],
  CREATOR: [
    { label:"Publier sans être prêt",          situation:"Ma vidéo est prête à 80%. Je pourrais peaufiner encore mais le sujet est tendance maintenant.",                                                         optionA:"Publier maintenant",                    optionB:"Peaufiner encore 1 semaine",         urgence:"élevée",  objectif:"Profiter du momentum",                                peur:"Être jugé sur un contenu imparfait" },
    { label:"Changer de niche",                situation:"Je crée du contenu dans une niche depuis 1 an avec peu de croissance. Une autre niche m'attire.",                                                       optionA:"Changer de niche",                      optionB:"Persévérer dans la niche actuelle",  urgence:"faible",  objectif:"Avoir une audience engagée",                          peur:"Perdre ce que j'ai déjà construit" },
    { label:"Collaboration douteuse",          situation:"Une marque veut me payer pour un partenariat mais leurs valeurs ne correspondent pas aux miennes.",                                                     optionA:"Accepter le partenariat",               optionB:"Refuser et attendre mieux",          urgence:"élevée",  objectif:"Monétiser sans compromettre mon image",              peur:"Perdre l'opportunité financière" },
    { label:"Monétiser maintenant ou attendre",situation:"J'ai 5 000 abonnés. Je peux commencer à monétiser mais je ne sais pas si c'est trop tôt.",                                                             optionA:"Monétiser maintenant",                  optionB:"Attendre 20 000 abonnés",            urgence:"faible",  objectif:"Générer des revenus sans faire fuir mon audience",   peur:"Paraître trop commercial trop tôt" },
    { label:"Court ou long format",            situation:"Les shorts cartonnent en vues mais les longues vidéos créent plus d'engagement et de fidélité.",                                                        optionA:"Me concentrer sur le court format",     optionB:"Continuer le long format",           urgence:"faible",  objectif:"Construire une vraie communauté fidèle",             peur:"Sacrifier la qualité pour l'algorithme" },
    { label:"Révéler mon identité",            situation:"Je crée du contenu en anonyme depuis 6 mois. Révéler mon identité boosterait ma croissance.",                                                          optionA:"Révéler qui je suis",                   optionB:"Rester anonyme",                     urgence:"faible",  objectif:"Grandir plus vite sans sacrifier ma tranquillité",   peur:"Les conséquences professionnelles et personnelles" },
  ],
  CAREER: [
    { label:"Offre externe alléchante",        situation:"CDI correct mais sans évolution. Offre externe avec 30% d'augmentation en startup risquée.",                                                            optionA:"Accepter l'offre externe",              optionB:"Rester et négocier une promotion",   urgence:"élevée",  objectif:"Accélérer ma progression",                           peur:"Rejoindre une startup qui coule" },
    { label:"Reconversion professionnelle",    situation:"10 ans dans mon domaine. Je veux me reconvertir mais cela implique de repartir de zéro.",                                                               optionA:"Me reconvertir maintenant",             optionB:"Attendre d'être plus stable",        urgence:"faible",  objectif:"Travailler dans quelque chose qui a du sens",        peur:"Regretter d'avoir attendu" },
    { label:"Conflit avec le manager",         situation:"Conflit ouvert avec mon manager. L'ambiance est insupportable. On me propose de changer de service.",                                                   optionA:"Changer de service en interne",         optionB:"Chercher un autre emploi",           urgence:"élevée",  objectif:"Travailler dans un environnement sain",              peur:"Fuir sans résoudre le problème" },
    { label:"Devenir manager ou rester expert",situation:"On me propose un poste de manager. Plus de salaire mais plus de terrain. Je suis passionné par mon travail technique.",                                  optionA:"Accepter le poste de manager",          optionB:"Rester expert et demander une revalorisation",urgence:"moyenne",objectif:"Progresser sans perdre ce qui me passionne",        peur:"Devenir manager et détester ça" },
    { label:"Partir travailler à l'étranger",  situation:"Une offre à l'étranger pendant 2 ans. Salaire doublé, expérience internationale.",                                                                     optionA:"Partir à l'étranger",                   optionB:"Rester et chercher mieux localement",urgence:"élevée",  objectif:"Accélérer ma carrière sans tout sacrifier",          peur:"Partir et rater des opportunités ici" },
    { label:"Business en parallèle du CDI",   situation:"Je veux lancer un projet en parallèle de mon emploi. Mon contrat l'interdit partiellement.",                                                            optionA:"Lancer malgré la clause contractuelle", optionB:"Attendre de quitter mon emploi",     urgence:"moyenne", objectif:"Avoir un plan B sans perdre ma sécurité",            peur:"Me faire licencier ou rater le lancement" },
  ],
};

const FORMAT_PROMPTS = {
  BRUTAL:    `Reformate en MODE BRUTAL. Ton cash, sans pitié, 2 raisons max très courtes. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
  RAPIDE:    `Reformate en MODE RAPIDE. 1 raison courte, action en 5 mots max. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
  STRATÉGIQUE:`Reformate en MODE STRATÉGIQUE. 3 raisons détaillées, perspective long terme. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
};

// ─── COULEURS ─────────────────────────────────────────────────
const VC = { QUITTE:"#FF453A","PRENDS DU RECUL":"#FFD60A",RESTE:"#30D158",REFUSE:"#FF453A",ATTENDS:"#FFD60A",INVESTIS:"#30D158",STOP:"#FF453A",TEST:"#FFD60A",LANCE:"#30D158",OPTIMISE:"#FFD60A",PUBLIE:"#30D158","PRÉPARE":"#FFD60A",ACCEPTE:"#30D158",GO:"#30D158",DANGER:"#FF453A","RISQUE MODÉRÉ":"#FFD60A",ACCEPTABLE:"#30D158","MANIPULATION DÉTECTÉE":"#FF453A",SUSPECT:"#FFD60A",SAIN:"#30D158" };
const SC = { SAIN:"#30D158",INSTABLE:"#FFD60A",TOXIQUE:"#FF453A",RENTABLE:"#30D158","RISQUÉ":"#FFD60A",MAUVAIS:"#FF453A",SCALABLE:"#30D158",FAIBLE:"#FF453A","À TESTER":"#FFD60A",VIRAL:"#30D158",MOYEN:"#FFD60A",INVISIBLE:"#FF453A","ÉVOLUTIF":"#30D158",STABLE:"#FFD60A","BLOQUÉ":"#FF453A",CRITIQUE:"#FF453A",URGENT:"#FFD60A",DANGER:"#FF453A",ATTENTION:"#FFD60A",OK:"#30D158",SUSPECT:"#FFD60A" };

// ─── STORAGE ──────────────────────────────────────────────────
const LS = { get:(k,d)=>{ try{ const v=localStorage.getItem(k); return v!==null?JSON.parse(v):d; }catch(e){ return d; } }, set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} } };
const getCount    = ()=> LS.get("cg_count",0);
const addCount    = ()=> LS.set("cg_count",getCount()+1);
const getUnlocked = ()=> LS.get("cg_unlocked",false);
const setUnlocked = ()=> LS.set("cg_unlocked",true);
const getHistory  = ()=> LS.get("cg_history",[]);
const pushHistory = (e)=>{ const h=getHistory(); h.unshift(e); if(h.length>50)h.pop(); LS.set("cg_history",h); };

// ─── SHARE ────────────────────────────────────────────────────
const encShare = (d)=>{ try{ return btoa(encodeURIComponent(JSON.stringify(d))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }catch(e){ return null; } };
const decShare = (s)=>{ try{ const b=s.replace(/-/g,"+").replace(/_/g,"/"); const p=b+"===".slice(0,(4-b.length%4)%4); return JSON.parse(decodeURIComponent(atob(p))); }catch(e){ return null; } };
const buildShareLink = (mod,result)=>{ const enc=encShare({v:result.verdict,s:result.signal,a:result.action,ml:mod.label,mc:mod.color,mi:mod.icon}); return enc?`https://${SITE_URL}/#s/${enc}`:`https://${SITE_URL}`; };

// ─── UI ATOMS ─────────────────────────────────────────────────
const Lbl = ({children,color,mb=10})=> <div style={{fontFamily:MONO,fontSize:9,letterSpacing:4,color:color||MUTED,marginBottom:mb,textTransform:"uppercase"}}>{children}</div>;
const Crd = ({children,accent,hi,style={}})=> <div style={{background:hi?`${accent}15`:CARD,border:`1px solid ${hi?`${accent}30`:BORDER}`,borderRadius:16,padding:"18px",...style}}>{children}</div>;

// ─── ÉCRAN PARTAGÉ (destinataire) ────────────────────────────
function SharedView({ data }) {
  const vc = VC[data.v]||"#F0F0F6";
  const sc = SC[data.s]||"#888";
  return (
    <div style={{background:BG,minHeight:"100vh",fontFamily:SANS,color:TEXT,padding:"0 0 40px"}}>
      <div style={{textAlign:"center",padding:"24px 0 18px",borderBottom:`1px solid ${BORDER}`}}>
        <div style={{fontFamily:MONO,fontSize:22,fontWeight:900,color:"#FFFFFF",letterSpacing:-1}}>CUT/GO™</div>
        <div style={{fontFamily:MONO,fontSize:8,letterSpacing:6,color:"#2A2A2A",marginTop:4}}>DECISION ENGINE</div>
      </div>
      <div style={{maxWidth:520,margin:"0 auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:`${vc}12`,border:`1px solid ${vc}28`,borderRadius:16,padding:"22px 20px"}}>
          <Lbl color={sc}>— Verdict reçu · {data.ml}</Lbl>
          <div style={{fontFamily:SANS,fontSize:54,fontWeight:800,color:vc,letterSpacing:-4,lineHeight:.85,marginBottom:14}}>{data.v}</div>
          <div style={{height:2,background:`linear-gradient(90deg,${vc},transparent)`,borderRadius:1,marginBottom:14}}/>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${sc}18`,borderRadius:8,padding:"5px 12px"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:sc}}/>
            <div style={{fontFamily:MONO,fontSize:9,color:sc,letterSpacing:2}}>{data.s}</div>
          </div>
        </div>
        <Crd>
          <Lbl>L'action recommandée</Lbl>
          <div style={{fontFamily:SANS,fontSize:14,fontWeight:600,color:TEXT,lineHeight:1.5,fontStyle:"italic"}}>« {data.a} »</div>
        </Crd>
        <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:16,padding:"24px 20px",textAlign:"center"}}>
          <Lbl mb={12}>Et toi ?</Lbl>
          <div style={{fontFamily:SANS,fontSize:18,fontWeight:700,color:TEXT,marginBottom:8,lineHeight:1.3}}>Qu'est-ce que l'IA te dirait à toi ?</div>
          <div style={{fontFamily:SANS,fontSize:12,color:MUTED,marginBottom:20,lineHeight:1.5}}>3 décisions gratuites · Aucune inscription</div>
          <a href={`https://${SITE_URL}`} style={{textDecoration:"none",display:"block"}}>
            <button style={{width:"100%",padding:"17px 0",background:TEXT,border:"none",borderRadius:14,color:"#000",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ OBTENIR MON VERDICT</button>
          </a>
          <div style={{fontFamily:MONO,fontSize:8,color:"#2A2A2A",marginTop:12,letterSpacing:3}}>{SITE_URL}</div>
        </div>
      </div>
    </div>
  );
}

// ─── PAYWALL ──────────────────────────────────────────────────
function Paywall({ count, onClose, onUnlock }) {
  const [code,setCode]=useState(""); const [err,setErr]=useState("");
  const check=()=>{ const c=code.trim().toUpperCase(); if(c.startsWith(VALID_CODE_PREFIX)&&c.length>=10){ setUnlocked(); onUnlock(); }else{ setErr("Code invalide. Vérifie ton email Gumroad."); } };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:440,width:"100%",background:"#0D0D0F",border:`1px solid ${BORDER}`,borderRadius:20,padding:"32px 24px"}}>
        <Lbl mb={14}>Accès limité</Lbl>
        <div style={{fontFamily:SANS,fontSize:22,fontWeight:700,color:TEXT,marginBottom:8,lineHeight:1.2}}>{count>=FREE_DECISIONS?`Tes ${FREE_DECISIONS} décisions gratuites sont utilisées.`:"Mode exclusif Club."}</div>
        <div style={{fontFamily:SANS,fontSize:13,color:MUTED,marginBottom:22,lineHeight:1.6}}>7 jours offerts. Ensuite 9€/mois.</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
          {["Décisions illimitées","Historique complet","3 modes exclusifs : URGENCE, HIGH RISK, MANIPULATION","Formats BRUTAL / RAPIDE / STRATÉGIQUE","6 scénarios par module"].map((f,i)=>(
            <div key={i} style={{fontFamily:SANS,fontSize:12,color:MUTED,marginBottom:5,display:"flex",gap:10}}><span style={{color:"#30D158"}}>✓</span>{f}</div>
          ))}
        </div>
        <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",marginBottom:14}}>
          <button style={{width:"100%",padding:"16px 0",background:TEXT,border:"none",borderRadius:14,color:"#000",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ COMMENCER — 7 JOURS OFFERTS</button>
        </a>
        <Lbl mb={8}>J'ai déjà un code</Lbl>
        <div style={{display:"flex",gap:8,marginBottom:err?8:0}}>
          <input value={code} onChange={e=>setCode(e.target.value)} placeholder="CUTGO-XXXXXX" onKeyDown={e=>e.key==="Enter"&&check()} style={{flex:1,background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,padding:"11px 14px",fontFamily:MONO,fontSize:12,outline:"none"}}/>
          <button onClick={check} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,padding:"0 18px",fontFamily:MONO,fontSize:10,fontWeight:700,cursor:"pointer",letterSpacing:1}}>OK</button>
        </div>
        {err&&<div style={{fontFamily:MONO,color:"#FF453A",fontSize:10,marginBottom:8,letterSpacing:1}}>{err}</div>}
        <button onClick={onClose} style={{background:"none",border:"none",color:"#333",fontFamily:MONO,fontSize:9,cursor:"pointer",marginTop:14,display:"block",width:"100%",textAlign:"center",letterSpacing:2}}>Retour</button>
      </div>
    </div>
  );
}

// ─── SHARE MODAL ──────────────────────────────────────────────
function ShareModal({ mod, result, onClose }) {
  const [copied,setCopied]=useState(false);
  const link = buildShareLink(mod,result);
  const copy=()=>{ navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false),2500); };
  const vc=VC[result.verdict]||mod.color;
  const sc=SC[result.signal]||"#888";
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:440,width:"100%",background:"#0D0D0F",border:`1px solid ${BORDER}`,borderRadius:20,padding:"28px 22px"}}>
        <Lbl mb={18}>Partager mon verdict</Lbl>
        <div style={{background:`${vc}10`,border:`1px solid ${vc}25`,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontFamily:SANS,fontSize:28,fontWeight:800,color:vc,letterSpacing:-1}}>{result.verdict}</div>
          <div style={{width:1,height:32,background:BORDER}}/>
          <div><div style={{fontFamily:MONO,fontSize:8,color:sc,letterSpacing:2,marginBottom:3}}>{result.signal}</div><div style={{fontFamily:SANS,fontSize:11,color:MUTED}}>{mod.label} · CUT/GO™</div></div>
        </div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <Lbl mb={6}>Lien</Lbl>
          <div style={{fontFamily:MONO,fontSize:10,color:MUTED,wordBreak:"break-all",lineHeight:1.5}}>{SITE_URL}/#s/<span style={{color:TEXT}}>{"..."}</span></div>
        </div>
        <button onClick={copy} style={{width:"100%",padding:"15px 0",background:copied?"#30D158":TEXT,border:"none",borderRadius:14,color:"#000",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:3,cursor:"pointer",marginBottom:10}}>
          {copied?"✓ LIEN COPIÉ !":"COPIER LE LIEN"}
        </button>
        <div style={{fontFamily:SANS,fontSize:12,color:MUTED,textAlign:"center",lineHeight:1.6,marginBottom:14}}>Ton ami ouvre le lien et voit ton verdict.<br/>Un bouton l'invite à tester l'appli.</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#333",fontFamily:MONO,fontSize:9,cursor:"pointer",display:"block",width:"100%",textAlign:"center",letterSpacing:2}}>Fermer</button>
      </div>
    </div>
  );
}

// ─── RÉSULTAT ─────────────────────────────────────────────────
function ResultScreen({ mod, result, onHome, onNew, unlocked, onPaywall }) {
  const [activeFormat,setActiveFormat]=useState("STANDARD");
  const [formatLoading,setFormatLoading]=useState(false);
  const [displayResult,setDisplayResult]=useState(result);
  const [showShare,setShowShare]=useState(false);
  const vc=VC[displayResult.verdict]||mod.color;
  const sc=SC[displayResult.signal]||"#888";

  const handleFormat=async(f)=>{
    if(!unlocked&&f!=="STANDARD"){ onPaywall(); return; }
    if(f==="STANDARD"){ setDisplayResult(result); setActiveFormat("STANDARD"); return; }
    setFormatLoading(true); setActiveFormat(f);
    try{
      const res=await fetch("/api/decide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemPrompt:"Tu reformates des verdicts CUT/GO™. Réponds UNIQUEMENT en JSON valide.",userMsg:`Voici le verdict: ${JSON.stringify(result)}\n\n${FORMAT_PROMPTS[f]}`})});
      const d=await res.json(); if(!d.error) setDisplayResult(d);
    }catch(e){}
    setFormatLoading(false);
  };

  return (
    <>
      {showShare && <ShareModal mod={mod} result={result} onClose={()=>setShowShare(false)}/>}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {/* Format buttons */}
        <div style={{display:"flex",gap:6}}>
          {["STANDARD","BRUTAL","RAPIDE","STRATÉGIQUE"].map(f=>{
            const active=activeFormat===f;
            const colors={STANDARD:TEXT,BRUTAL:"#FF453A",RAPIDE:"#FFD60A","STRATÉGIQUE":"#0A84FF"};
            return(
              <button key={f} onClick={()=>handleFormat(f)} style={{flex:1,padding:"7px 0",background:active?colors[f]:"transparent",border:`1px solid ${active?colors[f]:BORDER}`,borderRadius:8,color:active?(f==="STANDARD"?"#000":f==="RAPIDE"?"#000":"#fff"):MUTED,fontFamily:MONO,fontSize:7,letterSpacing:1,cursor:"pointer",fontWeight:active?700:400,opacity:(!unlocked&&f!=="STANDARD")?0.4:1}}>
                {f}{!unlocked&&f!=="STANDARD"&&<span style={{display:"block",fontSize:6,color:MUTED,letterSpacing:0}}>CLUB</span>}
              </button>
            );
          })}
        </div>
        {formatLoading?(
          <div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontFamily:MONO,fontSize:9,letterSpacing:4,color:MUTED}}>REFORMATAGE...</div></div>
        ):(
          <>
            <Crd accent={vc} hi>
              <Lbl color={sc}>— {displayResult.signal}</Lbl>
              <div style={{fontFamily:SANS,fontSize:60,fontWeight:800,color:vc,letterSpacing:-4,lineHeight:.85,marginBottom:14}}>{displayResult.verdict}</div>
              <div style={{height:2,background:`linear-gradient(90deg,${vc},transparent)`,borderRadius:1}}/>
            </Crd>
            <Crd>
              <Lbl>Pourquoi</Lbl>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {displayResult.pourquoi.map((r,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{fontFamily:MONO,fontSize:9,color:mod.color,minWidth:20,paddingTop:3,letterSpacing:1}}>0{i+1}</div>
                    <div style={{fontFamily:SANS,fontSize:13,color:TEXT,lineHeight:1.55,opacity:.85}}>{r}</div>
                  </div>
                ))}
              </div>
            </Crd>
            <div style={{background:mod.color,borderRadius:16,padding:"18px"}}>
              <Lbl color="rgba(0,0,0,0.5)">Action immédiate</Lbl>
              <div style={{fontFamily:SANS,fontSize:15,fontWeight:700,color:"#000",lineHeight:1.5}}>{displayResult.action}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[{l:"Risque si inaction",v:displayResult.risque},{l:"Si tu te trompes",v:displayResult.consequence}].map((s,i)=>(
                <Crd key={i}><Lbl>{s.l}</Lbl><div style={{fontFamily:SANS,fontSize:11,color:MUTED,lineHeight:1.5}}>{s.v}</div></Crd>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <button onClick={()=>setShowShare(true)} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,color:MUTED,padding:"13px 0",fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer",fontWeight:700}}>PARTAGER</button>
              <button onClick={onNew} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,color:MUTED,padding:"13px 0",fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer",fontWeight:700}}>NOUVELLE</button>
              <button onClick={onHome} style={{background:mod.color,border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer",fontWeight:700}}>MODULES</button>
            </div>
            {!unlocked&&(
              <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontFamily:SANS,fontSize:12,color:MUTED,marginBottom:10}}>Modes exclusifs + formats avancés disponibles dans le Club.</div>
                <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:10,color:"#000",padding:"10px 20px",fontFamily:MONO,fontSize:9,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>⚡ 7 JOURS OFFERTS</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── FORMULAIRE ───────────────────────────────────────────────
function FormScreen({ mod, onResult, onPaywall, unlocked, count }) {
  const [form,setForm]=useState({situation:"",optionA:"",optionB:"",optionC:"",urgence:"moyenne",objectif:"",peur:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showScenarios,setShowScenarios]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,padding:"12px 14px",fontFamily:SANS,fontSize:13,outline:"none",boxSizing:"border-box"};

  const load=(s)=>{ setForm(f=>({...f,situation:s.situation,optionA:s.optionA,optionB:s.optionB,urgence:s.urgence,objectif:s.objectif,peur:s.peur})); setShowScenarios(false); };

  const submit=async()=>{
    if(!form.situation||!form.optionA||!form.optionB||!form.objectif||!form.peur){ setError("Remplis tous les champs."); return; }
    if(!unlocked&&count>=FREE_DECISIONS){ onPaywall(); return; }
    setError(""); setLoading(true);
    const msg=`SITUATION : ${form.situation}\nOPTION A : ${form.optionA}\nOPTION B : ${form.optionB}${form.optionC?`\nOPTION C : ${form.optionC}`:""}\nURGENCE : ${form.urgence}\nOBJECTIF : ${form.objectif}\nPEUR PRINCIPALE : ${form.peur}`;
    try{
      const res=await fetch("/api/decide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemPrompt:mod.systemPrompt,userMsg:msg})});
      const d=await res.json(); if(d.error) throw new Error(d.error);
      addCount(); onResult(d,{...form});
    }catch(e){ setError("Erreur. Réessaie."); }
    setLoading(false);
  };

  if(loading) return(
    <div style={{textAlign:"center",padding:"80px 0"}}>
      <div style={{fontFamily:MONO,fontSize:9,letterSpacing:6,color:MUTED,marginBottom:24}}>ANALYSE EN COURS</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:mod.color,animation:`p 1.2s ${i*.2}s infinite`}}/>)}
      </div>
      <style>{`@keyframes p{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:1;transform:scale(1.4)}}`}</style>
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${BORDER}`}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${mod.color}18`,border:`1px solid ${mod.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{mod.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:MONO,fontSize:12,fontWeight:700,letterSpacing:2,color:TEXT,marginBottom:3}}>{mod.label}</div>
          <div style={{fontFamily:MONO,fontSize:9,color:MUTED,letterSpacing:1}}>{mod.desc}</div>
        </div>
        {SCENARIOS[mod.id]&&(
          <button onClick={()=>setShowScenarios(!showScenarios)} style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:8,color:MUTED,padding:"7px 12px",fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer"}}>
            {showScenarios?"FERMER":`${SCENARIOS[mod.id].length} SCÉNARIOS`}
          </button>
        )}
      </div>
      {showScenarios&&SCENARIOS[mod.id]&&(
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,marginBottom:16,overflow:"hidden"}}>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:3,color:MUTED,padding:"10px 14px",borderBottom:`1px solid ${BORDER}`}}>CHARGER UN SCÉNARIO</div>
          {SCENARIOS[mod.id].map((s,i)=>(
            <button key={i} onClick={()=>load(s)} style={{width:"100%",background:"transparent",border:"none",borderBottom:i<SCENARIOS[mod.id].length-1?`1px solid ${BORDER}`:"none",color:MUTED,padding:"11px 14px",cursor:"pointer",textAlign:"left",fontFamily:SANS,fontSize:12,display:"flex",alignItems:"center",gap:8}}
              onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{color:mod.color,fontFamily:MONO,fontSize:9}}>→</span>{s.label}
            </button>
          ))}
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[{k:"situation",l:"Situation",ph:"Décris en 1 à 3 phrases...",m:true},{k:"optionA",l:"Option A",ph:"Choix principal"},{k:"optionB",l:"Option B",ph:"Alternative"},{k:"optionC",l:"Option C — optionnel",ph:"Troisième option si besoin"},{k:"objectif",l:"Objectif",ph:"Ce que tu veux vraiment"},{k:"peur",l:"Peur principale",ph:"Ce qui te bloque"}].map(f=>(
          <div key={f.k}>
            <Lbl mb={7}>{f.l}</Lbl>
            {f.m?<textarea value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.ph} rows={3} style={{...inp,resize:"none"}}/>:<input value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.ph} style={inp}/>}
          </div>
        ))}
        <div>
          <Lbl mb={9}>Urgence</Lbl>
          <div style={{display:"flex",gap:8}}>
            {["faible","moyenne","élevée"].map(u=>(
              <button key={u} onClick={()=>set("urgence",u)} style={{flex:1,padding:"10px 0",background:form.urgence===u?mod.color:"transparent",border:`1px solid ${form.urgence===u?mod.color:BORDER}`,borderRadius:10,color:form.urgence===u?"#000":MUTED,fontFamily:MONO,fontSize:9,letterSpacing:1,cursor:"pointer",fontWeight:form.urgence===u?700:400,textTransform:"uppercase"}}>{u}</button>
            ))}
          </div>
        </div>
      </div>
      {error&&<div style={{fontFamily:MONO,color:"#FF453A",fontSize:10,marginTop:12,letterSpacing:1}}>{error}</div>}
      <button onClick={submit} style={{width:"100%",marginTop:20,padding:"16px 0",background:mod.color,border:"none",borderRadius:14,color:"#000",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:4,cursor:"pointer"}}>ANALYSER →</button>
    </div>
  );
}

// ─── ACCUEIL ──────────────────────────────────────────────────
function HomeScreen({ onSelect, unlocked, onPaywall, count }) {
  const remaining=Math.max(0,FREE_DECISIONS-count);
  return(
    <div>
      {!unlocked&&(
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:2,color:MUTED}}>{remaining>0?`${remaining} décision${remaining>1?"s":""} gratuite${remaining>1?"s":""}`:0+" décisions restantes"}</div>
          <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:8,color:"#000",padding:"7px 14px",fontFamily:MONO,fontSize:9,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>CLUB →</button>
        </div>
      )}
      {unlocked&&(
        <div style={{background:`rgba(48,209,88,0.08)`,border:`1px solid rgba(48,209,88,0.2)`,borderRadius:14,padding:"10px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#30D158"}}/>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:2,color:"#30D158"}}>CLUB ACTIF — ACCÈS COMPLET</div>
        </div>
      )}
      <Lbl mb={12}>— Modules</Lbl>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {BASE_MODULES.map(m=>(
          <button key={m.id} onClick={()=>onSelect(m)} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",alignItems:"center",gap:14}}
            onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
            <div style={{width:44,height:44,borderRadius:12,background:`${m.color}18`,border:`1px solid ${m.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,letterSpacing:2,color:TEXT,marginBottom:3}}>{m.label}</div>
              <div style={{fontFamily:SANS,fontSize:11,color:MUTED}}>{m.desc}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontFamily:MONO,fontSize:8,color:"#2A2A2A",letterSpacing:1}}>{SCENARIOS[m.id]?.length} scén.</div>
              <div style={{width:3,height:30,borderRadius:2,background:m.color,opacity:.5}}/>
            </div>
          </button>
        ))}
      </div>
      <Lbl mb={12}>— Modes exclusifs Club</Lbl>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {EXCLUSIVE_MODES.map(m=>(
          <button key={m.id} onClick={()=>{ if(!unlocked){onPaywall();}else{onSelect(m);} }} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",alignItems:"center",gap:14,opacity:unlocked?1:0.45}}
            onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
            <div style={{width:44,height:44,borderRadius:12,background:unlocked?`${m.color}18`:CARD2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:unlocked?18:16,flexShrink:0}}>{unlocked?m.icon:"🔒"}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,letterSpacing:2,color:unlocked?TEXT:MUTED,marginBottom:3}}>{m.label}</div>
              <div style={{fontFamily:SANS,fontSize:11,color:"#444"}}>{m.desc}</div>
            </div>
            {!unlocked&&<div style={{fontFamily:MONO,fontSize:8,color:"#444",letterSpacing:2,background:CARD2,padding:"4px 8px",borderRadius:6}}>CLUB</div>}
          </button>
        ))}
      </div>
      {!unlocked&&(
        <div style={{background:`linear-gradient(135deg,${CARD2},${CARD})`,border:`1px solid ${BORDER}`,borderRadius:16,padding:"20px",textAlign:"center"}}>
          <Lbl mb={10}>Décisions illimitées + modes exclusifs</Lbl>
          <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:12,color:"#000",padding:"13px 26px",fontFamily:MONO,fontSize:10,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ 7 JOURS OFFERTS — 9€/MOIS</button>
        </div>
      )}
    </div>
  );
}

// ─── HISTORIQUE ───────────────────────────────────────────────
function HistoryScreen({ history }) {
  const [selected,setSelected]=useState(null);
  if(selected){
    const vc=VC[selected.result?.verdict]||selected.mod?.color||"#F0F0F6";
    const sc=SC[selected.result?.signal]||"#888";
    return(
      <div>
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:selected.mod?.color||MUTED,fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer",padding:0,marginBottom:18}}>← HISTORIQUE</button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${BORDER}`}}>
          <div style={{width:40,height:40,borderRadius:10,background:`${selected.mod?.color||"#444"}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{selected.mod?.icon||"◎"}</div>
          <div>
            <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,letterSpacing:2,color:selected.mod?.color||TEXT}}>{selected.mod?.label}</div>
            <div style={{fontFamily:MONO,fontSize:9,color:MUTED}}>{new Date(selected.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
        </div>
        {/* Situation */}
        <Crd style={{marginBottom:9}}>
          <Lbl>Situation</Lbl>
          <div style={{fontFamily:SANS,fontSize:12,color:MUTED,lineHeight:1.5,marginBottom:selected.form?.optionA?10:0}}>{selected.form?.situation}</div>
          {selected.form?.optionA&&<div style={{fontFamily:MONO,fontSize:10,color:"#444",marginTop:6}}>A : {selected.form.optionA}</div>}
          {selected.form?.optionB&&<div style={{fontFamily:MONO,fontSize:10,color:"#444",marginTop:3}}>B : {selected.form.optionB}</div>}
          {selected.form?.optionC&&<div style={{fontFamily:MONO,fontSize:10,color:"#444",marginTop:3}}>C : {selected.form.optionC}</div>}
        </Crd>
        {/* Verdict */}
        <Crd accent={vc} hi style={{marginBottom:9}}>
          <Lbl color={sc}>— {selected.result?.signal}</Lbl>
          <div style={{fontFamily:SANS,fontSize:48,fontWeight:800,color:vc,letterSpacing:-3,lineHeight:.85,marginBottom:12}}>{selected.result?.verdict}</div>
          <div style={{height:2,background:`linear-gradient(90deg,${vc},transparent)`,borderRadius:1}}/>
        </Crd>
        {/* Pourquoi */}
        <Crd style={{marginBottom:9}}>
          <Lbl>Pourquoi</Lbl>
          {selected.result?.pourquoi?.map((r,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:i===0?8:0}}>
              <div style={{fontFamily:MONO,fontSize:9,color:selected.mod?.color||TEXT,minWidth:20,paddingTop:3}}>0{i+1}</div>
              <div style={{fontFamily:SANS,fontSize:12,color:TEXT,lineHeight:1.55,opacity:.85}}>{r}</div>
            </div>
          ))}
        </Crd>
        {/* Action */}
        <div style={{background:selected.mod?.color||TEXT,borderRadius:16,padding:"16px 18px",marginBottom:9}}>
          <Lbl color="rgba(0,0,0,0.5)">Action immédiate</Lbl>
          <div style={{fontFamily:SANS,fontSize:13,fontWeight:700,color:"#000",lineHeight:1.5}}>{selected.result?.action}</div>
        </div>
        {/* Risque + Conséquence */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {[{l:"Risque si inaction",v:selected.result?.risque},{l:"Si tu te trompes",v:selected.result?.consequence}].map((s,i)=>(
            <Crd key={i}><Lbl>{s.l}</Lbl><div style={{fontFamily:SANS,fontSize:11,color:MUTED,lineHeight:1.5}}>{s.v}</div></Crd>
          ))}
        </div>
      </div>
    );
  }
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <Lbl mb={0}>— Historique</Lbl>
        <div style={{fontFamily:MONO,fontSize:9,color:MUTED}}>{history.length} décision{history.length!==1?"s":""}</div>
      </div>
      {history.length===0?(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:4,color:"#2A2A2A",marginBottom:10}}>AUCUNE DÉCISION</div>
          <div style={{fontFamily:SANS,fontSize:12,color:MUTED}}>Tes décisions apparaîtront ici après analyse.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map((h,i)=>(
            <button key={h.id||i} onClick={()=>setSelected(h)} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",gap:12,alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
              <div style={{width:40,height:40,borderRadius:10,background:`${h.mod?.color||"#444"}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{h.mod?.icon||"◎"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <div style={{fontFamily:MONO,fontSize:12,fontWeight:700,color:VC[h.result?.verdict]||h.mod?.color||TEXT}}>{h.result?.verdict}</div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:4,background:`${SC[h.result?.signal]||"#888"}18`,borderRadius:6,padding:"2px 7px"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:SC[h.result?.signal]||"#888"}}/>
                    <div style={{fontFamily:MONO,fontSize:8,color:SC[h.result?.signal]||"#888",letterSpacing:1}}>{h.result?.signal}</div>
                  </div>
                </div>
                <div style={{fontFamily:SANS,fontSize:11,color:MUTED,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220}}>{h.form?.situation}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:MONO,fontSize:8,color:"#333"}}>{h.mod?.label}</div>
                <div style={{fontFamily:MONO,fontSize:8,color:"#2A2A2A",marginTop:2}}>{new Date(h.date).toLocaleDateString("fr-FR")}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFIL ───────────────────────────────────────────────────
function ProfileScreen({ history, unlocked, onPaywall }) {
  const total=history.length;
  const byMod={};
  ALL_MODULES.forEach(m=>byMod[m.id]=0);
  let pos=0,neg=0,neu=0;
  const posV=["RESTE","INVESTIS","LANCE","PUBLIE","ACCEPTE","GO","ACCEPTABLE","SAIN"];
  const negV=["QUITTE","REFUSE","STOP","DANGER","MANIPULATION DÉTECTÉE"];
  history.forEach(h=>{ if(byMod[h.mod?.id]!==undefined)byMod[h.mod.id]++; const v=h.result?.verdict||""; if(posV.some(p=>v.includes(p)))pos++; else if(negV.some(n=>v.includes(n)))neg++; else neu++; });
  const fav=Object.entries(byMod).sort((a,b)=>b[1]-a[1])[0];
  const favMod=ALL_MODULES.find(m=>m.id===fav?.[0]);
  const favCount=fav?.[1]||0;
  return(
    <div>
      <Lbl mb={18}>— Profil</Lbl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:9}}>
        {[{l:"DÉCISIONS",v:total,c:TEXT},{l:"POSITIVES",v:pos,c:"#30D158"},{l:"NÉGATIVES",v:neg,c:"#FF453A"}].map((s,i)=>(
          <Crd key={i} style={{textAlign:"center",padding:"16px 10px"}}>
            <div style={{fontFamily:SANS,fontSize:28,fontWeight:800,color:s.c,lineHeight:1,marginBottom:6}}>{s.v}</div>
            <div style={{fontFamily:MONO,fontSize:7,letterSpacing:2,color:MUTED}}>{s.l}</div>
          </Crd>
        ))}
      </div>
      {favMod&&favCount>0&&(
        <Crd style={{marginBottom:9}}>
          <Lbl>Module préféré</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:`${favMod.color}18`,border:`1px solid ${favMod.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{favMod.icon}</div>
            <div>
              <div style={{fontFamily:MONO,fontSize:13,fontWeight:700,letterSpacing:2,color:favMod.color}}>{favMod.label}</div>
              <div style={{fontFamily:MONO,fontSize:9,color:MUTED,marginTop:3}}>{favCount} décision{favCount>1?"s":""}</div>
            </div>
          </div>
        </Crd>
      )}
      <Crd style={{marginBottom:9}}>
        <Lbl>Répartition</Lbl>
        {BASE_MODULES.map(m=>{ const c=byMod[m.id]||0; const pct=total>0?Math.round((c/total)*100):0; return(
          <div key={m.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>{m.icon}</span><span style={{fontFamily:MONO,fontSize:9,letterSpacing:1,color:MUTED}}>{m.label}</span></div>
              <div style={{fontFamily:MONO,fontSize:9,color:MUTED}}>{c}</div>
            </div>
            <div style={{height:3,background:CARD2,borderRadius:2}}>
              <div style={{height:"100%",width:`${pct}%`,background:m.color,borderRadius:2,transition:"width .4s"}}/>
            </div>
          </div>
        );})}
      </Crd>
      <div style={{background:`linear-gradient(135deg,${CARD2},${CARD})`,border:`1px solid ${unlocked?"rgba(48,209,88,0.2)":BORDER}`,borderRadius:16,padding:"18px",textAlign:"center"}}>
        {unlocked?(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#30D158"}}/>
              <div style={{fontFamily:MONO,fontSize:10,color:"#30D158",letterSpacing:2}}>MEMBRE CLUB ACTIF</div>
            </div>
            <div style={{fontFamily:SANS,fontSize:11,color:MUTED}}>Décisions illimitées · Modes exclusifs · Formats avancés</div>
          </>
        ):(
          <>
            <Lbl mb={10}>Passe au Club</Lbl>
            <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:12,color:"#000",padding:"12px 22px",fontFamily:MONO,fontSize:9,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ 7 JOURS OFFERTS — 9€/MOIS</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("home");
  const [navTab,setNavTab]=useState("home");
  const [activeMod,setActiveMod]=useState(null);
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState(getHistory());
  const [unlocked,setUnlockedState]=useState(getUnlocked());
  const [count,setCount]=useState(getCount());
  const [showPaywall,setShowPaywall]=useState(false);
  const [sharedData,setSharedData]=useState(null);

  useEffect(()=>{
    const hash=window.location.hash;
    if(hash.startsWith("#s/")){
      const d=decShare(hash.slice(3));
      if(d){ setSharedData(d); setScreen("shared"); }
    }
  },[]);

  useEffect(()=>{ setCount(getCount()); setUnlockedState(getUnlocked()); setHistory(getHistory()); },[screen]);

  const handleUnlock=()=>{ setUnlockedState(true); setShowPaywall(false); };
  const handleSelect=(m)=>{ setActiveMod(m); setScreen("form"); setResult(null); };
  const handleResult=(r,form)=>{
    const entry={id:Date.now(),date:new Date().toISOString(),mod:{id:activeMod.id,label:activeMod.label,icon:activeMod.icon,color:activeMod.color},form,result:r};
    pushHistory(entry); setHistory(getHistory());
    setResult(r); setScreen("result");
  };
  const goHome=()=>{ setScreen("home"); setNavTab("home"); };
  const goNav=(t)=>{ setNavTab(t); setScreen(t); };
  const onBack=()=>{ if(screen==="result")setScreen("form"); else goHome(); };

  if(screen==="shared"&&sharedData) return <SharedView data={sharedData}/>;

  const isFormNav=["form","result","loading"].includes(screen);

  return(
    <div style={{background:BG,minHeight:"100vh",fontFamily:SANS,color:TEXT,paddingBottom:72}}>
      <style>{`*{box-sizing:border-box}button{transition:background .12s}input,textarea{color:#F0F0F6!important}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)!important}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2A2A2A}`}</style>

      {showPaywall&&<Paywall count={count} onClose={()=>setShowPaywall(false)} onUnlock={handleUnlock}/>}

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BORDER}`,padding:"0 18px"}}>
        <div style={{textAlign:"center",padding:"18px 0 12px"}}>
          <div style={{fontFamily:MONO,fontSize:28,fontWeight:900,color:"#FFFFFF",letterSpacing:-1,lineHeight:1}}>CUT/GO™</div>
          <div style={{fontFamily:MONO,fontSize:8,letterSpacing:6,color:"#2A2A2A",marginTop:4}}>DECISION ENGINE</div>
        </div>
        {isFormNav&&(
          <div style={{paddingBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:activeMod?.color||MUTED,fontFamily:MONO,fontSize:9,letterSpacing:2,cursor:"pointer",padding:0}}>← RETOUR</button>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:3,color:MUTED}}>{screen==="form"?activeMod?.label:"RÉSULTAT"}</div>
            <div style={{width:60}}/>
          </div>
        )}
      </div>

      {/* CONTENU */}
      <div style={{maxWidth:620,margin:"0 auto",padding:"18px 16px"}}>
        {screen==="home"&&<HomeScreen onSelect={handleSelect} unlocked={unlocked} onPaywall={()=>setShowPaywall(true)} count={count}/>}
        {screen==="form"&&activeMod&&<FormScreen mod={activeMod} onResult={handleResult} onPaywall={()=>setShowPaywall(true)} unlocked={unlocked} count={count}/>}
        {screen==="result"&&result&&activeMod&&<ResultScreen mod={activeMod} result={result} onHome={goHome} onNew={()=>setScreen("form")} unlocked={unlocked} onPaywall={()=>setShowPaywall(true)}/>}
        {screen==="history"&&<HistoryScreen history={history}/>}
        {screen==="profile"&&<ProfileScreen history={history} unlocked={unlocked} onPaywall={()=>setShowPaywall(true)}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:BG,borderTop:`1px solid ${BORDER}`,display:"flex"}}>
        {[{id:"home",label:"MODULES",icon:"◎"},{id:"history",label:"HISTORIQUE",icon:"◷"},{id:"profile",label:"PROFIL",icon:"◈"}].map(t=>{
          const active=t.id==="home"?["home","form","result"].includes(screen):screen===t.id;
          const ac=active?(activeMod?.color||"#C084FC"):"transparent";
          return(
            <button key={t.id} onClick={()=>t.id==="home"?goHome():goNav(t.id)} style={{flex:1,padding:"9px 0 11px",background:"transparent",border:"none",color:active?TEXT:MUTED,cursor:"pointer",fontFamily:MONO,fontSize:8,letterSpacing:3,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:22,height:2,borderRadius:1,background:ac,marginBottom:3,transition:"all .2s"}}/>
              <span style={{fontSize:16}}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
