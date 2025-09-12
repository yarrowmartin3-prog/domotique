import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const FILES = [path.join(ROOT, "posts", "posts_fr.json"), path.join(ROOT, "posts", "posts_en.json")];
const AMAZON_TAG = process.env.AMAZON_TAG || "TON_TAG";

function withTag(u){
  if (!u || !AMAZON_TAG) return u;
  try { const x = new URL(u); if (x.hostname.includes("amazon.") && !x.searchParams.get("tag")) x.searchParams.set("tag", AMAZON_TAG); return x.toString(); }
  catch { return u; }
}
function uniq(a){ return Array.from(new Set(a)); }
function normTags(tags=[], lang="fr"){
  const map = { energie:"énergie", energy:"energy" };
  return uniq(tags.map(t=>(""+t).trim().toLowerCase()).map(t=>map[t]||t)).slice(0,6);
}
function ensureDate(p){ const ok = p.date && !isNaN(Date.parse(p.date)); if (!ok) p.date = new Date().toISOString().slice(0,10); }
function pickImage(title, id){
  const t = (title||"").toLowerCase(); let q="smart home";
  if (t.includes("samsung")||t.includes("smartthings")||t.includes("tv")) q="samsung tv living room";
  else if (t.includes("thermostat")||t.includes("ecobee")||t.includes("nest")) q="smart thermostat";
  else if (t.includes("cam")) q="security camera";
  else if (t.includes("watch")||t.includes("montre")||t.includes("smartwatch")) q="smartwatch";
  else if (t.includes("solar")||t.includes("solaire")) q="home solar panels";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(q)}&sig=${id||Date.now()}`;
}
function ensureImage(p){ if (!p.image || !/^https?:\/\//i.test(p.image)) p.image = pickImage(p.title, p.id); }
function ensureCta(body="", lang="fr"){
  const ctaFR = "\n\n---\n**Soutien** : certains liens sont affiliés. Merci !";
  const ctaEN = "\n\n---\n**Support**: some links are affiliate links. Thank you!";
  const cta = lang==="fr"?ctaFR:ctaEN;
  return (body.includes("**Soutien**")||body.includes("**Support**")) ? body : (body||"")+cta;
}
function fixLinks(links=[]){ return (links||[]).map(l=>({label:l.label||"Link", url:withTag(l.url||"")})).slice(0,4); }
function moveVeryFitLast(p){
  if (!/montre|watch/i.test(p.title||"") || !/top|best|comparatif/i.test(p.title||"")) return;
  const hasVF = (p.body||"").toLowerCase().includes("veryfit id25");
  if (!hasVF) return;
  const lines = (p.body||"").split("\n");
  const picks = lines.filter(x=>/^\d+\)/.test(x.trim()));
  if (picks.length>=3){
    const others = picks.filter(x=>!x.toLowerCase().includes("veryfit id25"));
    const vf = picks.find(x=>x.toLowerCase().includes("veryfit id25"));
    const rebuilt = [...others, vf].filter(Boolean).join("\n");
    p.body = lines.map(x=>/^\d+\)/.test(x.trim())?null:x).filter(Boolean).join("\n") + "\n" + rebuilt;
  }
}
async function processFile(f){
  let arr=[]; try{ arr=JSON.parse(await fs.readFile(f,"utf8")); } catch{ /* ignore */ }
  const lang = f.includes("_fr.") ? "fr" : "en";
  const out=[];
  for (const p of arr){
    const q={...p};
    ensureDate(q); ensureImage(q);
    q.tags = normTags(q.tags||[], lang);
    q.summary = (q.summary||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim() || (lang==="fr"?"Aperçu, conseils et liens.":"Overview, tips and links.");
    q.body = ensureCta((q.body||"").trim(), lang);
    q.links = fixLinks(q.links||[]);
    moveVeryFitLast(q);
    if (!out.find(x=>x.id===q.id)) out.push(q);
  }
  out.sort((a,b)=>new Date(b.date)-new Date(a.date));
  await fs.mkdir(path.dirname(f), {recursive:true});
  await fs.writeFile(f, JSON.stringify(out, null, 2), "utf8");
  console.log("✅", f, "→", out.length, "posts");
}
for (const f of FILES) await processFile(f);
