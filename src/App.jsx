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
  { id:"LOVE",     label:"LOVE",     icon:"♡", color:"#FF2D55", desc:"Relations & émotions",       systemPrompt:`Tu es CUT/GO™ LOVE. Décision froide sur les relations. Analyse : respect, toxicité, dépendance, cohérence actes/paroles. Décision obligatoire, jamais "ça dépend". MODE URGENCE : si URGENCE = élevée, ignore les nuances, base-toi uniquement sur respect et toxicité, et le verdict DOIT être RESTE ou QUITTE (jamais PRENDS DU RECUL). Réponds UNIQUEMENT en JSON valide : {"verdict":"RESTE"|"QUITTE"|"PRENDS DU RECUL","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SAIN"|"INSTABLE"|"TOXIQUE"}` },
  { id:"MONEY",    label:"MONEY",    icon:"◈", color:"#FFD60A", desc:"Décisions financières",       systemPrompt:`Tu es CUT/GO™ MONEY. Décision froide sur l'argent. Analyse : gain potentiel, perte possible, coût de l'inaction. Décision obligatoire, jamais "ça dépend". MODE URGENCE : si URGENCE = élevée, base-toi uniquement sur la perte immédiate et l'opportunité rapide, et le verdict DOIT être INVESTIS ou REFUSE (jamais ATTENDS). Réponds UNIQUEMENT en JSON valide : {"verdict":"INVESTIS"|"REFUSE"|"ATTENDS","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"RENTABLE"|"RISQUÉ"|"MAUVAIS"}` },
  { id:"BUSINESS", label:"BUSINESS", icon:"⬡", color:"#0A84FF", desc:"Décisions entrepreneuriales", systemPrompt:`Tu es CUT/GO™ BUSINESS. Décision froide sur le business. Analyse : potentiel, vitesse, coût/bénéfice. Décision obligatoire, jamais "ça dépend". MODE URGENCE : si URGENCE = élevée, base-toi uniquement sur le gain rapide et le risque immédiat, et le verdict DOIT être LANCE ou STOP (jamais TEST). Réponds UNIQUEMENT en JSON valide : {"verdict":"LANCE"|"STOP"|"TEST","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"SCALABLE"|"FAIBLE"|"À TESTER"}` },
  { id:"CREATOR",  label:"CREATOR",  icon:"▲", color:"#30D158", desc:"Création de contenu",         systemPrompt:`Tu es CUT/GO™ CREATOR. Décision froide sur la création. Analyse : attention, clarté, différenciation. Décision obligatoire, jamais "ça dépend". MODE URGENCE : si URGENCE = élevée, base-toi uniquement sur l'attention immédiate et l'impact rapide, et le verdict DOIT être PUBLIE ou STOP (jamais OPTIMISE). Réponds UNIQUEMENT en JSON valide : {"verdict":"PUBLIE"|"STOP"|"OPTIMISE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"VIRAL"|"MOYEN"|"INVISIBLE"}` },
  { id:"CAREER",   label:"CAREER",   icon:"◆", color:"#BF5AF2", desc:"Décisions professionnelles",  systemPrompt:`Tu es CUT/GO™ CAREER. Décision froide sur la carrière. Analyse : évolution, sécurité, opportunité. Décision obligatoire, jamais "ça dépend". MODE URGENCE : si URGENCE = élevée, base-toi uniquement sur la sécurité et l'opportunité immédiate, et le verdict DOIT être ACCEPTE ou REFUSE (jamais PRÉPARE). Réponds UNIQUEMENT en JSON valide : {"verdict":"ACCEPTE"|"REFUSE"|"PRÉPARE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"ÉVOLUTIF"|"STABLE"|"BLOQUÉ"}` },
];

const EXCLUSIVE_MODES = [
  { id:"URGENCE",     label:"MODE URGENCE",     icon:"◈", color:"#FF9500", desc:"Verdict en 10 secondes",       clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE URGENCE. Ultra-rapide, pas de nuance. Réponds UNIQUEMENT en JSON valide : {"verdict":"GO"|"STOP","pourquoi":["r1"],"action":"string","risque":"string","consequence":"string","signal":"CRITIQUE"|"URGENT"|"STABLE"}` },
  { id:"HIGH_RISK",   label:"MODE HIGH RISK",   icon:"◬", color:"#32ADE6", desc:"Analyse des risques extrêmes", clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE HIGH RISK. Focus pire scénario. Réponds UNIQUEMENT en JSON valide : {"verdict":"DANGER"|"RISQUE MODÉRÉ"|"ACCEPTABLE","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"ATTENTION"|"OK"}` },
  { id:"MANIPULATION",label:"MODE MANIPULATION",icon:"◉", color:"#FF2D9C", desc:"Détecte si on te manipule",    clubOnly:true, systemPrompt:`Tu es CUT/GO™ MODE MANIPULATION. Détecte gaslighting, love bombing, manipulation émotionnelle. Réponds UNIQUEMENT en JSON valide : {"verdict":"MANIPULATION DÉTECTÉE"|"SUSPECT"|"SAIN","pourquoi":["r1","r2"],"action":"string","risque":"string","consequence":"string","signal":"DANGER"|"SUSPECT"|"SAIN"}` },
];

const ALL_MODULES = [...BASE_MODULES, ...EXCLUSIVE_MODES];

