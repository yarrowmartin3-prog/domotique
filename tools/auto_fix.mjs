// tools/auto_fix.mjs
// Répare automatiquement les erreurs courantes du site.
// - Crée les fichiers et dossiers manquants (pages FR/EN, js, css, posts).
// - Patch les HTML (éléments requis, classes, liens FR/EN, BuyMeACoffee).
// - Valide/corrige posts JSON (structure array, dates, images, liens Amazon tag).
// - Ajoute la classe `page-article` aux pages article.
// - S'assure que la toolbar ne recouvre pas le contenu (CSS déjà prévu).

import fs from "fs/promises";
import path from "path";

const ROOT = process.cwd();
const AMAZON_TAG = process.env.AMAZON_TAG || "TON_TAG";

const FILES_CONTENT = {
  "index.html": `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Domotique — Guides & Astuces</title>
<link rel="stylesheet" href="./css/theme.css"/><link rel="stylesheet" href="./css/pro.css"/>
</head><body>
<nav class="topnav"><a class="brand" href="./">🏠 Domotique</a><div class="spacer"></div><a class="navlink" href="./">FR</a><a class="navlink" href="./en/">EN</a></nav>
<header class="header-gradient"><div class="main-wrap"><h1>Domotique — Guides & Astuces</h1><p class="muted">Comparatifs & avis — IA</p><p class="muted" style="font-size:14px">Transparence : certains liens sont affiliés.</p></div></header>
<section class="toolbar"><div class="main-wrap" style="display:flex;gap:12px">
<input id="search" type="search" placeholder="Rechercher…" aria-label="Recherche"/><select id="tagFilter"><option value="">Tous les tags</option></select>
</div></section>
<main class="main-wrap"><section id="feed" class="feed" aria-live="polite"></section>
<template id="card-tmpl"><article class="card"><img class="thumb" alt="" loading="lazy" decoding="async"/><div class="card-body"><h3 class="title"></h3><p class="meta"></p><p class="summary"></p><div class="links"></div></div></article></template>
</main>
<footer class="main-wrap footer"><small class="muted">© Domotique — FR</small><a class="btn-bmc" href="https://www.buymeacoffee.com/yarrowmart9" target="_blank" rel="noopener">☕ Offrez-moi un café</a></footer>
<script>window.DM_CFG={POSTS_URL:"./posts/posts_fr.json",TEXTS:{noContent:"Aucun contenu.",noResult:"Aucun résultat."}};</script>
<script src="./js/render_posts.js"></script>
</body></html>`,
  "en/index.html": `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Home Automation — Guides & Tips</title>
<link rel="stylesheet" href="../css/theme.css"/><link rel="stylesheet" href="../css/pro.css"/>
</head><body>
<nav class="topnav"><a class="brand" href="../">🏠 Home</a><div class="spacer"></div><a class="navlink" href="../">FR</a><a class="navlink" href="./">EN</a></nav>
<header class="header-gradient"><div class="main-wrap"><h1>Home Automation — Guides & Tips</h1><p class="muted">Comparisons & reviews — AI-assisted</p><p class="muted" style="font-size:14px">Disclosure: some links are affiliate links.</p></div></header>
<section class="toolbar"><div class="main-wrap" style="display:flex;gap:12px">
<input id="search" type="search" placeholder="Search…" aria-label="Search"/><select id="tagFilter"><option value="">All tags</option></select>
</div></section>
<main class="main-wrap"><section id="feed" class="feed" aria-live="polite"></section>
<template id="card-tmpl"><article class="card"><img class="thumb" alt="" loading="lazy" decoding="async"/><div class="card-body"><h3 class="title"></h3><p class="meta"></p><p class="summary"></p><div class="links"></div></div></article></template>
</main>
<footer class="main-wrap footer"><small class="muted">© Home Automation — EN</small><a class="btn-bmc" href="https://www.buymeacoffee.com/yarrowmart9" target="_blank" rel="noopener">☕ Buy me a coffee</a></footer>
<script>window.DM_CFG={POSTS_URL:"../posts/posts_en.json",TEXTS:{noContent:"No content yet.",noResult:"No result."}};</script>
<script src="../js/render_posts.js"></script>
</body></html>`,
  "post.html": `<!doctype html><html lang="fr"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Article — Domotique</title>
<link rel="stylesheet" href="./css/theme.css"/><link rel="stylesheet" href="./css/pro.css"/>
</head><body class="page-article">
<nav class="topnav"><a class="brand" href="./">🏠 Accueil</a><div class="spacer"></div><a class="navlink" href="./">FR</a><a class="navlink" id="switchLang" href="./en/post.html?id=">EN</a></nav>
<main id="post" class="post-container"></main>
<div class="main-wrap" style="padding:0 16px 24px;display:flex;justify-content:flex-end"><a class="btn-bmc" href="https://www.buymeacoffee.com/yarrowmart9" target="_blank" rel="noopener">☕ Offrez-moi un café</a></div>
<script>window.DM_POST_CFG={POSTS_URL:"./posts/posts_fr.json",LABELS:{notFound:"Article introuvable",meta:"Publié le"},LANG_SWITCH:"./en/post.html?id="};</script>
<script src="./js/post_page.js"></script></body></html>`,
  "en/post.html": `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Article — Home Automation</title>
<link rel="stylesheet" href="../css/theme.css"/><link rel="stylesheet" href="../css/pro.css"/>
</head><body class="page-article">
<nav class="topnav"><a class="brand" href="../">🏠 Home</a><div class="spacer"></div><a class="navlink" id="switchLang" href="../post.html?id=">FR</a><a class="navlink" href="./">EN</a></nav>
<main id="post" class="post-container"></main>
<div class="main-wrap" style="padding:0 16px 24px;display:flex;justify-content:flex-end"><a class="btn-bmc" href="https://www.buymeacoffee.com/yarrowmart9" target="_blank" rel="noopener">☕ Buy me a coffee</a></div>
<script>window.DM_POST_CFG={POSTS_URL:"../posts/posts_en.json",LABELS:{notFound:"Article not found",meta:"Published"},LANG_SWITCH:"../post.html?id="};</script>
<script src="../js/post_page.js"></script></body></html>`
};

