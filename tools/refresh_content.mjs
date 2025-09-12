import Parser from "rss-parser";
import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import TurndownService from "turndown";

const ROOT = path.resolve(process.cwd(), "..");
const POSTS_DIR = path.join(ROOT, "posts");

// 👉 mets ton tag Amazon ici (ex: "monetage-20"). Laisse "" si tu n'en as pas encore.
const AMAZON_TAG = "TON_TAG";

// ==== RSS SOURCES ====
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

// ==== Images (mots-clés élargis) ====
const IMAGE_KEYWORDS = {
  fr: {
    "zigbee": ["zigbee device", "smart bulb", "smart home light"],
    "éclairage": ["home lighting", "ambient light", "smart lamp"],
    "sécurité": ["home security camera", "smart lock", "door camera"],
    "caméra": ["security camera", "outdoor camera"],
    "énergie": ["smart meter", "energy monitor", "electric meter"],
    "suivi": ["power monitor", "home energy"],
    "chauffage": ["thermostat smart", "hvac system", "radiator thermostat"],
    "thermostat": ["smart thermostat", "nest thermostat", "hvac control"],
    "panneau solaire": ["solar panel home", "solar roof", "renewable energy"],
    "volet": ["smart shutter", "automated blinds", "window blinds"],
    "prise": ["smart plug", "zigbee plug"],
    "home assistant": ["home assistant dashboard", "raspberry pi home"],
    "matter": ["smart home matter", "smart hub"],
    "z-wave": ["z-wave hub", "smart switch"],
    "air": ["air quality sensor", "co2 monitor", "smart purifier"]
  },
  en: {
    "zigbee": ["zigbee device", "smart bulb", "smart home light"],
    "lighting": ["home lighting", "ambient light", "smart lamp"],
    "security": ["home security camera", "smart lock", "door camera"],
    "camera": ["security camera", "outdoor camera"],
    "energy": ["smart meter", "energy monitor", "electric meter"],
    "tracking": ["power monitor", "home energy"],
    "heating": ["smart thermostat", "hvac system", "radiator thermostat"],
    "thermostat": ["smart thermostat", "nest thermostat", "hvac control"],
    "solar": ["solar panel home", "solar roof", "renewable energy"],
    "blinds": ["smart blinds", "automated shutters", "window blinds"],
    "plug": ["smart plug", "zigbee plug"],
    "home assistant": ["home assistant dashboard", "raspberry pi home"],
    "matter": ["smart home matter", "smart hub"],
    "z-wave": ["z-wave hub", "smart switch"],
    "air": ["air quality sensor", "co2 monitor", "smart purifier"]
  }
};

const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";

// ➜ NEW: liens affiliés par thématique
function withAmazonTag(url) {
  if (!AMAZON_TAG) return url;
  const u = new URL(url);
  // Si un tag existe déjà, on ne double pas
  if (!u.searchParams.get("tag")) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

// Map de liens par mots-clés (FR/EN). On renverra 1–2 liens pertinents.
const AFFILIATE_LINKS = {
  fr: {
    "zigbee": [
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+bulb"),
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+smart+plug")
    ],
    "caméra": [
      () => withAmazonTag("https://www.amazon.ca/s?k=reolink+camera"),
      () => "https://www.bestbuy.ca/en-ca/search?search=ip+camera"
    ],
    "sécurité": [
      () => withAmazonTag("https://www.amazon.ca/s?k=tp-link+tapo+camera"),
      () => "https://www.aliexpress.com/wholesale?SearchText=ip+camera"
    ],
    "énergie": [
      () => withAmazonTag("https://www.amazon.ca/s?k=Shelly+EM"),
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+energy+monitor+plug")
    ],
    "thermostat": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+thermostat+nest"),
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+thermostat+ecobee")
    ],
    "volet": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+blind"),
      () => "https://www.aliexpress.com/wholesale?SearchText=smart+roller+shades"
    ],
    "prise": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+plug+zigbee"),
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+plug+matter")
    ]
  },
  en: {
    "zigbee": [
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+bulb"),
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+smart+plug")
    ],
    "camera": [
      () => withAmazonTag("https://www.amazon.ca/s?k=reolink+camera"),
      () => "https://www.bestbuy.ca/en-ca/search?search=ip+camera"
    ],
    "security": [
      () => withAmazonTag("https://www.amazon.ca/s?k=tapo+camera"),
      () => "https://www.aliexpress.com/wholesale?SearchText=ip+camera"
    ],
    "energy": [
      () => withAmazonTag("https://www.amazon.ca/s?k=Shelly+EM"),
      () => withAmazonTag("https://www.amazon.ca/s?k=zigbee+energy+monitor+plug")
    ],
    "thermostat": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+thermostat+nest"),
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+thermostat+ecobee")
    ],
    "blinds": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+blinds"),
      () => "https://www.aliexpress.com/wholesale?SearchText=smart+roller+shades"
    ],
    "plug": [
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+plug+zigbee"),
      () => withAmazonTag("https://www.amazon.ca/s?k=smart+plug+matter")
    ]
  }
};

