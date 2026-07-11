import { useState, useEffect } from "react";

const GUMROAD_URL = "https://cutgo.gumroad.com/l/djcbif";
const FREE_DECISIONS = 3;
const VALID_CODE_PREFIX = "CUTGO-";

// ─── MODULES ──────────────────────────────────────────────────
const BASE_MODULES = [
  { id:"LOVE", label:"LOVE", icon:"♥", color:"#FF2D55", desc:"Relations & émotions", systemPrompt:`Tu es CUT/GO™ LOVE. Décision froide sur les relations. Analyse : respect, toxicité, dépendance, cohérence actes/paroles. Si urgence élevée : verdict sur respect + toxicité uniquement. Réponds UNIQUEMENT en JSON valide : {"verdict":"RESTE"|"QUITTE"|"PRENDS DU RECUL","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SAIN"|"INSTABLE"|"TOXIQUE"}` },
  { id:"MONEY", label:"MONEY", icon:"◈", color:"#FFD60A", desc:"Décisions financières", systemPrompt:`Tu es CUT/GO™ MONEY. Décision froide sur l'argent. Analyse : gain potentiel, perte possible, coût de l'inaction, retour rapide. Réponds UNIQUEMENT en JSON valide : {"verdict":"INVESTIS"|"REFUSE"|"ATTENDS","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"RENTABLE"|"RISQUÉ"|"MAUVAIS"}` },
  { id:"BUSINESS", label:"BUSINESS", icon:"⬡", color:"#0A84FF", desc:"Décisions entrepreneuriales", systemPrompt:`Tu es CUT/GO™ BUSINESS. Décision froide sur le business. Analyse : potentiel de gain, vitesse d'exécution, coût/bénéfice, perte si inaction. Réponds UNIQUEMENT en JSON valide : {"verdict":"LANCE"|"STOP"|"TEST","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SCALABLE"|"FAIBLE"|"À TESTER"}` },
  { id:"CREATOR", label:"CREATOR", icon:"▲", color:"#30D158", desc:"Création de contenu", systemPrompt:`Tu es CUT/GO™ CREATOR. Décision froide sur la création. Analyse : potentiel d'attention, clarté, différenciation, impact émotionnel. Réponds UNIQUEMENT en JSON valide : {"verdict":"PUBLIE"|"STOP"|"OPTIMISE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"VIRAL"|"MOYEN"|"INVISIBLE"}` },
  { id:"CAREER", label:"CAREER", icon:"◆", color:"#BF5AF2", desc:"Décisions professionnelles", systemPrompt:`Tu es CUT/GO™ CAREER. Décision froide sur la carrière. Analyse : évolution, compétences, sécurité, opportunité externe, alignement objectif. Réponds UNIQUEMENT en JSON valide : {"verdict":"ACCEPTE"|"REFUSE"|"PRÉPARE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"ÉVOLUTIF"|"STABLE"|"BLOQUÉ"}` },
];

const EXCLUSIVE_MODES = [
  { id:"URGENCE", label:"MODE URGENCE", icon:"⚡", color:"#FF2D55", desc:"Verdict en 10 secondes", systemPrompt:`Tu es CUT/GO™ MODE URGENCE. Décision ultra-rapide, pas de nuance. Réponds UNIQUEMENT en JSON valide : {"verdict":"GO"|"STOP","pourquoi":["r1"],"action":"string","risque":"string","consequence":"string","signal":"CRITIQUE"|"URGENT"|"STABLE"}` },
  { id:"HIGH_RISK", label:"MODE HIGH RISK", icon:"☠", color:"#FF6B35", desc:"Analyse des risques extrêmes", systemPrompt:`Tu es CUT/GO™ MODE HIGH RISK. Focus sur le pire scénario. Réponds UNIQUEMENT en JSON valide : {"verdict":"DANGER"|"RISQUE MODÉRÉ"|"ACCEPTABLE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"ATTENTION"|"OK"}` },
  { id:"MANIPULATION", label:"MODE MANIPULATION", icon:"◉", color:"#BF5AF2", desc:"Détecte si on te manipule", systemPrompt:`Tu es CUT/GO™ MODE MANIPULATION. Détecte gaslighting, love bombing, isolement, manipulation émotionnelle. Réponds UNIQUEMENT en JSON valide : {"verdict":"MANIPULATION DÉTECTÉE"|"SUSPECT"|"SAIN","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"SUSPECT"|"SAIN"}` },
];