async function ensureDir(d){ await fs.mkdir(d,{recursive:true}); }
async function ensureFile(rel, content){
  const p = path.join(ROOT, rel);
  try { await fs.stat(p); }
  catch { await ensureDir(path.dirname(p)); await fs.writeFile(p, content, "utf8"); console.log("🆕 créé:", rel); }
}

async function patchHtmlNeedles(rel, needles){
  const p = path.join(ROOT, rel);
  let html = "";
  try { html = await fs.readFile(p,"utf8"); } catch { return; }
  let changed = false;

  // Ajoute toolbar si absente
  if (rel.endsWith("index.html")){
    if (!/id="search"/.test(html) || !/id="tagFilter"/.test(html)){
      const toolbar = `<section class="toolbar"><div class="main-wrap" style="display:flex;gap:12px">
  <input id="search" type="search" placeholder="${rel.startsWith('en/')?'Search…':'Rechercher…'}" aria-label="${rel.startsWith('en/')?'Search':'Recherche'}"/>
  <select id="tagFilter"><option value="">${rel.startsWith('en/')?'All tags':'Tous les tags'}</option></select>
</div></section>`;
      html = html.replace(/<\/header>/i, m => m + "\n" + toolbar);
      changed = true;
    }
    if (!/render_posts\.js/.test(html)){
      html = html.replace(/<\/body>\s*<\/html>/i, `<script src="${rel.startsWith('en/')?'../':'./'}js/render_posts.js"></script></body></html>`);
      changed = true;
    }
  }

  // Classe page-article
  if (rel.endsWith("post.html") && !/class="page-article"/.test(html)){
    html = html.replace(/<body([^>]*)>/i, `<body$1 class="page-article">`);
    changed = true;
  }

  // Lien BuyMeACoffee minimal
  if (!/buymeacoffee\.com\/yarrowmart9/i.test(html)){
    const btn = `<a class="btn-bmc" href="https://www.buymeacoffee.com/yarrowmart9" target="_blank" rel="noopener">☕ ${rel.startsWith('en/')?'Buy me a coffee':'Offrez-moi un café'}</a>`;
    if (/<\/footer>/.test(html)) {
      html = html.replace(/<\/footer>/i, (m)=> btn + m);
      changed = true;
    }
  }

  // Aiguillage FR/EN
  if (rel === "index.html" && !/href="\.\.\/en\/"/.test(html)){
    html = html.replace(/<nav[^>]*>.*?<\/nav>/s, `<nav class="topnav"><a class="brand" href="./">🏠 Domotique</a><div class="spacer"></div><a class="navlink" href="./">FR</a><a class="navlink" href="./en/">EN</a></nav>`);
    changed = true;
  }
  if (rel === "en/index.html" && !/href="\.\.\//.test(html)){
    html = html.replace(/<nav[^>]*>.*?<\/nav>/s, `<nav class="topnav"><a class="brand" href="../">🏠 Home</a><div class="spacer"></div><a class="navlink" href="../">FR</a><a class="navlink" href="./">EN</a></nav>`);
    changed = true;
  }

  // Aiguillage langue sur post
  if (rel === "post.html" && !/id="switchLang"/.test(html)){
    html = html.replace(/<\/nav>/, '</nav>'.replace(/$/, ''));
    html = html.replace(/<\/nav>/, '</nav>');
    changed = true;
  }

  // Vérifie aiguillage script post_page.js
  if (rel.endsWith("post.html") && !/post_page\.js/.test(html)){
    html = html.replace(/<\/body>\s*<\/html>/i, `<script src="${rel.startsWith('en/')?'../':'./'}js/post_page.js"></script></body></html>`);
    changed = true;
  }

  // Injecte .toolbar si pas là ET on a header
  if (/header-gradient/.test(html) && !/class="toolbar"/.test(html) && rel.endsWith("index.html")){
    html = html.replace(/<\/header>/i, `</header>
<section class="toolbar"><div class="main-wrap" style="display:flex;gap:12px">
  <input id="search" type="search" placeholder="${rel.startsWith('en/')?'Search…':'Rechercher…'}" aria-label="${rel.startsWith('en/')?'Search':'Recherche'}"/>
  <select id="tagFilter"><option value="">${rel.startsWith('en/')?'All tags':'Tous les tags'}</option></select>
</div></section>`);
    changed = true;
  }

  // Enregistre si modifié
  if (changed) {
    await fs.writeFile(p, html, "utf8");
    console.log("🛠 patch:", rel);
  }
}

