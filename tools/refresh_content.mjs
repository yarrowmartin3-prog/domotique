// tools/refresh_content.mjs
// Récupère des actus domotique (RSS) et ajoute des liens affiliés contextuels.

import Parser from "rss-parser";
import fs from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd(), ".");
const POSTS_DIR = path.join(ROOT, "posts");
const OUT_FR = path.join(POSTS_DIR, "posts_fr.json");
const OUT_EN = path.join(POSTS_DIR, "posts_en.json");

// ⬇️ Mets TON tag Amazon (ou exporte AMAZON_TAG dans le workflow)
const AMAZON_TAG = process.env.AMAZON_TAG || "TON_TAG";

const SOURCES = {
  fr: [
    "https://www.maison-et-domotique.com/feed/",
    "https://jeedom.com/blog/index.php/feed/",
    "https://blog.domadoo.fr/feed/",
    "https://www.lesnumeriques.com/rss.xml",
    "https://www.frandroid.com/feed"
  ],
  en: [
    "https://www.home-assistant.io/atom.xml",
    "https://www.techradar.com/rss/smart-home",
    "https://www.cnet.com/tech/home/rss/",
    "https://www.digitaltrends.com/home/feed/"
  ]
};

const withTag = (u) => {
  if (!AMAZON_TAG) return u;
  try {
    const x = new URL(u);
    if (!x.searchParams.get("tag")) x.searchParams.set("tag", AMAZON_TAG);
    return x.toString();
  } catch { return u; }
};
const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";
const parser = new Parser();

const summarize = (txt, n=220) => {
  const t = (txt||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
  return t.length>n ? t.slice(0,n-1)+"…" : t;
};
const toId = (s,lang) => Buffer.from((s||"")+lang).toString("base64").replace(/[^a-z0-9]/gi,"").slice(0,10) || (Date.now()+"").slice(-10);
const imgFor = (title,id) => {
  const s = (title||"").toLowerCase();
  let q = "smart home";
  if (s.includes("thermostat")) q="smart thermostat";
  else if (s.includes("samsung")) q="samsung tv living room";
  else if (s.includes("cam")) q="security camera";
  else if (s.includes("watch")||s.includes("montre")) q="smartwatch";
  else if (s.includes("solar")||s.includes("solaire")) q="home solar panels";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(q)}&sig=${id}`;
};

function suggestLinks(title="", tags=[], lang="fr"){
  const s=(title+" "+(tags||[]).join(" ")).toLowerCase();
  const has = (k)=> s.includes(k);
  if (has("samsung")||has("smartthings")||has("tv")) return [
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=samsung+smart+tv+qled")}
  ];
  if (has("thermostat")||has("ecobee")||has("nest")) return [
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=ecobee+smart+thermostat")},
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=nest+learning+thermostat")}
  ];
  if (has("camera")||has("caméra")) return [
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=reolink+camera")},
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=tp-link+tapo+camera")}
  ];
  if (has("veryfit")||has("smartwatch")||has("montre")) return [
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=veryfit+id25")},
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=garmin+forerunner+265")}
  ];
  if (has("solar")||has("solaire")||has("ev"))) return [
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=solar+panel+kit+home")},
    {label:"Amazon", url: withTag("https://www.amazon.ca/s?k=ev+charger+home")}
  ];
  return [{label:"Amazon", url: withTag("https://www.amazon.ca/s?k=smart+home")}];
}

async function fetchFeed(url, lang){
  const feed = await parser.parseURL(url);
  const items = (feed.items||[]).slice(0,8);
  const out=[];
  for(const it of items){
    const id    = toId(it.link||it.guid||it.title, lang);
    const title = (it.title||"Article").replace(/[\u0000-\u001f]/g,"");
    const date  = new Date(it.isoDate||it.pubDate||Date.now()).toISOString().slice(0,10);
    const tags  = (it.categories||[]).slice(0,5).map(x=>(""+x).toLowerCase());
    const summary = summarize(it.contentSnippet || it.summary || "", 220);
    const image   = imgFor(title, id);
    const links   = [{label: lang==="fr"?"Source":"Source", url: it.link||"#"}, ...suggestLinks(title, tags, lang)].slice(0,3);
    out.push({id,title,date,tags,image,summary,body:summary,links});
  }
  return out;
}

async function refreshLang(lang){
  let list=[];
  for(const url of SOURCES[lang]){
    try { const part = await fetchFeed(url, lang); list.push(...part); }
    catch(e){ console.warn("feed error", lang, url, e.message); }
  }
  const map=new Map();
  for(const p of list){ const k=p.id; if(!map.has(k)) map.set(k,p); }
  const final=[...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,40);
  await fs.mkdir(POSTS_DIR,{recursive:true});
  await fs.writeFile(lang==="fr"?OUT_FR:OUT_EN, JSON.stringify(final,null,2), "utf8");
  console.log("✅", lang, "→", final.length, "posts");
}

await refreshLang("fr");
await refreshLang("en");