// ─── SCÉNARIOS ────────────────────────────────────────────────
const SCENARIOS = {
  LOVE: [
    { label:"Ex toxique qui revient", situation:"Je reviens toujours vers mon ex. Je sais que c'est toxique mais je n'arrive pas à m'en empêcher.", optionA:"Lui redonner une chance", optionB:"Couper définitivement", urgence:"élevée", objectif:"Sortir de ce cycle une fois pour toutes", peur:"Le regret et la solitude" },
    { label:"Il/elle veut rien de sérieux", situation:"Il/elle m'appelle bébé la nuit, dort chez moi... mais en journée dit qu'il/elle veut rien de sérieux.", optionA:"Continuer en espérant qu'il/elle change", optionB:"Prendre de la distance", urgence:"élevée", objectif:"Ne pas m'attacher pour rien", peur:"La perdre" },
    { label:"Amoureux de mon meilleur ami", situation:"Je suis amoureux(se) de mon meilleur ami(e) depuis 2 ans. Je n'ai jamais rien dit. Je ne sais plus si je peux continuer à faire semblant.", optionA:"Lui avouer mes sentiments", optionB:"Garder le secret et préserver l'amitié", urgence:"moyenne", objectif:"Ne pas perdre cette personne mais ne plus souffrir", peur:"Briser une amitié de 10 ans" },
    { label:"Mon/ma partenaire m'a trompé(e)", situation:"Mon/ma partenaire m'a trompé(e) il y a 3 semaines. Il/elle dit que c'est fini et veut qu'on continue. Je suis partagé(e).", optionA:"Pardonner et recommencer", optionB:"Mettre fin à la relation", urgence:"moyenne", objectif:"Ne pas regretter ma décision dans 1 an", peur:"Partir et regretter, ou rester et souffrir encore" },
    { label:"Relation longue distance", situation:"Relation longue distance depuis 1 an. On se voit 1 fois tous les 2 mois. Les doutes s'accumulent des deux côtés.", optionA:"Continuer à distance", optionB:"Mettre fin à la relation", urgence:"faible", objectif:"Construire quelque chose de stable", peur:"Avoir tout sacrifié pour rien" },
    { label:"Retourner avec un ex après 1 an", situation:"Mon ex et moi sommes restés en contact. On se revoit depuis 2 mois. Je ressens encore des choses mais on s'est séparé pour de bonnes raisons.", optionA:"Tenter à nouveau la relation", optionB:"Couper le contact définitivement", urgence:"moyenne", objectif:"Éviter de revivre la même rupture", peur:"Passer à côté de quelque chose de vrai" },
  ],
  MONEY: [
    { label:"Quitter le CDI pour entreprendre", situation:"CDI stable mais sans évolution. Projet de business depuis 8 mois. J'hésite à sauter le pas.", optionA:"Rester en CDI et lancer en parallèle", optionB:"Démissionner et me lancer à 100%", urgence:"moyenne", objectif:"Ne plus regretter dans 5 ans", peur:"Tout perdre et devoir recommencer à zéro" },
    { label:"Investissement risqué", situation:"On me propose d'investir mes économies dans un projet avec un fort potentiel mais peu de garanties.", optionA:"Investir maintenant", optionB:"Attendre plus d'informations", urgence:"élevée", objectif:"Faire fructifier mon argent", peur:"Tout perdre" },
    { label:"Demander une augmentation", situation:"Pas d'augmentation depuis 2 ans malgré mes résultats. Mon employeur tarde à répondre.", optionA:"Demander une augmentation ferme", optionB:"Chercher ailleurs", urgence:"moyenne", objectif:"Être payé à ma juste valeur", peur:"Perdre mon poste actuel" },
    { label:"Acheter ou louer", situation:"J'ai assez pour un apport. Les prix sont hauts. Je me demande si c'est le bon moment d'acheter.", optionA:"Acheter maintenant", optionB:"Continuer à louer et attendre", urgence:"faible", objectif:"Construire un patrimoine sans me ruiner", peur:"Acheter au mauvais moment et perdre de la valeur" },
    { label:"Rembourser dettes ou investir", situation:"J'ai 10 000€ de dettes à 5% et 10 000€ d'économies. Je me demande quoi faire avec cet argent.", optionA:"Tout utiliser pour rembourser mes dettes", optionB:"Investir et rembourser progressivement", urgence:"faible", objectif:"Optimiser ma situation financière", peur:"Faire le mauvais choix et perdre des années" },
    { label:"Prêt de la famille", situation:"Ma famille veut me prêter 20 000€ pour financer mon projet. Pas d'intérêts mais la pression familiale sera réelle.", optionA:"Accepter le prêt familial", optionB:"Chercher un financement externe", urgence:"élevée", objectif:"Financer mon projet sans détruire mes relations", peur:"Créer des tensions familiales en cas d'échec" },
  ],
  BUSINESS: [
    { label:"Lancer sans validation", situation:"J'ai une idée de produit. Pas encore de client. Je veux lancer sans attendre.", optionA:"Lancer maintenant avec ce que j'ai", optionB:"Valider d'abord avec des clients potentiels", urgence:"élevée", objectif:"Générer mes premiers revenus rapidement", peur:"Lancer quelque chose que personne ne veut" },
    { label:"Associé problématique", situation:"Mon associé ne travaille plus autant que moi mais veut garder 50% des parts.", optionA:"Négocier une nouvelle répartition", optionB:"Se séparer et continuer seul", urgence:"élevée", objectif:"Préserver mon projet", peur:"Me retrouver seul" },
    { label:"Pivoter ou persévérer", situation:"Mon produit ne décolle pas après 6 mois. Je me demande si je dois pivoter ou insister.", optionA:"Pivoter vers une nouvelle direction", optionB:"Continuer sur la même trajectoire", urgence:"élevée", objectif:"Faire fonctionner ce business", peur:"Abandonner trop tôt ou persister trop longtemps" },
    { label:"Baisser mes prix", situation:"Mes concurrents sont moins chers. Je perds des clients. Je me demande si je dois m'aligner.", optionA:"Baisser mes prix pour être compétitif", optionB:"Maintenir mes prix et travailler ma valeur perçue", urgence:"élevée", objectif:"Gagner des clients sans détruire ma marge", peur:"Perdre encore plus de clients en ne changeant rien" },
    { label:"Faire appel à un investisseur", situation:"Un investisseur propose 50K€ pour 20% de mon business. J'en ai besoin pour accélérer mais je cède de la valeur.", optionA:"Accepter l'investissement", optionB:"Croître organiquement et rester seul maître", urgence:"moyenne", objectif:"Accélérer sans perdre le contrôle", peur:"Diluer mon capital et regretter" },
    { label:"Externaliser ou tout faire seul", situation:"Je suis débordé. Je peux externaliser certaines tâches mais ça coûte et je dois faire confiance à quelqu'un.", optionA:"Externaliser et me concentrer sur l'essentiel", optionB:"Tout faire moi-même pour contrôler la qualité", urgence:"moyenne", objectif:"Scaler sans m'épuiser", peur:"Perdre la qualité ou continuer à me noyer" },
  ],
  CREATOR: [
    { label:"Publier sans être prêt", situation:"Ma vidéo est prête à 80%. Je pourrais peaufiner encore mais le sujet est tendance maintenant.", optionA:"Publier maintenant", optionB:"Peaufiner encore 1 semaine", urgence:"élevée", objectif:"Profiter du momentum", peur:"Être jugé sur un contenu imparfait" },
    { label:"Changer de niche", situation:"Je crée du contenu dans une niche depuis 1 an avec peu de croissance. Une autre niche m'attire.", optionA:"Changer de niche", optionB:"Persévérer dans la niche actuelle", urgence:"faible", objectif:"Avoir une audience engagée", peur:"Perdre ce que j'ai déjà construit" },
    { label:"Collaboration douteuse", situation:"Une marque veut me payer pour un partenariat mais leurs valeurs ne correspondent pas aux miennes.", optionA:"Accepter le partenariat", optionB:"Refuser et attendre mieux", urgence:"élevée", objectif:"Monétiser sans compromettre mon image", peur:"Perdre l'opportunité financière" },
    { label:"Monétiser maintenant ou attendre", situation:"J'ai 5 000 abonnés. Je peux commencer à monétiser mais je ne sais pas si c'est trop tôt.", optionA:"Monétiser maintenant", optionB:"Attendre 20 000 abonnés pour monétiser", urgence:"faible", objectif:"Générer des revenus sans faire fuir mon audience", peur:"Paraître trop commercial trop tôt" },
    { label:"Court ou long format", situation:"Mon audience est mixte. Les shorts cartonnent en vues mais les longues vidéos créent plus d'engagement et de fidélité.", optionA:"Me concentrer sur le court format", optionB:"Continuer le long format malgré les moins de vues", urgence:"faible", objectif:"Construire une vraie communauté fidèle", peur:"Sacrifier la qualité pour l'algorithme" },
    { label:"Révéler mon identité ou rester anonyme", situation:"Je crée du contenu en anonyme depuis 6 mois. Je vois que révéler mon identité boosterait ma croissance mais j'ai peur.", optionA:"Révéler qui je suis", optionB:"Rester anonyme et préserver ma vie privée", urgence:"faible", objectif:"Grandir plus vite sans sacrifier ma tranquillité", peur:"Les conséquences professionnelles et personnelles" },
  ],
  CAREER: [
    { label:"Offre externe alléchante", situation:"CDI correct mais sans évolution. Offre externe avec 30% d'augmentation en startup risquée.", optionA:"Accepter l'offre externe", optionB:"Rester et négocier une promotion interne", urgence:"élevée", objectif:"Accélérer ma progression", peur:"Rejoindre une startup qui coule" },
    { label:"Reconversion professionnelle", situation:"10 ans dans mon domaine. Je veux me reconvertir mais cela implique de repartir de zéro.", optionA:"Me reconvertir maintenant", optionB:"Attendre d'être plus stable", urgence:"faible", objectif:"Travailler dans quelque chose qui a du sens", peur:"Regretter d'avoir attendu" },
    { label:"Conflit avec le manager", situation:"Conflit ouvert avec mon manager. L'ambiance est insupportable. On me propose de changer de service.", optionA:"Changer de service en interne", optionB:"Chercher un autre emploi", urgence:"élevée", objectif:"Travailler dans un environnement sain", peur:"Fuir sans résoudre le problème" },
    { label:"Devenir manager ou rester expert", situation:"On me propose un poste de manager. Plus de salaire mais plus de terrain. Je suis passionné par mon travail technique.", optionA:"Accepter le poste de manager", optionB:"Rester expert et demander une revalorisation", urgence:"moyenne", objectif:"Progresser sans perdre ce qui me passionne", peur:"Devenir manager et détester ça" },
    { label:"Partir travailler à l'étranger", situation:"Une offre à l'étranger pendant 2 ans. Salaire doublé, expérience internationale. Mais quitter ma vie ici.", optionA:"Partir à l'étranger", optionB:"Rester et chercher mieux localement", urgence:"élevée", objectif:"Accélérer ma carrière sans tout sacrifier", peur:"Partir et rater des opportunités ici, ou rester et regretter" },
    { label:"Créer une entreprise en gardant mon emploi", situation:"Je veux lancer un projet en parallèle de mon emploi. Mon contrat l'interdit partiellement. Le risque est réel.", optionA:"Lancer malgré la clause contractuelle", optionB:"Attendre de quitter mon emploi", urgence:"moyenne", objectif:"Avoir un plan B sans perdre ma sécurité", peur:"Me faire licencier ou rater le lancement" },
  ],
};

