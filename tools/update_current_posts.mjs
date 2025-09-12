// tools/update_current_posts.mjs
// Améliore les articles existants : tags normalisés, images fiables,
// ajout CTA d'affiliation, vérifs basiques, VeryFit ID25 en dernier (montres).

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const FILES = [
  path.join(ROOT, "posts", "posts_fr.json"),
  path.join(ROOT, "posts", "posts_en.json"),
];

// ⚠️ Mets ton tag Amazon
const AMAZON_TAG = process.env.AMAZON_TAG || "TON_TAG";

// Mots-clés -> image Unsplash pertinente
function pickImage(title, id){
  const t = (title||"").toLowerCase();
  let q = "smart home";
  if (t.includes("samsung") || t.includes("smartthings") || t.includes("tv")) q="samsung tv living room";
  else if (t.includes("thermostat") || t.includes("ecobee") || t.includes("nest")) q="smart thermostat";
  else if (t.includes("cam")) q="security camera";
  else if (t.includes("watch") || t.includes("montre") || t.includes("smartwatch")) q="smartwatch";
  else if (t.includes("solar") || t.includes("solaire")) q="home solar panels";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(q)}&sig=${id||Date.now()}`;
}

function withTag(u){
  if (!u || !AMAZON_TAG) return u;
  try{
    const x = new URL(u);
    if (x.hostname.includes("amazon.") && !x.searchParams.get("tag")){
      x.searchParams.set("tag", AMAZON_TAG);
    }
    return x.toString();
  }catch{return u}
}

function uniq(a){ return Array.from(new Set(a)); }
function normTags(tags=[], lang="fr"){
  const map = { energie:"énergie", energy:"energy" };
  return uniq(tags.map(t=>(""+t).trim().toLowerCase()).map(t=>map[t]||t)).slice(0,6);
}

function ensureCta(body="", lang="fr"){
  const ctaFR = "\n\n---\n**Soutien** : certains liens sont affiliés. Merci !";
  const ctaEN = "\n\n---\n**Support**: some links are affiliate links. Thank you!";
  const cta = lang==="fr"?ctaFR:ctaEN;
  if (body.includes("**Soutien**") || body.includes("**Support**")) return body;
  return (body||"") + cta;
}

function fixLinks(links=[]){
  return (links||[]).map(l=>({
    label: l.label||"Link",
    url: withTag(l.url||"")
  })).slice(0,4);
}

function moveVeryFitLast(list, lang="fr"){
  // Si c'est un "Top montres", on met VeryFit ID25 en dernier
  const isWatch = /montre|watch/i.test(list.title||"") && /top|best|comparatif/i.test(list.title||"");
  if (!isWatch) return list;
  const vfIdx = (list.body||"").toLowerCase().indexOf("veryfit id25");
  if (vfIdx === -1) return list;

  // Simple : si le corps contient une liste numérotée, on la réécrit avec VeryFit à la fin
  const lines = (list.body||"").split("\n");
  const picks = lines.filter(x=>/^\d+\)/.test(x.trim()));
  if (picks.length >= 3){
    const others = picks.filter(x=>!x.toLowerCase().includes("veryfit id25"));
    const vf = picks.find(x=>x.toLowerCase().includes("veryfit id25"));
    const rebuilt = [...others, vf].filter(Boolean).join("\n");
    const rebuiltBody = lines.map(x=>(/^\d+\)/.test(x.trim()) ? null : x)).filter(Boolean).join("\n") + "\n" + rebuilt;
    list.body = rebuiltBody;
  }
  return list;
}

function ensureImage(p){
  if (!p.image || !/^https?:\/\//i.test(p.image)){
    p.image = pickImage(p.title, p.id);
  }
}

function ensureDate(p){
  // Si date manquante/incorrecte → aujourd'hui
  const ok = p.date && !isNaN(Date.parse(p.date));
  if (!ok) p.date = new Date().toISOString().slice(0,10);
}

function tidySummary(p, lang="fr"){
  if (!p.summary || p.summary.length < 12){
    p.summary = lang==="fr"
      ? "Aperçu, conseils et liens utiles."
      : "Overview, tips, and useful links.";
  }
  p.summary = p.summary.replace(/\s+/g," ").trim();
}

async function processFile(f){
  let arr;
  try { arr = JSON.parse(await fs.readFile(f,"utf8")); }
  catch(e){ console.error("❌ lecture", f, e.message); return; }

  const lang = f.includes("_fr.") ? "fr" : "en";
  const out = [];

  for (const p of arr){
    const post = { ...p };
    ensureDate(post);
    ensureImage(post);
    post.tags = normTags(post.tags||[], lang);
    post.links = fixLinks(post.links||[]);
    post.summary = (post.summary||"").replace(/<[^>]+>/g," ").trim();
    post.body = ensureCta((post.body||"").trim(), lang);

    // règle montres : VeryFit ID25 en dernier
    moveVeryFitLast(post, lang);

    // dédoublonnage simple par id
    if (!out.find(x=>x.id===post.id)) out.push(post);
  }

  // tri par date desc
  out.sort((a,b)=>new Date(b.date)-new Date(a.date));

  await fs.writeFile(f, JSON.stringify(out, null, 2), "utf8");
  console.log("✅ mis à jour :", f, "•", out.length, "articles");
}

for (const f of FILES) await processFile(f);