function affiliateForTags(tags = [], lang = "fr") {
  const out = [];
  const map = AFFILIATE_LINKS[lang] || {};
  for (const t of (tags || [])) {
    const key = (t || "").toLowerCase();
    const fns = map[key];
    if (fns && out.length < 2) {
      for (const fn of fns) {
        try {
          out.push(fn());
          if (out.length >= 2) break;
        } catch {}
      }
    }
    if (out.length >= 2) break;
  }
  // fallback : si rien trouvé, proposer une recherche générique
  if (!out.length) {
    out.push(withAmazonTag("https://www.amazon.ca/s?k=smart+home"));
  }
  return out.slice(0, 2).map((url) => String(url));
}

// ==== Images helpers ====
function unsplashByKeywords(keywords = [], id = "1") {
  const q = encodeURIComponent((keywords[0] || "smart home"));
  return `https://source.unsplash.com/1280x720/?${q}&sig=${encodeURIComponent(id)}`;
}
async function pickImageFromPage(url) {
  try {
    const res = await fetch(url, { timeout: 8000 });
    const html = await res.text();
    const og =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)/i);
    if (og) {
      const src = og[1];
      if (src && /^https?:\/\//i.test(src)) return src;
    }
    const img = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (img) {
      const src = img[1];
      if (src && /^https?:\/\//i.test(src)) return src;
    }
    return null;
  } catch {
    return null;
  }
}
function keywordsForImage(tags = [], title = "", lang = "fr") {
  const dict = IMAGE_KEYWORDS[lang] || {};
  const bag = [];
  (tags || []).forEach(t => { const k=(t||"").toLowerCase(); if (dict[k]) bag.push(...dict[k]); });
  if (!bag.length) {
    const t = (title || "").toLowerCase();
    if (t.includes("zigbee")) bag.push(...(dict["zigbee"] || []));
    else if (t.includes("camera") || t.includes("caméra")) bag.push(...(dict["caméra"] || dict["camera"] || []));
    else if (t.includes("énergie") || t.includes("energy")) bag.push(...(dict["énergie"] || dict["energy"] || []));
    else if (t.includes("éclairage") || t.includes("lighting")) bag.push(...(dict["éclairage"] || dict["lighting"] || []));
    else bag.push("smart home");
  }
  return [...new Set(bag)].slice(0, 3);
}

function summarize(txt, n = 220) {
  const t = (txt || "").replace(/<[^>]+>/g," ").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}
function makeId(s, lang) {
  return Buffer.from((s || "") + lang).toString("base64").replace(/[^a-z0-9]/gi, "").slice(0, 10) || (Date.now()+"").slice(-10);
}

const td = new TurndownService();

function toPost(item, lang) {
  const raw = item["content:encoded"] || item.content || item.summary || "";
  const body = summarize(td.turndown(raw), 600);
  const date = item.isoDate || item.pubDate || new Date().toISOString();
  const tags = (item.categories || []).slice(0, 3).map((x) => ("" + x).toLowerCase());

  return {
    id: makeId(item.link || item.guid || item.title, lang),
    title: (item.title || "Article").replace(/[\u0000-\u001f]/g, ""),
    date: new Date(date).toISOString().slice(0, 10),
    tags: tags.length ? tags : ["domotique"],
    image: null,
    summary: summarize(item.contentSnippet || item.summary || body, 220),
    body: body,
    links: item.link ? [{ label: lang==="fr"?"Source":"Source", url: item.link }] : []
  };
}

async function hydrateImage(post, sourceUrl, lang) {
  const pageImg = sourceUrl ? await pickImageFromPage(sourceUrl) : null;
  if (pageImg) { post.image = pageImg; return post; }
  const kws = keywordsForImage(post.tags, post.title, lang);
  post.image = unsplashByKeywords(kws, post.id);
  return post;
}

function labelFor(url, lang) {
  const L = (lang==="fr");
  if (url.includes("amazon")) return L ? "Amazon" : "Amazon";
  if (url.includes("bestbuy")) return L ? "BestBuy" : "BestBuy";
  if (url.includes("aliexpress")) return L ? "AliExpress" : "AliExpress";
  return L ? "Boutique" : "Shop";
}

async function fetchFeed(url, lang) {
  const parser = new Parser();
  const feed = await parser.parseURL(url);
  const posts = await Promise.all(
    (feed.items || []).slice(0, 4).map(async (it) => {
      const p = toPost(it, lang);
      await hydrateImage(p, it.link, lang);

      // ➜ NEW: ajouter 1–2 liens affiliés pertinents par tags
      const affiliates = affiliateForTags(p.tags, lang);
      p.links = [
        ...(p.links || []),
        ...affiliates.map(u => ({ label: labelFor(u, lang), url: u }))
      ].slice(0, 3); // Source + 2 liens max

      // Assurer variété Unsplash
      if (p.image && p.image.includes("source.unsplash.com/")) {
        const [base, qs] = p.image.split("?");
        const params = new URLSearchParams(qs || "");
        params.set("sig", p.id);
        p.image = `${base}?${params.toString()}`;
      }
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