// ─── SCÉNARIOS ────────────────────────────────────────────────
const SCENARIOS = {
  LOVE: [
    { label:"L'ex qui a changé",                situation:"Mon ex revient 10 mois après notre rupture causée par ses mensonges répétés, sans infidélité. Depuis, cette personne a fait une thérapie, changé plusieurs habitudes et reconnaît ses erreurs. J'ai encore des sentiments.",                                          optionA:"Redonner une chance à la relation",     optionB:"Fermer définitivement cette histoire", urgence:"moyenne", objectif:"Savoir si cette relation mérite réellement une seconde chance", peur:"Me refaire blesser ou abandonner quelqu'un qui a réellement changé" },
    { label:"Tout va bien, sauf l'amour",        situation:"Je suis en couple depuis 5 ans. Aucun gros conflit, aucune tromperie et beaucoup de respect. Pourtant, depuis plus d'un an, je ne ressens presque plus de désir et j'ai davantage l'impression de vivre avec mon meilleur ami.",                                    optionA:"Rester et essayer de reconstruire notre intimité", optionB:"Quitter la relation", urgence:"faible", objectif:"Être dans une relation stable mais aussi réellement épanouissante", peur:"Quitter une bonne personne et comprendre trop tard que j'ai confondu amour mature et perte de sentiments" },
    { label:"Une tromperie après 6 ans",         situation:"Mon partenaire m'avoue spontanément avoir couché une fois avec quelqu'un pendant un déplacement. Il coupe tout contact avec cette personne, assume entièrement sa faute et veut reconstruire notre couple. Jusqu'ici, notre relation était solide.",                    optionA:"Essayer de reconstruire la relation",   optionB:"Quitter", urgence:"élevée", objectif:"Prendre une décision que je pourrai encore respecter dans plusieurs années", peur:"Pardonner quelque chose qui détruira ma confiance ou perdre une relation importante pour une faute réellement isolée" },
    { label:"Enfant ou couple",                  situation:"Je suis heureux en couple depuis 5 ans. Je veux absolument avoir des enfants. Mon partenaire, qui était auparavant indécis, vient de m'annoncer qu'il pense désormais ne jamais en vouloir.",                                                                      optionA:"Rester dans la relation",               optionB:"Partir pour préserver mon projet de famille", urgence:"élevée", objectif:"Construire une vie compatible avec mes valeurs profondes", peur:"Perdre la personne que j'aime ou renoncer à devenir parent et lui en vouloir plus tard" },
    { label:"Le téléphone",                      situation:"Notre relation se passe bien, mais mon partenaire protège énormément son téléphone et le retourne souvent lorsqu'il s'absente. Je n'ai aucune preuve de tromperie et son comportement envers moi n'a pas changé.",                                                   optionA:"Respecter sa vie privée et ne pas insister", optionB:"Lui demander directement d'expliquer ce comportement", optionC:"Vérifier discrètement son téléphone si l'occasion se présente", urgence:"moyenne", objectif:"Comprendre s'il existe réellement un problème de confiance", peur:"Ignorer un signal important ou devenir moi-même intrusif et méfiant" },
    { label:"Montréal",                          situation:"Mon partenaire obtient une opportunité professionnelle exceptionnelle à Montréal pour deux ans. Ma carrière est en France et le suivre m'obligerait à quitter mon emploi. Notre relation de 3 ans fonctionne très bien.",                                              optionA:"Rester en France et tenter la distance", optionB:"Partir vivre à Montréal avec lui/elle", optionC:"Mettre fin à la relation avant le départ", urgence:"élevée", objectif:"Préserver ce qui compte sans sacrifier aveuglément ma propre trajectoire", peur:"Perdre ma relation ou prendre une décision de vie énorme uniquement par amour" },
  ],
  MONEY: [
    { label:"10 000 € sur une opportunité",      situation:"J'ai 30 000 € d'épargne, aucun crédit et un revenu stable. Une opportunité d'investissement nécessite 10 000 €. Le rendement potentiel est intéressant, mais je peux perdre une grande partie de la somme.",                                                       optionA:"Investir 10 000 €",                     optionB:"Garder mon argent", urgence:"moyenne", objectif:"Faire progresser mon patrimoine sans compromettre ma sécurité", peur:"Perdre 10 000 € ou laisser passer une opportunité réellement rentable" },
    { label:"Acheter l'appartement",             situation:"Je paie 950 € de loyer et dispose de 40 000 € d'épargne. Je peux acheter un appartement adapté à mes besoins avec 35 000 € d'apport, mais je ne sais pas avec certitude si je resterai dans cette ville plus de 5 ans.",                                              optionA:"Acheter",                               optionB:"Continuer à louer et conserver mon capital", urgence:"moyenne", objectif:"Construire mon patrimoine sans perdre inutilement ma flexibilité", peur:"Continuer à payer un loyer pendant des années ou acheter puis devoir revendre trop rapidement" },
    { label:"12 000 € pour voyager",             situation:"J'ai 20 000 € d'épargne et aucune dette. Je veux partir voyager pendant un an, ce qui coûterait environ 12 000 € et nécessiterait de quitter mon emploi. Je pourrais retrouver du travail à mon retour, sans garantie.",                                             optionA:"Partir",                                optionB:"Garder mon emploi et continuer à épargner", urgence:"faible", objectif:"Profiter de ma vie sans sacrifier ma sécurité financière future", peur:"Revenir presque sans argent ou repousser ce projet jusqu'à ne jamais le faire" },
    { label:"Rembourser ou placer",              situation:"J'ai 20 000 € disponibles et 18 000 € de crédit restant à 3 %. Je peux supprimer quasiment toute ma dette ou investir l'argent à long terme avec un rendement espéré supérieur au taux du crédit.",                                                              optionA:"Investir les 20 000 €",                 optionB:"Rembourser le crédit", urgence:"faible", objectif:"Maximiser mon patrimoine à long terme avec un niveau de risque acceptable", peur:"Sacrifier du rendement ou subir une perte en gardant parallèlement ma dette" },
    { label:"15 000 € dans le restaurant",       situation:"Mon meilleur ami ouvre un restaurant. Il a déjà réuni 100 000 € et me propose 10 % contre 15 000 €. Il est très bon restaurateur mais mauvais gestionnaire. J'ai 35 000 € d'épargne.",                                                                              optionA:"Investir 15 000 €",                     optionB:"Refuser complètement", optionC:"Investir 7 500 € contre 5 %", urgence:"élevée", objectif:"Profiter d'une opportunité potentiellement rentable sans exposer excessivement mon capital", peur:"Perdre mon argent et notre amitié ou regarder le business réussir après mon refus" },
    { label:"Héritage de 60 000 €",              situation:"Je viens de recevoir 60 000 €. J'ai encore 150 000 € de crédit immobilier à 2,2 %, une épargne de sécurité suffisante et aucun autre crédit.",                                                                                                                       optionA:"Rembourser 60 000 € du prêt",           optionB:"Investir les 60 000 € à long terme", optionC:"Utiliser 30 000 € pour chaque option", urgence:"faible", objectif:"Utiliser cet argent pour améliorer au maximum ma situation financière future", peur:"Privilégier la tranquillité au détriment du rendement ou prendre trop de risque avec une somme exceptionnelle" },
  ],
  BUSINESS: [
    { label:"Des intéressés, aucun paiement",    situation:"Je veux lancer un service B2B à 99 €/mois. Sur 30 prospects interrogés, 18 disent avoir le problème et 7 affirment qu'ils pourraient payer. Personne n'a encore sorti sa carte.",                                                                                  optionA:"Construire le produit et lancer",       optionB:"Abandonner l'idée", urgence:"moyenne", objectif:"Construire un business avec une demande réelle", peur:"Arriver trop tard ou développer pendant des mois quelque chose que personne n'achètera" },
    { label:"22 000 € déjà investis",            situation:"J'ai investi 22 000 € et 14 mois dans un produit qui génère désormais 1 200 €/mois. Les revenus augmentent légèrement chaque trimestre, mais beaucoup moins vite que prévu.",                                                                                        optionA:"Continuer à investir dans le projet",   optionB:"L'arrêter et réallouer mon temps et mon argent", urgence:"moyenne", objectif:"Concentrer mes ressources sur une activité ayant un vrai potentiel économique", peur:"Stopper juste avant le décollage ou tomber dans le piège des coûts déjà engagés" },
    { label:"Le concurrent à 2 M€",              situation:"Je veux lancer un service dans une niche où un concurrent réalise déjà environ 2 M€ de chiffre d'affaires. Mon offre serait 30 % moins chère, mais je n'ai pour l'instant aucune autre différenciation majeure.",                                                    optionA:"Lancer",                                optionB:"Abandonner cette idée", urgence:"faible", objectif:"Entrer sur un marché rentable avec une proposition suffisamment compétitive", peur:"Sous-estimer la puissance du concurrent ou abandonner un marché déjà validé" },
    { label:"3 clients veulent déjà payer",      situation:"Mon produit n'existe pas encore, mais trois entreprises sont prêtes à payer chacune 500 € pour que je réalise manuellement le service. Construire l'automatisation complète demanderait environ quatre mois.",                                                       optionA:"Vendre immédiatement le service manuel",optionB:"Construire d'abord le produit complet", urgence:"élevée", objectif:"Transformer rapidement la demande en activité viable sans construire inutilement", peur:"Donner une expérience imparfaite ou passer quatre mois à développer avant d'avoir validé les ventes" },
    { label:"Abonnement qui fuit",               situation:"Mon abonnement attire facilement des clients mais 40 % annulent durant les deux premiers mois. L'acquisition reste légèrement rentable, mais la mauvaise rétention limite fortement la croissance.",                                                                optionA:"Augmenter fortement l'acquisition",     optionB:"Arrêter l'offre", optionC:"Réduire l'acquisition et retravailler le produit avant de scaler", urgence:"élevée", objectif:"Construire un modèle réellement scalable", peur:"Freiner une acquisition rentable ou accélérer un business qui fuit" },
    { label:"49 € ou 149 €",                     situation:"Dix premiers clients ont acheté mon service à 49 €/mois sans négocier. Plusieurs disent même qu'ils s'attendaient à un prix supérieur. Je dois maintenant choisir le positionnement avant une campagne importante.",                                              optionA:"Garder 49 € pour accélérer l'acquisition", optionB:"Passer directement à 149 €", optionC:"Tester 99 € sur les 20 prochains prospects", urgence:"moyenne", objectif:"Trouver le meilleur équilibre entre conversion et revenu par client", peur:"Laisser beaucoup d'argent sur la table ou tuer la croissance avec une hausse trop agressive" },
  ],
  CREATOR: [
    { label:"La vidéo à 1 000 €",                situation:"Mon compte finance a 24 000 abonnés. J'ai tourné « J'ai dépensé 1 000 € pour tester 10 conseils financiers viraux ». Le concept est fort, mais il faut 25 secondes avant le premier résultat.",                                                                    optionA:"Publier telle quelle",                  optionB:"Abandonner la vidéo et passer au prochain concept", urgence:"moyenne", objectif:"Maximiser portée et rétention sans gaspiller davantage de temps", peur:"Abandonner un excellent concept ou publier une exécution qui tue son potentiel" },
    { label:"Le post qui va énerver",            situation:"J'ai préparé une vidéo qui contredit une croyance très populaire dans ma niche. Mes arguments et mes sources sont solides, mais je sais que la conclusion va provoquer beaucoup de critiques et probablement quelques désabonnements.",                              optionA:"Publier",                               optionB:"Ne pas publier", urgence:"faible", objectif:"Produire du contenu différenciant sans sacrifier inutilement ma crédibilité", peur:"M'autocensurer ou créer du conflit qui abîmera ma marque" },
    { label:"Le format qui marche mais ressemble aux autres", situation:"Mon nouveau format réalise régulièrement 50 000 à 100 000 vues, soit cinq fois plus que mes anciennes vidéos. Mais deux gros créateurs de ma niche utilisent déjà une structure très proche.",                                                      optionA:"Continuer ce format tant qu'il fonctionne", optionB:"L'abandonner pour construire quelque chose de plus distinctif", urgence:"moyenne", objectif:"Maintenir ma croissance tout en construisant une identité reconnaissable", peur:"Casser une mécanique performante ou devenir interchangeable avec mes concurrents" },
    { label:"Une tendance dans 24 heures",       situation:"Une actualité explose dans ma niche. J'ai un angle réellement différent basé sur mes propres données, mais ma vidéo ne pourra sortir que demain alors que les premiers créateurs publient déjà aujourd'hui.",                                                        optionA:"Publier demain avec mon angle complet", optionB:"Abandonner le sujet et préparer autre chose", urgence:"élevée", objectif:"Profiter de l'attention sans produire du contenu déjà périmé", peur:"Arriver trop tard ou abandonner un excellent angle uniquement par peur du timing" },
    { label:"4 millions de vues",                situation:"Une vidéo provocatrice vient de faire 4 millions de vues et +40 000 abonnés. Ce ton fonctionne énormément mais attire une audience plus agressive que celle que je veux construire.",                                                                            optionA:"Reproduire immédiatement le même style", optionB:"Revenir totalement à mon ancien contenu", optionC:"Conserver la mécanique de la vidéo mais changer le ton", urgence:"élevée", objectif:"Transformer cette viralité en croissance durable sans devenir prisonnier d'une image", peur:"Tuer une énorme dynamique ou construire une audience que je finirai par détester" },
    { label:"300 vues depuis 8 mois",            situation:"Je publie quatre fois par semaine depuis huit mois et dépasse rarement 500 vues. Ma petite audience est pourtant engagée et plusieurs contenus obtiennent de bons taux de sauvegarde malgré leur faible portée.",                                                    optionA:"Continuer exactement avec la stratégie actuelle", optionB:"Arrêter le compte", optionC:"Changer hooks, formats et packaging pendant 30 jours en gardant la même niche", urgence:"faible", objectif:"Déterminer si le problème vient du sujet ou de son exécution", peur:"Abandonner quelque chose qui pourrait fonctionner ou gaspiller encore plusieurs mois" },
  ],
  CAREER: [
    { label:"+800 € contre ta liberté",          situation:"Je gagne 2 500 € net, travaille 35 h avec deux jours de télétravail et suis à 20 minutes du bureau. Une entreprise me propose 3 300 € net et un meilleur titre, mais 45 h, aucun télétravail et 1 h de trajet dans chaque sens.",                                     optionA:"Accepter",                              optionB:"Refuser", urgence:"élevée", objectif:"Progresser financièrement sans dégrader excessivement ma qualité de vie", peur:"Stagner par confort ou gagner davantage en regrettant mon quotidien actuel" },
    { label:"Manager pour 150 €",                situation:"Mon entreprise me propose de manager 7 personnes. Cette expérience serait excellente pour mon CV, mais l'augmentation n'est que de 150 € net par mois et les responsabilités augmenteraient fortement.",                                                          optionA:"Accepter",                              optionB:"Refuser", urgence:"élevée", objectif:"Accélérer ma carrière sans brader ma valeur", peur:"Rater une étape importante ou accepter une fausse promotion" },
    { label:"CDI contre startup",                situation:"J'ai un CDI à 2 800 € net dans une entreprise solide. Une startup me propose 3 200 €, davantage de responsabilités et des stock-options, mais elle dispose d'environ 18 mois de trésorerie.",                                                                       optionA:"Rejoindre la startup",                  optionB:"Garder mon CDI", urgence:"élevée", objectif:"Accélérer ma carrière avec un niveau de risque acceptable", peur:"Me cacher derrière la sécurité ou perdre mon emploi dans 18 mois" },
    { label:"-350 € pour le métier que tu veux", situation:"Une entreprise que je vise depuis plusieurs années me propose enfin le métier que je veux vraiment. L'équipe et les perspectives sont excellentes, mais je perdrais 350 € net par mois pendant probablement deux ans.",                                              optionA:"Accepter",                              optionB:"Refuser et garder mon poste actuel", urgence:"élevée", objectif:"Construire une carrière plus alignée sans fragiliser inutilement mes finances", peur:"Sacrifier une opportunité rare pour 350 € ou idéaliser un poste qui réduira mon niveau de vie" },
    { label:"Même salaire, meilleur avenir",     situation:"Mon travail actuel est facile, bien payé et mon équipe est excellente, mais je n'apprends presque plus rien depuis trois ans. Une autre entreprise propose exactement le même salaire pour un poste plus exigeant mais beaucoup plus formateur.",                     optionA:"Accepter le nouveau poste",             optionB:"Rester", optionC:"Continuer à chercher une troisième offre avec progression et hausse de salaire", urgence:"faible", objectif:"Continuer à progresser sans quitter inutilement une excellente situation", peur:"M'endormir professionnellement ou abandonner un confort rare sans réel gain immédiat" },
    { label:"La contre-offre à +700 €",          situation:"J'ai accepté ailleurs pour +500 € et une meilleure culture d'entreprise. Lorsque j'annonce mon départ, mon employeur actuel me propose +700 € et la promotion que je réclame depuis un an.",                                                                       optionA:"Rester pour la contre-offre",           optionB:"Partir comme prévu", optionC:"Demander à la nouvelle entreprise de s'aligner avant de décider", urgence:"élevée", objectif:"Choisir la meilleure trajectoire à long terme plutôt que simplement le salaire le plus élevé", peur:"Partir alors que ma situation s'améliore enfin ou rester dans une entreprise qui ne m'a valorisé qu'au moment de mon départ" },
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

// ─── RÉTENTION ────────────────────────────────────────────────
const getSuivis   = ()=> LS.get("cg_suivis",{});
const saveSuivi   = (id,rep)=>{ const s=getSuivis(); s[id]=rep; LS.set("cg_suivis",s); };

const delaiSuivi  = (urgence)=> urgence==="élevée"?7:urgence==="faible"?90:30;

const getAFollowUp = (history)=>{
  const suivis=getSuivis();
  return history.filter(h=>{
    const age=(Date.now()-new Date(h.date).getTime())/(1000*3600*24);
    const delai=delaiSuivi(h.form?.urgence||"moyenne");
    return age>=delai && suivis[h.id]===undefined;
  });
};

const calcScore = (history)=>{
  const suivis=getSuivis();
  const avecSuivi=history.filter(h=>suivis[h.id]!==undefined);
  if(avecSuivi.length===0) return {score:0,niveau:"—",color:MUTED,oui:0,total:0};
  const oui=avecSuivi.filter(h=>suivis[h.id]==="oui").length;
  const score=Math.round((oui/avecSuivi.length)*100);
  const niveau=score>=80?"LUCIDE":score>=50?"EN PROGRÈS":"BLOQUÉ";
  const color=score>=80?"#30D158":score>=50?"#FFD60A":"#FF453A";
  return {score,niveau,color,oui,total:avecSuivi.length};
};

const calcStreak = (history)=>{
  if(!history.length) return 0;
  const semaines=new Set(history.map(h=>Math.floor(new Date(h.date).getTime()/(7*24*3600*1000))));
  const now=Math.floor(Date.now()/(7*24*3600*1000));
  let streak=0; let w=now;
  while(semaines.has(w)||semaines.has(w-1)){
    if(semaines.has(w)) streak++;
    w--;
    if(!semaines.has(w)&&!semaines.has(w-1)) break;
  }
  return streak;
};

// ─── SHARE ────────────────────────────────────────────────────
const encShare = (d)=>{ try{ return btoa(encodeURIComponent(JSON.stringify(d))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }catch(e){ return null; } };
const decShare = (s)=>{ try{ const b=s.replace(/-/g,"+").replace(/_/g,"/"); const p=b+"===".slice(0,(4-b.length%4)%4); return JSON.parse(decodeURIComponent(atob(p))); }catch(e){ return null; } };
const buildShareLink = (mod,result)=>{ const enc=encShare({v:result.verdict,s:result.signal,a:result.action,ml:mod.label,mc:mod.color,mi:mod.icon}); return enc?`https://${SITE_URL}/#s/${enc}`:`https://${SITE_URL}`; };

// ─── UI ATOMS ─────────────────────────────────────────────────
const Lbl = ({children,color,mb=10})=> <div style={{fontFamily:MONO,fontSize:11,letterSpacing:4,color:color||MUTED,marginBottom:mb,textTransform:"uppercase"}}>{children}</div>;
const Crd = ({children,accent,hi,style={}})=> <div style={{background:hi?`${accent}15`:CARD,border:`1px solid ${hi?`${accent}30`:BORDER}`,borderRadius:16,padding:"18px",...style}}>{children}</div>;

// ─── MODAL SUIVI ─────────────────────────────────────────────
function FollowupModal({ entry, total, current, onAnswer, onLater }) {
  const vc = VC[entry.result?.verdict]||entry.mod?.color||"#F0F0F6";
  const delai = delaiSuivi(entry.form?.urgence||"moyenne");
  const age = Math.floor((Date.now()-new Date(entry.date).getTime())/(1000*3600*24));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:440,width:"100%",background:"#0D0D0F",border:`1px solid ${BORDER}`,borderRadius:20,padding:"28px 24px"}}>
        {/* Barre progression */}
        <div style={{display:"flex",gap:4,marginBottom:20}}>
          {Array.from({length:total},(_,i)=>(
            <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<current?"#30D158":i===current?TEXT:CARD2,transition:"background .3s"}}/>
          ))}
        </div>
        <div style={{fontFamily:MONO,fontSize:10,letterSpacing:4,color:MUTED,marginBottom:6}}>SUIVI {delai} JOURS</div>
        <div style={{fontFamily:SANS,fontSize:17,fontWeight:700,color:TEXT,marginBottom:20,lineHeight:1.3}}>
          Tu avais pris une décision.<br/>Tu l'as mise en action ?
        </div>
        {/* Module + date */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:`${entry.mod?.color}20`,border:`1px solid ${entry.mod?.color}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{entry.mod?.icon}</div>
          <div style={{fontFamily:MONO,fontSize:10,letterSpacing:2,color:entry.mod?.color}}>{entry.mod?.label}</div>
          <div style={{fontFamily:MONO,fontSize:9,color:"#333",marginLeft:"auto"}}>{age} jours plus tôt</div>
        </div>
        {/* Situation */}
        <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:3,color:MUTED,marginBottom:6}}>LA SITUATION</div>
          <div style={{fontFamily:SANS,fontSize:13,color:TEXT,lineHeight:1.5}}>{entry.form?.situation}</div>
        </div>
        {/* Verdict + Action */}
        <div style={{background:`${vc}10`,border:`1px solid ${vc}25`,borderRadius:12,padding:"12px 14px",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:8}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:3,color:MUTED}}>VERDICT</div>
            <div style={{fontFamily:SANS,fontSize:22,fontWeight:800,color:vc,letterSpacing:-1}}>{entry.result?.verdict}</div>
          </div>
          <div style={{height:1,background:`${vc}30`,marginBottom:8}}/>
          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:3,color:MUTED,marginBottom:5}}>ACTION RECOMMANDÉE</div>
          <div style={{fontFamily:SANS,fontSize:12,color:TEXT,fontStyle:"italic",lineHeight:1.5}}>« {entry.result?.action} »</div>
        </div>
        {/* Boutons réponse */}
        <div style={{fontFamily:SANS,fontSize:15,fontWeight:600,color:TEXT,textAlign:"center",marginBottom:16}}>Tu l'as fait ?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <button onClick={()=>onAnswer("oui")} style={{padding:"16px 0",background:"#30D15818",border:"2px solid #30D158",borderRadius:14,color:"#30D158",fontFamily:MONO,fontSize:14,fontWeight:900,cursor:"pointer",letterSpacing:2}}>✓ OUI</button>
          <button onClick={()=>onAnswer("non")} style={{padding:"16px 0",background:"#FF453A18",border:"2px solid #FF453A",borderRadius:14,color:"#FF453A",fontFamily:MONO,fontSize:14,fontWeight:900,cursor:"pointer",letterSpacing:2}}>✗ NON</button>
        </div>
        <button onClick={onLater} style={{background:"none",border:"none",color:"#333",fontFamily:MONO,fontSize:9,cursor:"pointer",display:"block",width:"100%",textAlign:"center",letterSpacing:2}}>Plus tard</button>
      </div>
    </div>
  );
}

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
  const [code,setCode]=useState(""); const [err,setErr]=useState(""); const [checking,setChecking]=useState(false);
  const check=async()=>{
    const c=code.trim();
    if(!c){ setErr("Entre ta license key."); return; }
    setErr(""); setChecking(true);
    try{
      const r=await fetch("/api/verify-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({licenseKey:c})});
      const data=await r.json();
      if(data.valid){ setUnlocked(); onUnlock(); }
      else{ setErr(data.reason==="subscription_inactive"?"Abonnement inactif ou annulé.":"Code invalide. Vérifie ton email Gumroad."); }
    }catch(e){ setErr("Erreur de vérification. Réessaie."); }
    finally{ setChecking(false); }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{maxWidth:440,width:"100%",background:"#0D0D0F",border:`1px solid ${BORDER}`,borderRadius:20,padding:"32px 24px"}}>
        <Lbl mb={14}>Accès limité</Lbl>
        <div style={{fontFamily:SANS,fontSize:22,fontWeight:700,color:TEXT,marginBottom:8,lineHeight:1.2}}>{count>=FREE_DECISIONS?`Tes ${FREE_DECISIONS} décisions gratuites sont utilisées.`:"Mode exclusif Club."}</div>
        <div style={{fontFamily:SANS,fontSize:13,color:MUTED,marginBottom:22,lineHeight:1.6}}>7 jours offerts. Ensuite 9€/mois.</div>
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
          {["Décisions illimitées","Historique complet","3 modes exclusifs : URGENCE, HIGH RISK, MANIPULATION","Formats BRUTAL / RAPIDE / STRATÉGIQUE","6 exemples de scénarios par module"].map((f,i)=>(
            <div key={i} style={{fontFamily:SANS,fontSize:14,color:MUTED,marginBottom:5,display:"flex",gap:10,lineHeight:1.4}}><span style={{color:"#30D158"}}>✓</span>{f}</div>
          ))}
        </div>
        <a href={GUMROAD_URL} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none",display:"block",marginBottom:14}}>
          <button style={{width:"100%",padding:"16px 0",background:TEXT,border:"none",borderRadius:14,color:"#000",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ COMMENCER — 7 JOURS OFFERTS</button>
        </a>
        <Lbl mb={8}>J'ai déjà un code</Lbl>
        <div style={{display:"flex",gap:8,marginBottom:err?8:0}}>
          <input disabled={checking} value={code} onChange={e=>setCode(e.target.value)} placeholder="CUTGO-XXXXXX" onKeyDown={e=>e.key==="Enter"&&check()} style={{flex:1,background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,padding:"11px 14px",fontFamily:MONO,fontSize:12,outline:"none",opacity:checking?0.5:1}}/>
          <button onClick={check} disabled={checking} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,color:TEXT,padding:"0 18px",fontFamily:MONO,fontSize:10,fontWeight:700,cursor:checking?"default":"pointer",letterSpacing:1,opacity:checking?0.6:1}}>{checking?"...":"OK"}</button>
        </div>
        {err&&<div style={{fontFamily:MONO,color:"#FF453A",fontSize:10,marginBottom:8,letterSpacing:1}}>{err}</div>}
        <button onClick={onClose} style={{background:"none",border:"none",color:"#333",fontFamily:MONO,fontSize:11,cursor:"pointer",marginTop:14,display:"block",width:"100%",textAlign:"center",letterSpacing:2}}>Retour</button>
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
        <button onClick={onClose} style={{background:"none",border:"none",color:"#333",fontFamily:MONO,fontSize:11,cursor:"pointer",display:"block",width:"100%",textAlign:"center",letterSpacing:2}}>Fermer</button>
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
              <button key={f} onClick={()=>handleFormat(f)} style={{flex:1,padding:"7px 0",background:active?colors[f]:"transparent",border:`1px solid ${active?colors[f]:BORDER}`,borderRadius:8,color:active?(f==="STANDARD"?"#000":f==="RAPIDE"?"#000":"#fff"):MUTED,fontFamily:MONO,fontSize:10,letterSpacing:1,cursor:"pointer",fontWeight:active?700:400,opacity:(!unlocked&&f!=="STANDARD")?0.4:1}}>
                {f}{!unlocked&&f!=="STANDARD"&&<span style={{display:"block",fontSize:6,color:MUTED,letterSpacing:0}}>CLUB</span>}
              </button>
            );
          })}
        </div>
        {formatLoading?(
          <div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontFamily:MONO,fontSize:11,letterSpacing:4,color:MUTED}}>REFORMATAGE...</div></div>
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
                    <div style={{fontFamily:MONO,fontSize:11,color:mod.color,minWidth:20,paddingTop:3,letterSpacing:1}}>0{i+1}</div>
                    <div style={{fontFamily:SANS,fontSize:15,color:TEXT,lineHeight:1.55,opacity:.9}}>{r}</div>
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
                <Crd key={i}><Lbl>{s.l}</Lbl><div style={{fontFamily:SANS,fontSize:13,color:MUTED,lineHeight:1.5}}>{s.v}</div></Crd>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <button onClick={()=>setShowShare(true)} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,color:MUTED,padding:"13px 0",fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer",fontWeight:700}}>PARTAGER</button>
              <button onClick={onNew} style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,color:MUTED,padding:"13px 0",fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer",fontWeight:700}}>NOUVELLE</button>
              <button onClick={onHome} style={{background:mod.color,border:"none",borderRadius:12,color:"#000",padding:"13px 0",fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer",fontWeight:700}}>MODULES</button>
            </div>
            {!unlocked&&(
              <div style={{background:CARD2,border:`1px solid ${BORDER}`,borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
                <div style={{fontFamily:SANS,fontSize:12,color:MUTED,marginBottom:10}}>Modes exclusifs + formats avancés disponibles dans le Club.</div>
                <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:10,color:"#000",padding:"10px 20px",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>⚡ 7 JOURS OFFERTS</button>
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

  const load=(s)=>{ setForm(f=>({...f,situation:s.situation,optionA:s.optionA,optionB:s.optionB,optionC:s.optionC||"",urgence:s.urgence,objectif:s.objectif,peur:s.peur})); setShowScenarios(false); };

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
      <div style={{fontFamily:MONO,fontSize:11,letterSpacing:6,color:MUTED,marginBottom:24}}>ANALYSE EN COURS</div>
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
          <button onClick={()=>setShowScenarios(!showScenarios)} style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:8,color:MUTED,padding:"7px 12px",fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer"}}>
            {showScenarios?"FERMER":`${SCENARIOS[mod.id].length} EXEMPLES`}
          </button>
        )}
      </div>
      {showScenarios&&SCENARIOS[mod.id]&&(
        <div style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:14,marginBottom:16,overflow:"hidden"}}>
          <div style={{fontFamily:MONO,fontSize:11,letterSpacing:3,color:MUTED,padding:"12px 14px",borderBottom:`1px solid ${BORDER}`}}>CHARGER UN EXEMPLE</div>
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
              <button key={u} onClick={()=>set("urgence",u)} style={{flex:1,padding:"10px 0",background:form.urgence===u?mod.color:"transparent",border:`1px solid ${form.urgence===u?mod.color:BORDER}`,borderRadius:10,color:form.urgence===u?"#000":MUTED,fontFamily:MONO,fontSize:11,letterSpacing:1,cursor:"pointer",fontWeight:form.urgence===u?700:400,textTransform:"uppercase"}}>{u}</button>
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
          <div style={{fontFamily:MONO,fontSize:11,letterSpacing:2,color:MUTED}}>{remaining>0?`${remaining} décision${remaining>1?"s":""} gratuite${remaining>1?"s":""}`:0+" décisions restantes"}</div>
          <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:8,color:"#000",padding:"7px 14px",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:2,cursor:"pointer"}}>CLUB →</button>
        </div>
      )}
      {unlocked&&(
        <div style={{background:`rgba(48,209,88,0.08)`,border:`1px solid rgba(48,209,88,0.2)`,borderRadius:14,padding:"10px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#30D158"}}/>
          <div style={{fontFamily:MONO,fontSize:11,letterSpacing:2,color:"#30D158"}}>CLUB ACTIF — ACCÈS COMPLET</div>
        </div>
      )}
      <Lbl mb={12}>— Modules</Lbl>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {BASE_MODULES.map(m=>(
          <button key={m.id} onClick={()=>onSelect(m)} style={{background:CARD,border:`1px solid ${BORDER}`,borderLeft:`3px solid ${m.color}`,borderRadius:16,padding:"16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",alignItems:"center",gap:14}}
            onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
            <div style={{width:44,height:44,borderRadius:12,background:`${m.color}15`,border:`2px solid ${m.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,color:m.color}}>{m.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,letterSpacing:-0.1,color:TEXT,marginBottom:3,textTransform:"capitalize"}}>{m.label.toLowerCase()}</div>
              <div style={{fontFamily:SANS,fontSize:13,color:MUTED,lineHeight:1.35}}>{m.desc}</div>
            </div>
            <div style={{fontFamily:MONO,fontSize:10,color:"#555",letterSpacing:0.5,textAlign:"right",lineHeight:1.3}}>{SCENARIOS[m.id]?.length} exemples</div>
          </button>
        ))}
      </div>
      <Lbl mb={12}>— Modes exclusifs Club</Lbl>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {EXCLUSIVE_MODES.map(m=>(
          <button key={m.id} onClick={()=>{ if(!unlocked){onPaywall();}else{onSelect(m);} }} style={{background:unlocked?`${m.color}08`:CARD,border:`1px solid ${unlocked?`${m.color}35`:BORDER}`,borderLeft:`3px solid ${unlocked?m.color:MUTED}`,borderRadius:16,padding:"16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",alignItems:"center",gap:14,opacity:unlocked?1:0.5,filter:unlocked?"none":"grayscale(0.6)",transition:"opacity .2s, filter .2s"}}
            onMouseEnter={e=>{ if(unlocked){ e.currentTarget.style.background=`${m.color}14`; e.currentTarget.style.borderColor=`${m.color}55`; } }} onMouseLeave={e=>{ if(unlocked){ e.currentTarget.style.background=`${m.color}08`; e.currentTarget.style.borderColor=`${m.color}35`; } }}>
            <div style={{width:44,height:44,borderRadius:12,background:unlocked?`${m.color}15`:"rgba(255,255,255,0.06)",border:`2px solid ${unlocked?m.color:MUTED}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:unlocked?m.color:MUTED}}>{unlocked?m.icon:"🔒"}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:SANS,fontSize:16,fontWeight:700,letterSpacing:-0.1,color:unlocked?m.color:MUTED,marginBottom:3,textTransform:"capitalize"}}>{m.label.toLowerCase()}</div>
              <div style={{fontFamily:SANS,fontSize:13,color:MUTED,lineHeight:1.35}}>{unlocked?m.desc:"Réservé au Club"}</div>
            </div>
            {!unlocked&&<div style={{fontFamily:MONO,fontSize:10,color:MUTED,letterSpacing:2,background:"rgba(255,255,255,0.06)",border:`1px solid ${BORDER}`,padding:"5px 10px",borderRadius:6}}>9€/MO</div>}
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
        <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:selected.mod?.color||MUTED,fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer",padding:0,marginBottom:18}}>← HISTORIQUE</button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${BORDER}`}}>
          <div style={{width:40,height:40,borderRadius:10,background:`${selected.mod?.color||"#444"}18`,border:`2px solid ${selected.mod?.color||"#444"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:selected.mod?.color||"#444"}}>{selected.mod?.icon||"◎"}</div>
          <div>
            <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,letterSpacing:2,color:selected.mod?.color||TEXT}}>{selected.mod?.label}</div>
            <div style={{fontFamily:MONO,fontSize:11,color:MUTED}}>{new Date(selected.date).toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
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
              <div style={{fontFamily:MONO,fontSize:11,color:selected.mod?.color||TEXT,minWidth:20,paddingTop:3}}>0{i+1}</div>
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
        <div style={{fontFamily:MONO,fontSize:11,color:MUTED}}>{history.length} décision{history.length!==1?"s":""}</div>
      </div>
      {history.length===0?(
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontFamily:MONO,fontSize:11,letterSpacing:4,color:"#333",marginBottom:10}}>AUCUNE DÉCISION</div>
          <div style={{fontFamily:SANS,fontSize:12,color:MUTED}}>Tes décisions apparaîtront ici après analyse.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map((h,i)=>(
            <button key={h.id||i} onClick={()=>setSelected(h)} style={{background:CARD,border:`1px solid ${BORDER}`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",fontFamily:SANS,display:"flex",gap:12,alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=CARD2} onMouseLeave={e=>e.currentTarget.style.background=CARD}>
              <div style={{width:40,height:40,borderRadius:10,background:`${h.mod?.color||"#444"}18`,border:`2px solid ${h.mod?.color||"#444"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:h.mod?.color||"#444"}}>{h.mod?.icon||"◎"}</div>
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
                <div style={{fontFamily:MONO,fontSize:10,color:"#666",marginBottom:2}}>{h.mod?.label}</div>
                {(()=>{
                  const suivis=getSuivis();
                  const age=(Date.now()-new Date(h.date).getTime())/(1000*3600*24);
                  const delai=delaiSuivi(h.form?.urgence||"moyenne");
                  if(suivis[h.id]==="oui") return <div style={{fontFamily:MONO,fontSize:9,color:"#30D158"}}>✓ FAIT</div>;
                  if(suivis[h.id]==="non") return <div style={{fontFamily:MONO,fontSize:9,color:"#FF453A"}}>✗ PAS FAIT</div>;
                  if(age>=delai) return <div style={{fontFamily:MONO,fontSize:9,color:"#FFD60A"}}>⟳ SUIVI</div>;
                  return <div style={{fontFamily:MONO,fontSize:9,color:"#333"}}>{Math.max(0,Math.round(delai-age))}j</div>;
                })()}
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
  let pos=0,neg=0;
  const posV=["RESTE","INVESTIS","LANCE","PUBLIE","ACCEPTE","GO","ACCEPTABLE","SAIN"];
  const negV=["QUITTE","REFUSE","STOP","DANGER","MANIPULATION DÉTECTÉE"];
  history.forEach(h=>{ if(byMod[h.mod?.id]!==undefined)byMod[h.mod.id]++; const v=h.result?.verdict||""; if(posV.some(p=>v.includes(p)))pos++; else if(negV.some(n=>v.includes(n)))neg++; });
  const fav=Object.entries(byMod).sort((a,b)=>b[1]-a[1])[0];
  const favMod=ALL_MODULES.find(m=>m.id===fav?.[0]);
  const favCount=fav?.[1]||0;
  const score=calcScore(history);
  const streak=calcStreak(history);
  const BADGES=[{icon:"🔥",n:"1 sem.",ok:streak>=1},{icon:"⚡",n:"4 sem.",ok:streak>=4},{icon:"💎",n:"8 sem.",ok:streak>=8},{icon:"👑",n:"12 sem.",ok:streak>=12}];

  return(
    <div>
      <Lbl mb={18}>— Profil</Lbl>

      {/* Stats principales */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:9}}>
        {[{l:"DÉCISIONS",v:total,c:TEXT},{l:"POSITIVES",v:pos,c:"#30D158"},{l:"NÉGATIVES",v:neg,c:"#FF453A"}].map((s,i)=>(
          <Crd key={i} style={{textAlign:"center",padding:"16px 10px"}}>
            <div style={{fontFamily:SANS,fontSize:28,fontWeight:800,color:s.c,lineHeight:1,marginBottom:6}}>{s.v}</div>
            <div style={{fontFamily:MONO,fontSize:10,letterSpacing:2,color:MUTED}}>{s.l}</div>
          </Crd>
        ))}
      </div>

      {/* Score de lucidité + Streak côte à côte */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
        {/* Score */}
        <div style={{background:`${score.color}10`,border:`1px solid ${score.color}25`,borderRadius:16,padding:"16px",textAlign:"center"}}>
          <Lbl color={score.color} mb={10}>Lucidité</Lbl>
          <svg width={80} height={80} viewBox="0 0 80 80" style={{display:"block",margin:"0 auto 8px"}}>
            <circle cx={40} cy={40} r={32} fill="none" stroke={CARD2} strokeWidth={6}/>
            <circle cx={40} cy={40} r={32} fill="none" stroke={score.color} strokeWidth={6}
              strokeDasharray={`${2*Math.PI*32*score.score/100} ${2*Math.PI*32*(1-score.score/100)}`}
              strokeLinecap="round" strokeDashoffset={2*Math.PI*32*0.25}/>
            <text x={40} y={45} textAnchor="middle" fill={score.color} fontSize={18} fontWeight={800} fontFamily="sans-serif">{score.score}</text>
          </svg>
          <div style={{fontFamily:MONO,fontSize:10,fontWeight:700,color:score.color,letterSpacing:2}}>{score.niveau}</div>
          <div style={{fontFamily:SANS,fontSize:10,color:MUTED,marginTop:4}}>{score.total>0?`${score.oui}/${score.total} décisions suivies`:"Réponds aux suivis"}</div>
        </div>

        {/* Streak */}
        <div style={{background:"#FFD60A0A",border:"1px solid #FFD60A20",borderRadius:16,padding:"16px",textAlign:"center"}}>
          <Lbl color="#FFD60A" mb={8}>Streak</Lbl>
          <div style={{fontSize:32,marginBottom:4}}>🔥</div>
          <div style={{fontFamily:MONO,fontSize:32,fontWeight:900,color:"#FFD60A",lineHeight:1,marginBottom:4}}>{streak}</div>
          <div style={{fontFamily:MONO,fontSize:9,color:"#997700",letterSpacing:2,marginBottom:10}}>SEMAINES</div>
          {/* Badges mini */}
          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
            {BADGES.map((b,i)=>(
              <div key={i} style={{fontSize:14,opacity:b.ok?1:0.2}} title={b.n}>{b.icon}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Module favori */}
      {favMod&&favCount>0&&(
        <Crd style={{marginBottom:9}}>
          <Lbl>Module préféré</Lbl>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:`${favMod.color}18`,border:`1px solid ${favMod.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{favMod.icon}</div>
            <div>
              <div style={{fontFamily:MONO,fontSize:13,fontWeight:700,letterSpacing:2,color:favMod.color}}>{favMod.label}</div>
              <div style={{fontFamily:MONO,fontSize:11,color:MUTED,marginTop:3}}>{favCount} décision{favCount>1?"s":""}</div>
            </div>
          </div>
        </Crd>
      )}

      {/* Répartition */}
      <Crd style={{marginBottom:9}}>
        <Lbl>Répartition</Lbl>
        {BASE_MODULES.map(m=>{ const c=byMod[m.id]||0; const pct=total>0?Math.round((c/total)*100):0; return(
          <div key={m.id} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>{m.icon}</span><span style={{fontFamily:MONO,fontSize:11,letterSpacing:1,color:MUTED}}>{m.label}</span></div>
              <div style={{fontFamily:MONO,fontSize:11,color:MUTED}}>{c}</div>
            </div>
            <div style={{height:3,background:CARD2,borderRadius:2}}>
              <div style={{height:"100%",width:`${pct}%`,background:m.color,borderRadius:2,transition:"width .4s"}}/>
            </div>
          </div>
        );})}
      </Crd>

      {/* Statut Club */}
      <div style={{background:`linear-gradient(135deg,${CARD2},${CARD})`,border:`1px solid ${unlocked?"rgba(48,209,88,0.2)":BORDER}`,borderRadius:16,padding:"18px",textAlign:"center"}}>
        {unlocked?(
          <>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#30D158"}}/>
              <div style={{fontFamily:MONO,fontSize:12,color:"#30D158",letterSpacing:2}}>MEMBRE CLUB ACTIF</div>
            </div>
            <div style={{fontFamily:SANS,fontSize:11,color:MUTED}}>Décisions illimitées · Modes exclusifs · Formats avancés</div>
          </>
        ):(
          <>
            <Lbl mb={10}>Passe au Club</Lbl>
            <button onClick={onPaywall} style={{background:TEXT,border:"none",borderRadius:12,color:"#000",padding:"12px 22px",fontFamily:MONO,fontSize:11,fontWeight:900,letterSpacing:3,cursor:"pointer"}}>⚡ 7 JOURS OFFERTS — 9€/MOIS</button>
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
  const [followupQueue,setFollowupQueue]=useState([]);
  const [followupIdx,setFollowupIdx]=useState(0);

  useEffect(()=>{
    const hash=window.location.hash;
    if(hash.startsWith("#s/")){
      const d=decShare(hash.slice(3));
      if(d){ setSharedData(d); setScreen("shared"); return; }
    }
    // Vérifier les suivis en attente à l'ouverture
    const h=getHistory();
    const queue=getAFollowUp(h);
    if(queue.length>0){ setFollowupQueue(queue); setFollowupIdx(0); }
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

      {/* MODAL SUIVI */}
      {followupQueue.length>0 && followupIdx<followupQueue.length && (
        <FollowupModal
          entry={followupQueue[followupIdx]}
          total={followupQueue.length}
          current={followupIdx}
          onAnswer={(rep)=>{
            saveSuivi(followupQueue[followupIdx].id, rep);
            if(followupIdx<followupQueue.length-1) setFollowupIdx(i=>i+1);
            else setFollowupQueue([]);
          }}
          onLater={()=>setFollowupQueue([])}
        />
      )}

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BORDER}`,padding:"0 18px"}}>
        <div style={{textAlign:"center",padding:"18px 0 12px"}}>
          <div style={{fontFamily:MONO,fontSize:28,fontWeight:900,color:"#FFFFFF",letterSpacing:-1,lineHeight:1}}>CUT/GO™</div>
          <div style={{fontFamily:MONO,fontSize:8,letterSpacing:6,color:"#2A2A2A",marginTop:4}}>DECISION ENGINE</div>
        </div>
        {isFormNav&&(
          <div style={{paddingBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:activeMod?.color||MUTED,fontFamily:MONO,fontSize:11,letterSpacing:2,cursor:"pointer",padding:0}}>← RETOUR</button>
            <div style={{fontFamily:MONO,fontSize:11,letterSpacing:3,color:MUTED}}>{screen==="form"?activeMod?.label:"RÉSULTAT"}</div>
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
            <button key={t.id} onClick={()=>t.id==="home"?goHome():goNav(t.id)} style={{flex:1,padding:"9px 0 11px",background:"transparent",border:"none",color:active?TEXT:MUTED,cursor:"pointer",fontFamily:MONO,fontSize:10,letterSpacing:3,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
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