function withTag(u){
  if (!u || !AMAZON_TAG) return u;
  try { const x = new URL(u); if (x.hostname.includes("amazon.") && !x.searchParams.get("tag")) x.searchParams.set("tag", AMAZON_TAG); return x.toString(); }
  catch { return u; }
}
function isUrl(u){ return /^https?:\/\//i.test(u||""); }
function today(){ return new Date().toISOString().slice(0,10); }
function imgFor(p){
  const t=(p.title||"").toLowerCase();
  let q="smart home";
  if(t.includes("samsung")||t.includes("smartthings")||t.includes("tv")) q="samsung tv living room";
  else if(t.includes("thermostat")||t.includes("ecobee")||t.includes("nest")) q="smart thermostat";
  else if(t.includes("watch")||t.includes("montre")) q="smartwatch";
  else if(t.includes("solar")||t.includes("solaire")) q="home solar panels";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(q)}&sig=${p.id||Date.now()}`;
}
function ensureCta(p, lang){
  const has = /Soutien|Support/.test(p.body||"");
  if (has) return p.body;
  return (p.body||"") + (lang==="fr" ? `\n\n---\n**Soutien** : certains liens sont affiliés. Merci !` : `\n\n---\n**Support**: some links are affiliate links. Thank you!`);
}

async function fixPostsJson(rel){
  const p = path.join(ROOT, rel);
  await fs.mkdir(path.dirname(p), {recursive:true});
  let raw="[]";
  try { raw = await fs.readFile(p,"utf8"); }
  catch { await fs.writeFile(p,"[]","utf8"); console.log("🆕 créé:", rel); }

  let arr=[];
  try { const v = JSON.parse(raw); arr = Array.isArray(v)?v:[]; }
  catch { arr = []; }

  let changed=false;
  const lang = rel.includes("_fr.") ? "fr" : "en";
  const ids=new Set();

  arr = arr.filter(x=>x && typeof x==="object");

  for (const post of arr){
    if (!post.id){ post.id = Math.random().toString(36).slice(2,10); changed=true; }
    if (ids.has(post.id)){ post.id = post.id + "_" + Math.random().toString(36).slice(2,4); changed=true; }
    ids.add(post.id);

    if (!post.title){ post.title = lang==="fr" ? "Article" : "Article"; changed=true; }
    if (!post.date || isNaN(Date.parse(post.date))){ post.date = today(); changed=true; }
    if (!post.summary || post.summary.length<8){ post.summary = lang==="fr"?"Aperçu, conseils et liens.":"Overview, tips and links."; changed=true; }
    if (!post.image || !isUrl(post.image)){ post.image = imgFor(post); changed=true; }
    if (!Array.isArray(post.links)) { post.links = []; changed=true; }
    post.links = post.links.map(l=>({label:l.label||"Link", url:withTag(l.url||"")})); // tag Amazon
    // Assure CTA
    const newBody = ensureCta(post, lang);
    if (newBody !== post.body){ post.body = newBody; changed=true; }
  }

  // écrit si changé
  if (changed){
    // tri par date desc
    arr.sort((a,b)=>new Date(b.date)-new Date(a.date));
    await fs.writeFile(p, JSON.stringify(arr,null,2), "utf8");
    console.log("🛠 patch:", rel);
  }
}

async function ensureBaseFiles(){
  // Dossiers
  await ensureDir(path.join(ROOT,"en"));
  await ensureDir(path.join(ROOT,"js"));
  await ensureDir(path.join(ROOT,"css"));
  await ensureDir(path.join(ROOT,"posts"));

  // Pages minimales si manquantes
  for (const [rel, content] of Object.entries(FILES_CONTENT)){
    await ensureFile(rel, content);
  }

  // JS requis
  await ensureFile("js/render_posts.js", `/* placeholder — sera fourni par ton dépôt */`);
  await ensureFile("js/post_page.js", `/* placeholder — sera fourni par ton dépôt */`);

  // CSS thème si manquant (version courte qui résout la toolbar)
  await ensureFile("css/theme.css",
`:root{--bg:#0b1220;--text:#e7ecf3;--muted:#99a3b3;--card:#0f172a;--border:#22304a;--accent:#2563eb;--accent-2:#22c55e}
:root:not(.dark){--bg:#f8fafc;--text:#0b1220;--muted:#5b6474;--card:#fff;--border:#e5e7eb}
html,body{margin:0;padding:0}body{background:var(--bg);color:var(--text);font:16px/1.6 system-ui,Segoe UI,Roboto,Arial}
a{color:inherit;text-decoration:none}img{max-width:100%;display:block;height:auto}
.main-wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.topnav{position:sticky;top:0;z-index:100;display:flex;gap:12px;align-items:center;padding:12px 16px;background:var(--bg);border-bottom:1px solid var(--border)}
.brand{font-weight:900}.spacer{flex:1}.navlink{padding:6px 10px;border-radius:10px;color:var(--muted);font-weight:700}
.header-gradient{background:linear-gradient(180deg,rgba(37,99,235,.06),transparent 60%);padding:24px 16px 10px}
.toolbar{position:sticky;top:60px;z-index:50;background:var(--bg);padding:12px 16px;border-bottom:1px solid var(--border)}
.feed{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;padding:16px}
.card{grid-column:span 12;background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;gap:12px;padding:12px;cursor:pointer}
@media(min-width:720px){.card{grid-column:span 6}}@media(min-width:1024px){.card{grid-column:span 4}}
.thumb{width:118px;height:118px;object-fit:cover;border-radius:12px;background:#e5e7eb}
.title{font-size:18px;font-weight:900;line-height:1.3}.meta{color:var(--muted);font-size:14px}.summary{font-size:15px}
.btn{display:inline-block;padding:6px 10px;border:1px solid var(--border);border-radius:10px}.btn:hover{background:rgba(37,99,235,.08)}
.btn-bmc{display:inline-block;padding:10px 14px;border-radius:12px;background:var(--accent-2);color:#fff;font-weight:900}
.post-container{max-width:860px;margin:24px auto;padding:0 16px}.post-hero{width:100%;border-radius:14px;margin:10px 0 16px}.post-meta{color:var(--muted);margin:6px 0 12px}
.page-article{padding-top:64px}.page-article.has-toolbar{padding-top:120px}
.footer{padding:24px 0;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.muted{color:var(--muted)}.error{color:#dc2626;padding:16px}
`);
  await ensureFile("css/pro.css", "/* customisations */");

  // Posts json si vides
  await ensureFile("posts/posts_fr.json", "[]");
  await ensureFile("posts/posts_en.json", "[]");
}

async function main(){
  await ensureBaseFiles();

  // Patch HTML requis
  const pages = ["index.html","en/index.html","post.html","en/post.html"];
  for (const f of pages){
    await patchHtmlNeedles(f, []);
  }

  // Répare JSON
  await fixPostsJson("posts/posts_fr.json");
  await fixPostsJson("posts/posts_en.json");

  console.log("✅ auto-fix terminé");
}

main().catch(e=>{ console.error("❌ auto-fix:", e); process.exit(1); });
