import Parser from "rss-parser";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import TurndownService from "turndown";

const ROOT = path.resolve(process.cwd(), "..");
const POSTS_DIR = path.join(ROOT, "posts");

const SOURCES = {
  fr: [
    "https://www.maison-et-domotique.com/feed/",
    "https://laboutiquededomotique.fr/blog/feed/",
    "https://jeedom.com/blog/index.php/feed/",
    "https://blog.domadoo.fr/feed/",
    "https://la-fabrique-des-marmottes.fr/index.php/feed/",
    "https://www.lesnumeriques.com/rss.xml"
  ],
  en: [
    "https://www.home-assistant.io/atom.xml",
    "https://www.androidpolice.com/smart-home/rss/",
    "https://9to5google.com/guides/google-home/feed/",
    "https://www.theverge.com/rss/smart-home/index.xml",
    "https://www.techradar.com/rss/smart-home",
    "https://www.cnet.com/tech/home/rss/"
  ]
};

const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";

// essaie de récupérer une image depuis la page
async function pickImage(url) {
  try {
    const res = await fetch(url, { timeout: 8000 });
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ||
      html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (!m) return FALLBACK;
    const found = m[1];
    return found.startsWith("http") ? found : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

function summarize(txt, n = 200) {
  const t = (txt || "").replace(/<[^>]+>/g," ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function makeId(s, lang) {
  return Buffer.from((s || "") + lang).toString("base64").replace(/[^a-z0-9]/gi, "").slice(0, 10) || (Date.now()+"").slice(-10);
}

function toPost(item, lang) {
  const turndown = new TurndownService();
  const raw = item["content:encoded"] || item.content || item.summary || "";
  const body = summarize(turndown.turndown(raw), 600);
  const date = item.isoDate || item.pubDate || new Date().toISOString();
  const tags = (item.categories || []).slice(0, 3).map((x) => ("" + x).toLowerCase());

  return {
    id: makeId(item.link || item.guid || item.title, lang),
    title: (item.title || "Article").replace(/[\u0000-\u001f]/g, ""),
    date: new Date(date).toISOString().slice(0, 10),
    tags: tags.length ? tags : ["domotique"],
    image: null, // rempli après
    summary: summarize(item.contentSnippet || item.summary || body, 220),
    body: body,
    links: item.link ? [{ label: lang==="fr"?"Source":"Source", url: item.link }] : []
  };
}

async function fetchFeed(url, lang) {
  const parser = new Parser();
  const feed = await parser.parseURL(url);
  const posts = await Promise.all(
    (feed.items || []).slice(0, 4).map(async (it) => {
      const p = toPost(it, lang);
      p.image = await pickImage(it.link || "");
      return p;
    })
  );
  return posts;
}

async function refreshLang(lang) {
  const list = [];
  for (const url of SOURCES[lang]) {
    try {
      const chunk = await fetchFeed(url, lang);
      list.push(...chunk);
    } catch (e) {
      console.warn(`[${lang}] feed error:`, url, e.message);
    }
  }
  const map = new Map();
  list.forEach((p) => map.set(p.id, p));
  const final = [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 15);
  await fs.mkdir(POSTS_DIR, { recursive: true });
  const out = path.join(POSTS_DIR, lang === "fr" ? "posts_fr.json" : "posts_en.json");
  await fs.writeFile(out, JSON.stringify(final, null, 2), "utf8");
  console.log(`✅ ${lang} → ${final.length} posts → ${out}`);
}

async function main() {
  await refreshLang("fr");
  await refreshLang("en");
}
main().catch((e) => { console.error(e); process.exit(1); });
