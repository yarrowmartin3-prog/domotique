import Parser from "rss-parser"; import fs from "fs/promises"; import path from "path";
const ROOT=process.cwd(), POSTS=path.join(ROOT,"posts"), OUT_FR=path.join(POSTS,"posts_fr.json"), OUT_EN=path.join(POSTS,"posts_en.json");
const AMAZON_TAG = process.env.AMAZON_TAG || "TON_TAG";
const withTag=(u)=>{ if(!AMAZON_TAG) return u; try{const x=new URL(u); if(!x.searchParams.get("tag")) x.searchParams.set("tag",AMAZON_TAG); return x.toString();}catch{return u;} };
const SOURCES = {
  fr: ["https://www.maison-et-domotique.com/feed/","https://jeedom.com/blog/index.php/feed/","https://blog.domadoo.fr/feed/","https://www.lesnumeriques.com/rss.xml","https://www.frandroid.com/feed"],
  en: ["https://www.home-assistant.io/atom.xml","https://www.techradar.com/rss/smart-home","https://www.cnet.com/tech/home/rss/","https://www.digitaltrends.com/home/feed/"]
};
const P=new Parser();
const sum=(txt,n=220)=> (txt||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,n)+(txt&&txt.length>n?"…":"");
const img=(title,id)=>{ const s=(title||"").toLowerCase(); let q="smart home";
  if(s.includes("thermostat")) q="smart thermostat"; else if(s.includes("samsung")||s.includes("tv")) q="samsung tv living room";
  else if(s.includes("cam")) q="security camera"; else if(s.includes("watch")||s.includes("montre")) q="smartwatch"; else if(s.includes("solar")||s.includes("solaire")) q="home solar panels";
  return `https://source.unsplash.com/1280x720/?${encodeURIComponent(q)}&sig=${id}`; };
const linksFor=(title,tags,lang)=>{ const s=(title+" "+(tags||[]).join(" ")).toLowerCase();
  if(s.includes("samsung")||s.includes("tv")) return [{label:"Amazon",url:withTag("https://www.amazon.ca/s?k=samsung+smart+tv+qled")}];
  if(s.includes("thermostat")||s.includes("ecobee")||s.includes("nest")) return [
    {label:"Amazon",url:withTag("https://www.amazon.ca/s?k=ecobee+smart+thermostat")},
    {label:"Amazon",url:withTag("https://www.amazon.ca/s?k=nest+learning+thermostat")}
  ];
  if(s.includes("camera")||s.includes("caméra")) return [{label:"Amazon",url:withTag("https://www.amazon.ca/s?k=reolink+camera")}];
  if(s.includes("watch")||s.includes("montre")||s.includes("veryfit")) return [{label:"Amazon",url:withTag("https://www.amazon.ca/s?k=veryfit+id25")}];
  if(s.includes("solar")||s.includes("solaire")) return [{label:"Amazon",url:withTag("https://www.amazon.ca/s?k=solar+panel+kit+home")}];
  return [{label:"Amazon",url:withTag("https://www.amazon.ca/s?k=smart+home")}];
};
const toId=(s,lang)=> Buffer.from((s||"")+lang).toString("base64").replace(/[^a-z0-9]/gi,"").slice(0,10) || (Date.now()+"").slice(-10);

async function fetchFeed(url, lang){
  const feed = await P.parseURL(url); const items=(feed.items||[]).slice(0,8); const out=[];
  for(const it of items){
    const id=toId(it.link||it.guid||it.title, lang);
    const title=(it.title||"Article").replace(/[\u0000-\u001f]/g,"");
    const date=new Date(it.isoDate||it.pubDate||Date.now()).toISOString().slice(0,10);
    const tags=(it.categories||[]).slice(0,5).map(x=>(""+x).toLowerCase());
    const summary=sum(it.contentSnippet||it.summary||"",220);
    out.push({
      id,title,date,tags,image:img(title,id),summary,
      body: summary + (lang==="fr" ? "\n\n---\n**Soutien** : certains liens sont affiliés. Merci !" : "\n\n---\n**Support**: some links are affiliate links. Thank you!"),
      links: [{label:lang==="fr"?"Source":"Source",url:it.link||"#"}, ...linksFor(title,tags,lang)].slice(0,3)
    });
  }
  return out;
}
async function refreshLang(lang){
  const lists=[]; for(const u of SOURCES[lang]){ try{ lists.push(...await fetchFeed(u,lang)); } catch(e){ console.warn("feed",lang,"err",u,e.message); } }
  const map=new Map(); for(const p of lists){ if(!map.has(p.id)) map.set(p.id,p); }
  const final=[...map.values()].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,40);
  await fs.mkdir(POSTS,{recursive:true});
  await fs.writeFile(lang==="fr"?OUT_FR:OUT_EN, JSON.stringify(final,null,2), "utf8");
  console.log("✅", lang, "→", final.length);
}
await refreshLang("fr"); await refreshLang("en");