// ─── FORMATS ──────────────────────────────────────────────────
const FORMATS = [
  { id:"STANDARD", label:"STANDARD", color:"#F0F0F0" },
  { id:"BRUTAL", label:"BRUTAL", color:"#FF2D55" },
  { id:"RAPIDE", label:"RAPIDE", color:"#FFD60A" },
  { id:"STRATÉGIQUE", label:"STRATÉGIQUE", color:"#0A84FF" },
];
const FORMAT_PROMPTS = {
  BRUTAL: `Reformate ce verdict en MODE BRUTAL. Ton cash, sans pitié, 2 raisons max très courtes. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
  RAPIDE: `Reformate ce verdict en MODE RAPIDE. 1 raison courte, action en 5 mots max. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
  STRATÉGIQUE: `Reformate ce verdict en MODE STRATÉGIQUE. 3 raisons détaillées, perspective long terme. Réponds UNIQUEMENT en JSON valide avec les mêmes clés.`,
};

// ─── COULEURS ─────────────────────────────────────────────────
const SIGNAL_COLORS = {
  SAIN:"#30D158",INSTABLE:"#FFD60A",TOXIQUE:"#FF2D55",
  RENTABLE:"#30D158","RISQUÉ":"#FFD60A",MAUVAIS:"#FF2D55",
  SCALABLE:"#30D158",FAIBLE:"#FF2D55","À TESTER":"#FFD60A",
  VIRAL:"#30D158",MOYEN:"#FFD60A",INVISIBLE:"#FF2D55",
  "ÉVOLUTIF":"#30D158",STABLE:"#FFD60A","BLOQUÉ":"#FF2D55",
  CRITIQUE:"#FF2D55",URGENT:"#FFD60A",DANGER:"#FF2D55",
  ATTENTION:"#FFD60A",OK:"#30D158",SUSPECT:"#FFD60A",
};
const VERDICT_COLORS = {
  RESTE:"#30D158",QUITTE:"#FF2D55","PRENDS DU RECUL":"#FFD60A",
  INVESTIS:"#30D158",REFUSE:"#FF2D55",ATTENDS:"#FFD60A",
  LANCE:"#30D158",STOP:"#FF2D55",TEST:"#FFD60A",
  PUBLIE:"#30D158",OPTIMISE:"#FFD60A",
  ACCEPTE:"#30D158","PRÉPARE":"#FFD60A",
  GO:"#30D158",DANGER:"#FF2D55","RISQUE MODÉRÉ":"#FFD60A",ACCEPTABLE:"#30D158",
  "MANIPULATION DÉTECTÉE":"#FF2D55",SUSPECT:"#FFD60A",SAIN:"#30D158",
};

// ─── STORAGE ──────────────────────────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch(e) { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} },
};
const getCount = () => LS.get("cg_count", 0);
const addCount = () => LS.set("cg_count", getCount() + 1);
const isUnlocked = () => LS.get("cg_unlocked", false);
const setUnlockedLS = () => LS.set("cg_unlocked", true);
const getHistory = () => LS.get("cg_history", []);
const saveToHistory = (entry) => {
  const hist = getHistory();
  hist.unshift(entry);
  if (hist.length > 50) hist.pop();
  LS.set("cg_history", hist);
};

// ─── SHARE ────────────────────────────────────────────────────
// URL courte et encodage robuste
const encodeShare = (data) => {
  try {
    const json = JSON.stringify(data);
    const enc = encodeURIComponent(json);
    return btoa(enc).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  } catch(e) { return null; }
};
const decodeShare = (enc) => {
  try {
    const b64 = enc.replace(/-/g,"+").replace(/_/g,"/");
    const padded = b64 + "===".slice(0,(4-b64.length%4)%4);
    return JSON.parse(decodeURIComponent(atob(padded)));
  } catch(e) { return null; }
};
// N'encode que l'essentiel pour un lien court
const getShareURL = (mod, result) => {
  const data = {
    ml: mod.label, mc: mod.color, mi: mod.icon,
    v: result.verdict, s: result.signal,
    a: result.action, p: result.pourquoi?.[0] || "",
    d: new Date().toLocaleDateString("fr-FR")
  };
  const enc = encodeShare(data);
  if (!enc) return null;
  return window.location.href.split("#")[0] + "#s/" + enc;
};

// ─── STYLES ───────────────────────────────────────────────────
const inp = (c) => ({ width:"100%", background:"#0F0F0F", border:"1px solid #1E1E1E", borderBottom:`1px solid ${c}33`, color:"#F0F0F0", padding:"12px 14px", fontFamily:"'Courier New',monospace", fontSize:13, outline:"none", boxSizing:"border-box" });
const btn = (bg, fg, ex={}) => ({ background:bg, border:`1px solid ${bg==="transparent"?"#222":bg}`, color:fg, padding:"14px 0", cursor:"pointer", fontFamily:"'Courier New',monospace", fontWeight:700, letterSpacing:3, fontSize:11, ...ex });

// ─── APP ──────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [mod, setMod] = useState(null);
  const [form, setForm] = useState({ situation:"", optionA:"", optionB:"", optionC:"", urgence:"moyenne", objectif:"", peur:"" });
  const [result, setResult] = useState(null);
  const [originalResult, setOriginalResult] = useState(null);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [count, setCount] = useState(getCount());
  const [history, setHistory] = useState(getHistory());
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [showScenarios, setShowScenarios] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [activeFormat, setActiveFormat] = useState("STANDARD");
  const [formatLoading, setFormatLoading] = useState(false);
  const [sharedData, setSharedData] = useState(null);

  // Detect share URL on load — map compact keys to full format
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#s/")) {
      const compact = decodeShare(hash.slice(3));
      if (compact) {
        // Support both old full format and new compact format
        const data = compact.ml ? {
          modLabel: compact.ml, modColor: compact.mc, modIcon: compact.mi,
          date: compact.d,
          result: { verdict:compact.v, signal:compact.s, action:compact.a, pourquoi:[compact.p] }
        } : compact;
        setSharedData(data);
        setPage("shared");
      }
    }
  }, []);

  // Sync localStorage on every render
  useEffect(() => {
    setCount(getCount());
    setUnlocked(isUnlocked());
    setHistory(getHistory());
  }, [page]);

  const remaining = Math.max(0, FREE_DECISIONS - count);

  const navigate = (p) => { setPage(p); setSelectedEntry(null); setShowScenarios(false); setError(""); };

  const selectModule = (m) => {
    if (!unlocked && m.clubOnly) { setShowPaywall(true); return; }
    if (!unlocked && count >= FREE_DECISIONS) { setShowPaywall(true); return; }
    setMod(m); setPage("form");
    setForm({ situation:"", optionA:"", optionB:"", optionC:"", urgence:"moyenne", objectif:"", peur:"" });
    setResult(null); setOriginalResult(null); setError(""); setActiveFormat("STANDARD"); setShowScenarios(false);
  };

  const loadScenario = (s) => {
    setForm(f => ({ ...f, situation:s.situation, optionA:s.optionA, optionB:s.optionB, urgence:s.urgence, objectif:s.objectif, peur:s.peur }));
    setShowScenarios(false);
  };

  const callAPI = async (systemPrompt, userMsg) => {
    const res = await fetch("/api/decide", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ systemPrompt, userMsg })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const handleSubmit = async () => {
    if (!form.situation||!form.optionA||!form.optionB||!form.objectif||!form.peur) { setError("Remplis tous les champs."); return; }
    setError(""); setPage("loading");
    const userMsg = `SITUATION : ${form.situation}\nOPTION A : ${form.optionA}\nOPTION B : ${form.optionB}${form.optionC?`\nOPTION C : ${form.optionC}`:""}\nURGENCE : ${form.urgence}\nOBJECTIF : ${form.objectif}\nPEUR PRINCIPALE : ${form.peur}`;
    try {
      const data = await callAPI(mod.systemPrompt, userMsg);
      addCount();
      const entry = { id:Date.now(), date:new Date().toISOString(), mod:{id:mod.id,label:mod.label,color:mod.color,icon:mod.icon}, form:{...form}, result:data };
      saveToHistory(entry);
      setCount(getCount());
      setHistory(getHistory());
      setResult(data); setOriginalResult(data); setPage("result"); setActiveFormat("STANDARD");
    } catch(e) { setError("Erreur. Réessaie."); setPage("form"); }
  };

  const handleFormat = async (formatId) => {
    if (!unlocked && formatId !== "STANDARD") { setShowPaywall(true); return; }
    if (formatId === "STANDARD") { setResult(originalResult); setActiveFormat("STANDARD"); return; }
    setFormatLoading(true); setActiveFormat(formatId);
    try {
      const userMsg = `Voici le verdict: ${JSON.stringify(originalResult)}\n\n${FORMAT_PROMPTS[formatId]}`;
      const data = await callAPI("Tu reformates des verdicts CUT/GO™. Réponds UNIQUEMENT en JSON valide.", userMsg);
      setResult(data);
    } catch(e) {}
    setFormatLoading(false);
  };

  const handleCode = () => {
    const code = codeInput.trim().toUpperCase();
    if (code.startsWith(VALID_CODE_PREFIX) && code.length >= 10) {
      setUnlockedLS(); setUnlocked(true); setShowPaywall(false); setCodeError("");
    } else { setCodeError("Code invalide. Vérifie ton email Gumroad."); }
  };

  const openShare = () => {
    if (!result||!mod) return;
    const url = getShareURL(mod, result);
    setShareURL(url || "");
    setShareCopied(false);
    setShowShareModal(true);
  };

  const copyShare = () => {
    const text = shareURL || `CUT/GO™ ${mod?.label}\n\nVERDICT : ${result?.verdict}\nSIGNAL : ${result?.signal}\nACTION : ${result?.action}\n\ncutgo.org`;
    navigator.clipboard.writeText(text).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
  };

  const goHome = () => navigate("home");

  const getStats = () => {
    const h = history;
    const total = h.length;
    const byModule = {};
    BASE_MODULES.forEach(m => byModule[m.id] = 0);
    EXCLUSIVE_MODES.forEach(m => byModule[m.id] = 0);
    let pos=0, neg=0, neu=0;
    const posV = ["RESTE","INVESTIS","LANCE","PUBLIE","ACCEPTE","GO","ACCEPTABLE","SAIN"];
    const negV = ["QUITTE","REFUSE","STOP","DANGER","MANIPULATION DÉTECTÉE"];
    h.forEach(e => {
      if (byModule[e.mod?.id] !== undefined) byModule[e.mod.id]++;
      const v = e.result?.verdict||"";
      if (posV.some(p => v.includes(p))) pos++;
      else if (negV.some(n => v.includes(n))) neg++;
      else neu++;
    });
    const fav = Object.entries(byModule).sort((a,b) => b[1]-a[1])[0];
    const favMod = [...BASE_MODULES,...EXCLUSIVE_MODES].find(m => m.id === fav?.[0]);
    return { total, byModule, pos, neg, neu, favMod, favCount:fav?.[1]||0 };
  };

  const stats = page === "profile" ? getStats() : null;

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", fontFamily:"'Courier New',monospace", color:"#F0F0F0", paddingBottom: page !== "shared" ? 70 : 0 }}>
      <style>{`*{box-sizing:border-box}textarea{resize:none}@keyframes pulse{0%,100%{opacity:.2;transform:scaleY(1)}50%{opacity:1;transform:scaleY(2.5)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn .3s ease forwards}button:hover{opacity:.85!important}input::placeholder,textarea::placeholder{color:#333}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333}`}</style>

      {/* ── PAYWALL ── */}
      {showPaywall && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div className="fade" style={{ maxWidth:440,width:"100%",border:"1px solid #222",padding:"36px 28px",background:"#0D0D0D" }}>
            <div style={{ fontSize:10,letterSpacing:5,color:"#555",marginBottom:14 }}>ACCÈS LIMITÉ</div>
            <div style={{ fontSize:24,fontWeight:900,letterSpacing:-1,marginBottom:8 }}>
              {!unlocked&&count>=FREE_DECISIONS?`Tu as utilisé tes ${FREE_DECISIONS} décisions gratuites.`:"Mode exclusif Club."}
            </div>
            <div style={{ fontSize:13,color:"#666",marginBottom:22,lineHeight:1.6 }}>7 jours offerts. Ensuite 9€/mois.</div>
            <div style={{ border:"1px solid #1A1A1A",padding:"14px 18px",marginBottom:20 }}>
              {["Décisions illimitées","Historique complet de toutes tes décisions","3 modes exclusifs : URGENCE, HIGH RISK, MANIPULATION","Formats BRUTAL / RAPIDE / STRATÉGIQUE","6 scénarios par module"].map((f,i) => (
                <div key={i} style={{ fontSize:12,color:"#888",marginBottom:5,display:"flex",gap:10 }}><span style={{ color:"#30D158" }}>✓</span>{f}</div>
              ))}
            </div>
            <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{ display:"block",textDecoration:"none" }}>
              <button style={{ ...btn("#F0F0F0","#000"),width:"100%",padding:"18px 0",fontSize:13 }}>⚡ COMMENCER — 7 JOURS OFFERTS</button>
            </a>
            <div style={{ textAlign:"center",margin:"18px 0 14px",fontSize:11,color:"#333",letterSpacing:2 }}>— OU —</div>
            <div style={{ fontSize:10,letterSpacing:3,color:"#555",marginBottom:8 }}>J'AI DÉJÀ UN CODE D'ACCÈS</div>
            <div style={{ display:"flex",gap:8 }}>
              <input value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="CUTGO-XXXXXX" style={{ ...inp("#F0F0F0"),flex:1 }} onKeyDown={e=>e.key==="Enter"&&handleCode()} />
              <button onClick={handleCode} style={{ ...btn("#222","#F0F0F0"),padding:"0 20px",border:"1px solid #333" }}>OK</button>
            </div>
            {codeError && <div style={{ color:"#FF2D55",fontSize:11,marginTop:8 }}>{codeError}</div>}
            <button onClick={()=>setShowPaywall(false)} style={{ background:"none",border:"none",color:"#333",fontSize:11,cursor:"pointer",marginTop:18,fontFamily:"inherit",display:"block",width:"100%",textAlign:"center" }}>Retour</button>
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ── */}
      {showShareModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div className="fade" style={{ maxWidth:440,width:"100%",border:"1px solid #222",padding:"32px 24px",background:"#0D0D0D" }}>
            <div style={{ fontSize:10,letterSpacing:5,color:"#555",marginBottom:14 }}>PARTAGER CE VERDICT</div>
            <div style={{ border:"1px solid #1A1A1A",padding:"16px",marginBottom:14,background:"#0A0A0A" }}>
              <div style={{ fontSize:9,color:"#444",marginBottom:8,letterSpacing:3 }}>APERÇU</div>
              <div style={{ fontSize:22,fontWeight:900,color:VERDICT_COLORS[result?.verdict]||"#F0F0F0",marginBottom:6 }}>{result?.verdict}</div>
              <div style={{ display:"inline-block",background:SIGNAL_COLORS[result?.signal]||"#555",color:"#000",fontSize:8,padding:"4px 9px",fontWeight:900,marginBottom:8 }}>{result?.signal}</div>
              <div style={{ fontSize:12,color:"#666",lineHeight:1.5 }}>{result?.action}</div>
            </div>
            <button onClick={copyShare} style={{ ...btn("#F0F0F0","#000"),width:"100%",padding:"16px 0",marginBottom:12 }}>{shareCopied?"✓ LIEN COPIÉ":"COPIER LE LIEN"}</button>
            <div style={{ fontSize:11,color:"#333",textAlign:"center",marginBottom:14 }}>Ton ami verra le verdict et pourra tester l'appli</div>
            <button onClick={()=>setShowShareModal(false)} style={{ background:"none",border:"none",color:"#333",fontSize:11,cursor:"pointer",fontFamily:"inherit",display:"block",width:"100%",textAlign:"center" }}>Fermer</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth:640,margin:"0 auto",padding:"28px 16px" }}>

        {/* ── HEADER ── */}
        {["home","history","profile"].includes(page) && (
          <div style={{ textAlign:"center",marginBottom:28 }}>
            <div style={{ fontSize:11,letterSpacing:6,color:"#333",marginBottom:5 }}>DECISION ENGINE</div>
            <div style={{ fontSize:40,fontWeight:900,letterSpacing:-2,lineHeight:1 }}>CUT/GO™</div>
            <div style={{ width:32,height:2,background:"#222",margin:"10px auto 0" }} />
            {page==="home" && !unlocked && <div style={{ marginTop:10,fontSize:11,letterSpacing:2,color:"#444" }}>{remaining>0?`${remaining} décision${remaining>1?"s":""} gratuite${remaining>1?"s":""}` : "Essai terminé"}</div>}
            {page==="home" && unlocked && <div style={{ marginTop:10,fontSize:9,letterSpacing:3,color:"#30D158" }}>✓ CLUB — ACCÈS COMPLET</div>}
          </div>
        )}

        {/* ── PAGE SHARED ── */}
        {page==="shared" && sharedData && (
          <div className="fade">
            <div style={{ textAlign:"center",marginBottom:22 }}>
              <div style={{ fontSize:10,letterSpacing:6,color:"#333",marginBottom:5 }}>DECISION ENGINE</div>
              <div style={{ fontSize:34,fontWeight:900,letterSpacing:-2,lineHeight:1 }}>CUT/GO™</div>
              <div style={{ marginTop:8,fontSize:10,color:"#444",letterSpacing:2 }}>Verdict partagé · {sharedData.date}</div>
            </div>
            <div style={{ textAlign:"center",marginBottom:16 }}>
              <span style={{ fontSize:18,color:sharedData.modColor }}>{sharedData.modIcon}</span>{" "}
              <span style={{ fontWeight:700,letterSpacing:2,color:sharedData.modColor }}>{sharedData.modLabel}</span>
            </div>
            <div style={{ border:`1px solid ${VERDICT_COLORS[sharedData.result.verdict]||"#444"}22`,background:`${VERDICT_COLORS[sharedData.result.verdict]||"#444"}08`,padding:"22px",marginBottom:8,position:"relative" }}>
              <div style={{ fontSize:9,letterSpacing:4,color:"#444",marginBottom:8 }}>VERDICT</div>
              <div style={{ fontSize:42,fontWeight:900,color:VERDICT_COLORS[sharedData.result.verdict]||"#F0F0F0",lineHeight:1 }}>{sharedData.result.verdict}</div>
              <div style={{ position:"absolute",top:16,right:16,background:SIGNAL_COLORS[sharedData.result.signal]||"#555",color:"#000",fontSize:8,letterSpacing:3,padding:"5px 9px",fontWeight:900 }}>{sharedData.result.signal}</div>
            </div>
            <div style={{ border:"1px solid #151515",padding:"16px 20px",marginBottom:8 }}>
              <div style={{ fontSize:9,letterSpacing:4,color:"#444",marginBottom:10 }}>POURQUOI</div>
              {sharedData.result.pourquoi.map((r,i) => <div key={i} style={{ fontSize:12,color:"#BBBBBB",marginBottom:7,paddingLeft:12,borderLeft:"2px solid #1E1E1E",lineHeight:1.5 }}>{r}</div>)}
            </div>
            <div style={{ background:`${sharedData.modColor}0D`,border:`1px solid ${sharedData.modColor}22`,padding:"16px 20px",marginBottom:20 }}>
              <div style={{ fontSize:9,letterSpacing:4,color:sharedData.modColor,marginBottom:7 }}>ACTION IMMÉDIATE</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#F0F0F0",lineHeight:1.5 }}>{sharedData.result.action}</div>
            </div>
            <div style={{ border:"1px solid #222",padding:"20px",textAlign:"center",background:"#0D0D0D" }}>
              <div style={{ fontSize:12,color:"#666",marginBottom:14,lineHeight:1.6 }}>Tu veux connaître ton verdict ?<br/>3 décisions gratuites sur CUT/GO™.</div>
              <a href={window.location.href.split("#")[0]} style={{ textDecoration:"none" }}>
                <button style={{ ...btn("#F0F0F0","#000"),padding:"12px 28px",fontSize:11 }}>⚡ ESSAYER GRATUITEMENT</button>
              </a>
            </div>
          </div>
        )}

        {/* ── PAGE HOME ── */}
        {page==="home" && (
          <div className="fade">
            <div style={{ fontSize:10,letterSpacing:4,color:"#333",marginBottom:10 }}>— MODULES</div>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:24 }}>
              {BASE_MODULES.map(m => (
                <button key={m.id} onClick={()=>selectModule(m)} style={{ background:"transparent",border:"1px solid #1A1A1A",borderLeft:`3px solid ${m.color}`,color:"#F0F0F0",padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,fontFamily:"inherit" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#111"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:16,color:m.color,width:22,textAlign:"center" }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:700,letterSpacing:2 }}>{m.label}</div>
                    <div style={{ fontSize:10,color:"#444",marginTop:2 }}>{m.desc}</div>
                  </div>
                  <span style={{ fontSize:9,color:"#333",letterSpacing:1 }}>{SCENARIOS[m.id]?.length} scénarios</span>
                  <span style={{ color:"#2A2A2A",marginLeft:6 }}>→</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize:10,letterSpacing:4,color:"#333",marginBottom:10 }}>— MODES EXCLUSIFS CLUB</div>
            <div style={{ display:"flex",flexDirection:"column",gap:7,marginBottom:22 }}>
              {EXCLUSIVE_MODES.map(m => (
                <button key={m.id} onClick={()=>selectModule({...m,clubOnly:true})} style={{ background:"transparent",border:"1px solid #1A1A1A",borderLeft:`3px solid ${unlocked?m.color:"#2A2A2A"}`,color:unlocked?"#F0F0F0":"#444",padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,fontFamily:"inherit",opacity:unlocked?1:0.6 }}
                  onMouseEnter={e=>e.currentTarget.style.background="#111"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:16,color:unlocked?m.color:"#333",width:22,textAlign:"center" }}>{unlocked?m.icon:"🔒"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:700,letterSpacing:2 }}>{m.label}</div>
                    <div style={{ fontSize:10,color:"#444",marginTop:2 }}>{m.desc}</div>
                  </div>
                  {!unlocked&&<span style={{ fontSize:9,color:"#333",letterSpacing:2 }}>CLUB</span>}
                  {unlocked&&<span style={{ color:"#2A2A2A" }}>→</span>}
                </button>
              ))}
            </div>
            {!unlocked && (
              <div style={{ border:"1px solid #151515",padding:"16px",textAlign:"center" }}>
                <div style={{ fontSize:11,color:"#444",marginBottom:10 }}>Modes exclusifs + illimité + historique complet</div>
                <button onClick={()=>setShowPaywall(true)} style={{ ...btn("#F0F0F0","#000"),padding:"10px 24px",fontSize:10 }}>⚡ 7 JOURS OFFERTS — 9€/MOIS</button>
              </div>
            )}
          </div>
        )}

        {/* ── PAGE FORM ── */}
        {page==="form" && mod && (
          <div className="fade">
            <button onClick={goHome} style={{ background:"none",border:"none",color:"#333",fontSize:10,cursor:"pointer",letterSpacing:2,marginBottom:20,fontFamily:"inherit",padding:0 }}>← RETOUR</button>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:16,borderBottom:"1px solid #151515" }}>
              <span style={{ fontSize:18,color:mod.color }}>{mod.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:700,letterSpacing:2,color:mod.color }}>{mod.label}</div>
                <div style={{ fontSize:10,color:"#444" }}>{mod.desc}</div>
              </div>
              {SCENARIOS[mod.id] && (
                <button onClick={()=>setShowScenarios(!showScenarios)} style={{ background:"transparent",border:"1px solid #222",color:"#555",padding:"7px 12px",fontSize:9,letterSpacing:2,cursor:"pointer",fontFamily:"inherit" }}>
                  {showScenarios?"FERMER":`${SCENARIOS[mod.id].length} SCÉNARIOS`}
                </button>
              )}
            </div>
            {showScenarios && SCENARIOS[mod.id] && (
              <div style={{ border:"1px solid #1A1A1A",marginBottom:16,background:"#0D0D0D" }}>
                <div style={{ fontSize:9,letterSpacing:3,color:"#444",padding:"10px 14px",borderBottom:"1px solid #151515" }}>CHARGER UN SCÉNARIO</div>
                {SCENARIOS[mod.id].map((s,i) => (
                  <button key={i} onClick={()=>loadScenario(s)} style={{ width:"100%",background:"transparent",border:"none",borderBottom:"1px solid #151515",color:"#888",padding:"10px 14px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",fontSize:11,display:"flex",alignItems:"center",gap:8 }}
                    onMouseEnter={e=>e.currentTarget.style.background="#111"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ color:mod.color }}>→</span>{s.label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
              {[
                { key:"situation",label:"SITUATION",ph:"Décris en 1 à 3 phrases...",multi:true },
                { key:"optionA",label:"OPTION A",ph:"Choix principal" },
                { key:"optionB",label:"OPTION B",ph:"Alternative" },
                { key:"optionC",label:"OPTION C — optionnel",ph:"Troisième option si besoin" },
                { key:"objectif",label:"OBJECTIF",ph:"Ce que tu veux vraiment" },
                { key:"peur",label:"PEUR PRINCIPALE",ph:"Ce qui te bloque" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:9,letterSpacing:4,color:"#555",display:"block",marginBottom:7 }}>{f.label}</label>
                  {f.multi
                    ? <textarea value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} rows={3} style={inp(mod.color)} />
                    : <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inp(mod.color)} />
                  }
                </div>
              ))}
              <div>
                <label style={{ fontSize:9,letterSpacing:4,color:"#555",display:"block",marginBottom:7 }}>URGENCE</label>
                <div style={{ display:"flex",gap:7 }}>
                  {["faible","moyenne","élevée"].map(u => (
                    <button key={u} onClick={()=>setForm(p=>({...p,urgence:u}))} style={{ flex:1,padding:"9px 0",background:form.urgence===u?mod.color:"transparent",border:`1px solid ${form.urgence===u?mod.color:"#222"}`,color:form.urgence===u?"#000":"#444",fontSize:9,letterSpacing:2,cursor:"pointer",fontFamily:"inherit",fontWeight:form.urgence===u?700:400,textTransform:"uppercase" }}>{u}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div style={{ color:"#FF2D55",fontSize:11,marginTop:12 }}>{error}</div>}
            <button onClick={handleSubmit} style={{ ...btn(mod.color,"#000"),width:"100%",marginTop:20,padding:"16px 0",fontSize:12 }}>ANALYSER →</button>
          </div>
        )}

        {/* ── PAGE LOADING ── */}
        {page==="loading" && (
          <div style={{ textAlign:"center",padding:"70px 0" }}>
            <div style={{ fontSize:10,letterSpacing:6,color:"#2A2A2A",marginBottom:24 }}>ANALYSE EN COURS</div>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:5,height:5,background:mod?.color||"#F0F0F0",animation:`pulse 1.2s ${i*.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {/* ── PAGE RESULT ── */}
        {page==="result" && result && mod && (
          <div className="fade">
            <button onClick={()=>setPage("form")} style={{ background:"none",border:"none",color:"#333",fontSize:10,cursor:"pointer",letterSpacing:2,marginBottom:18,fontFamily:"inherit",padding:0 }}>← MODIFIER</button>
            <div style={{ display:"flex",gap:5,marginBottom:14 }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={()=>handleFormat(f.id)} style={{ flex:1,padding:"7px 0",background:activeFormat===f.id?f.color:"transparent",border:`1px solid ${activeFormat===f.id?f.color:"#222"}`,color:activeFormat===f.id?"#000":"#444",fontSize:8,letterSpacing:1,cursor:"pointer",fontFamily:"inherit",fontWeight:activeFormat===f.id?700:400,opacity:(!unlocked&&f.id!=="STANDARD")?0.4:1 }}>
                  {f.label}
                  {!unlocked&&f.id!=="STANDARD"&&<span style={{ fontSize:7,display:"block",color:"#555" }}>CLUB</span>}
                </button>
              ))}
            </div>
            {formatLoading ? (
              <div style={{ textAlign:"center",padding:"24px 0",fontSize:9,letterSpacing:4,color:"#333" }}>REFORMATAGE...</div>
            ) : (
              <>
                <div style={{ border:`1px solid ${VERDICT_COLORS[result.verdict]||mod.color}22`,background:`${VERDICT_COLORS[result.verdict]||mod.color}08`,padding:"22px 20px",marginBottom:8,position:"relative" }}>
                  <div style={{ fontSize:9,letterSpacing:4,color:"#444",marginBottom:8 }}>VERDICT</div>
                  <div style={{ fontSize:44,fontWeight:900,letterSpacing:-2,color:VERDICT_COLORS[result.verdict]||mod.color,lineHeight:1 }}>{result.verdict}</div>
                  <div style={{ position:"absolute",top:16,right:16,background:SIGNAL_COLORS[result.signal]||"#555",color:"#000",fontSize:8,letterSpacing:3,padding:"5px 9px",fontWeight:900 }}>{result.signal}</div>
                </div>
                <div style={{ border:"1px solid #151515",padding:"16px 20px",marginBottom:7 }}>
                  <div style={{ fontSize:9,letterSpacing:4,color:"#444",marginBottom:10 }}>POURQUOI</div>
                  {result.pourquoi.map((r,i) => <div key={i} style={{ fontSize:12,color:"#BBBBBB",marginBottom:7,paddingLeft:12,borderLeft:"2px solid #1E1E1E",lineHeight:1.5 }}>{r}</div>)}
                </div>
                <div style={{ background:`${mod.color}0D`,border:`1px solid ${mod.color}22`,padding:"16px 20px",marginBottom:7 }}>
                  <div style={{ fontSize:9,letterSpacing:4,color:mod.color,marginBottom:7 }}>ACTION IMMÉDIATE</div>
                  <div style={{ fontSize:13,fontWeight:700,color:"#F0F0F0",lineHeight:1.5 }}>{result.action}</div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:16 }}>
                  <div style={{ border:"1px solid #151515",padding:"12px 14px" }}>
                    <div style={{ fontSize:8,letterSpacing:2,color:"#444",marginBottom:6 }}>RISQUE SI INACTION</div>
                    <div style={{ fontSize:11,color:"#666",lineHeight:1.5 }}>{result.risque}</div>
                  </div>
                  <div style={{ border:"1px solid #151515",padding:"12px 14px" }}>
                    <div style={{ fontSize:8,letterSpacing:2,color:"#444",marginBottom:6 }}>SI TU TE TROMPES</div>
                    <div style={{ fontSize:11,color:"#666",lineHeight:1.5 }}>{result.consequence}</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:7,marginBottom:7 }}>
                  <button onClick={openShare} style={{ flex:1,...btn("transparent","#666"),border:"1px solid #1A1A1A" }}>PARTAGER</button>
                  <button onClick={()=>selectModule(mod)} style={{ flex:1,...btn("transparent","#666"),border:"1px solid #1A1A1A" }}>NOUVELLE</button>
                  <button onClick={goHome} style={{ flex:1,...btn(mod.color,"#000") }}>MODULES</button>
                </div>
                {!unlocked && count >= FREE_DECISIONS - 1 && (
                  <div style={{ border:"1px solid #1A1A1A",padding:"12px 14px",textAlign:"center" }}>
                    <div style={{ fontSize:11,color:"#555",marginBottom:7 }}>{count>=FREE_DECISIONS?"C'était ta dernière décision gratuite.":"Plus qu'une décision gratuite."}</div>
                    <button onClick={()=>setShowPaywall(true)} style={{ ...btn("#F0F0F0","#000"),padding:"9px 18px",fontSize:9 }}>⚡ CONTINUER — 7 JOURS OFFERTS</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PAGE HISTORY ── */}
        {page==="history" && !selectedEntry && (
          <div className="fade">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18 }}>
              <div style={{ fontSize:10,letterSpacing:4,color:"#555" }}>HISTORIQUE</div>
              <div style={{ fontSize:11,color:"#444" }}>{history.length} décision{history.length!==1?"s":""}</div>
            </div>
            {history.length===0 ? (
              <div style={{ textAlign:"center",padding:"50px 0" }}>
                <div style={{ fontSize:10,color:"#333",letterSpacing:2,marginBottom:10 }}>AUCUNE DÉCISION</div>
                <div style={{ fontSize:11,color:"#444",marginBottom:16 }}>Tes décisions apparaîtront ici après analyse.</div>
                <button onClick={goHome} style={{ ...btn("transparent","#666"),border:"1px solid #222",padding:"9px 18px",fontSize:9 }}>FAIRE UNE DÉCISION</button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                {history.map((h,i) => (
                  <button key={h.id||i} onClick={()=>setSelectedEntry(h)} style={{ background:"transparent",border:"1px solid #1A1A1A",borderLeft:`3px solid ${h.mod?.color||"#444"}`,padding:"12px 14px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10 }}
                    onMouseEnter={e=>e.currentTarget.style.background="#111"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:14,color:h.mod?.color||"#444" }}>{h.mod?.icon||"◎"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:3 }}>
                        <span style={{ fontSize:11,fontWeight:700,color:VERDICT_COLORS[h.result?.verdict]||"#F0F0F0" }}>{h.result?.verdict}</span>
                        <span style={{ fontSize:8,background:SIGNAL_COLORS[h.result?.signal]||"#555",color:"#000",padding:"2px 6px",fontWeight:700 }}>{h.result?.signal}</span>
                      </div>
                      <div style={{ fontSize:9,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:260 }}>{h.form?.situation}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:8,color:"#333" }}>{h.mod?.label}</div>
                      <div style={{ fontSize:8,color:"#2A2A2A",marginTop:2 }}>{new Date(h.date).toLocaleDateString("fr-FR")}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PAGE HISTORY DETAIL ── */}
        {page==="history" && selectedEntry && (
          <div className="fade">
            <button onClick={()=>setSelectedEntry(null)} style={{ background:"none",border:"none",color:"#333",fontSize:10,cursor:"pointer",letterSpacing:2,marginBottom:18,fontFamily:"inherit",padding:0 }}>← HISTORIQUE</button>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #151515" }}>
              <span style={{ fontSize:14,color:selectedEntry.mod?.color }}>{selectedEntry.mod?.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,fontWeight:700,letterSpacing:2,color:selectedEntry.mod?.color }}>{selectedEntry.mod?.label}</div>
                <div style={{ fontSize:9,color:"#444" }}>{new Date(selectedEntry.date).toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
              </div>
            </div>
            <div style={{ border:"1px solid #151515",padding:"11px 14px",marginBottom:8,background:"#0D0D0D" }}>
              <div style={{ fontSize:8,letterSpacing:3,color:"#444",marginBottom:7 }}>SITUATION</div>
              <div style={{ fontSize:11,color:"#888",lineHeight:1.5 }}>{selectedEntry.form?.situation}</div>
              {selectedEntry.form?.optionA && <div style={{ fontSize:10,color:"#555",marginTop:7 }}>A: {selectedEntry.form.optionA}</div>}
              {selectedEntry.form?.optionB && <div style={{ fontSize:10,color:"#555",marginTop:3 }}>B: {selectedEntry.form.optionB}</div>}
              {selectedEntry.form?.optionC && <div style={{ fontSize:10,color:"#555",marginTop:3 }}>C: {selectedEntry.form.optionC}</div>}
            </div>
            <div style={{ border:`1px solid ${VERDICT_COLORS[selectedEntry.result?.verdict]||"#444"}22`,background:`${VERDICT_COLORS[selectedEntry.result?.verdict]||"#444"}08`,padding:"18px 16px",marginBottom:7,position:"relative" }}>
              <div style={{ fontSize:8,letterSpacing:4,color:"#444",marginBottom:7 }}>VERDICT</div>
              <div style={{ fontSize:32,fontWeight:900,color:VERDICT_COLORS[selectedEntry.result?.verdict]||"#F0F0F0",lineHeight:1 }}>{selectedEntry.result?.verdict}</div>
              <div style={{ position:"absolute",top:12,right:12,background:SIGNAL_COLORS[selectedEntry.result?.signal]||"#555",color:"#000",fontSize:7,letterSpacing:2,padding:"4px 7px",fontWeight:900 }}>{selectedEntry.result?.signal}</div>
            </div>
            <div style={{ background:`${selectedEntry.mod?.color}0D`,border:`1px solid ${selectedEntry.mod?.color}22`,padding:"13px 16px",marginBottom:7 }}>
              <div style={{ fontSize:8,letterSpacing:4,color:selectedEntry.mod?.color,marginBottom:6 }}>ACTION</div>
              <div style={{ fontSize:11,fontWeight:700,color:"#F0F0F0",lineHeight:1.5 }}>{selectedEntry.result?.action}</div>
            </div>
            <div style={{ border:"1px solid #151515",padding:"12px 14px" }}>
              <div style={{ fontSize:8,letterSpacing:3,color:"#444",marginBottom:8 }}>POURQUOI</div>
              {selectedEntry.result?.pourquoi?.map((r,i) => <div key={i} style={{ fontSize:11,color:"#666",marginBottom:6,paddingLeft:10,borderLeft:"2px solid #1E1E1E",lineHeight:1.5 }}>{r}</div>)}
            </div>
          </div>
        )}

        {/* ── PAGE PROFILE ── */}
        {page==="profile" && stats && (
          <div className="fade">
            <div style={{ fontSize:10,letterSpacing:4,color:"#555",marginBottom:18 }}>PROFIL</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20 }}>
              {[{l:"DÉCISIONS",v:stats.total},{l:"POSITIVES",v:stats.pos,c:"#30D158"},{l:"NÉGATIVES",v:stats.neg,c:"#FF2D55"}].map((s,i) => (
                <div key={i} style={{ border:"1px solid #1A1A1A",padding:"14px 10px",textAlign:"center" }}>
                  <div style={{ fontSize:24,fontWeight:900,color:s.c||"#F0F0F0" }}>{s.v}</div>
                  <div style={{ fontSize:7,letterSpacing:2,color:"#444",marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {stats.favMod && stats.favCount > 0 && (
              <div style={{ border:"1px solid #1A1A1A",padding:"14px",marginBottom:18,display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:20,color:stats.favMod.color }}>{stats.favMod.icon}</span>
                <div>
                  <div style={{ fontSize:8,letterSpacing:3,color:"#444",marginBottom:3 }}>MODULE PRÉFÉRÉ</div>
                  <div style={{ fontSize:12,fontWeight:700,color:stats.favMod.color }}>{stats.favMod.label}</div>
                  <div style={{ fontSize:9,color:"#555" }}>{stats.favCount} décision{stats.favCount>1?"s":""}</div>
                </div>
              </div>
            )}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:8,letterSpacing:3,color:"#444",marginBottom:10 }}>RÉPARTITION</div>
              {BASE_MODULES.map(m => {
                const c = stats.byModule[m.id]||0;
                const pct = stats.total>0 ? Math.round((c/stats.total)*100) : 0;
                return (
                  <div key={m.id} style={{ marginBottom:9 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                      <div style={{ fontSize:9,color:"#666",display:"flex",alignItems:"center",gap:5 }}><span style={{ color:m.color }}>{m.icon}</span>{m.label}</div>
                      <div style={{ fontSize:9,color:"#444" }}>{c}</div>
                    </div>
                    <div style={{ height:3,background:"#1A1A1A",borderRadius:2 }}>
                      <div style={{ height:"100%",width:`${pct}%`,background:m.color,borderRadius:2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ border:`1px solid ${unlocked?"#30D158":"#1A1A1A"}`,padding:"14px",textAlign:"center" }}>
              {unlocked ? (
                <>
                  <div style={{ fontSize:10,color:"#30D158",marginBottom:4,letterSpacing:2 }}>✓ MEMBRE CLUB ACTIF</div>
                  <div style={{ fontSize:10,color:"#444" }}>Décisions illimitées · Modes exclusifs</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:10,color:"#555",marginBottom:9 }}>Passe au Club pour l'accès complet</div>
                  <button onClick={()=>setShowPaywall(true)} style={{ ...btn("#F0F0F0","#000"),padding:"9px 18px",fontSize:9 }}>⚡ 7 JOURS OFFERTS — 9€/MOIS</button>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      {page !== "shared" && (
        <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"#0A0A0A",borderTop:"1px solid #1A1A1A",display:"flex",zIndex:100 }}>
          {[{id:"home",label:"MODULES",icon:"◎"},{id:"history",label:"HISTORIQUE",icon:"◷"},{id:"profile",label:"PROFIL",icon:"◈"}].map(tab => {
            const isActive = tab.id==="home" ? ["home","form","loading","result"].includes(page) : page===tab.id;
            return (
              <button key={tab.id} onClick={()=>{ tab.id==="home"?goHome():navigate(tab.id); }} style={{ flex:1,padding:"11px 0",background:"transparent",border:"none",color:isActive?"#F0F0F0":"#444",cursor:"pointer",fontFamily:"inherit",fontSize:8,letterSpacing:2,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <span style={{ fontSize:14 }}>{tab.icon}</span>{tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
