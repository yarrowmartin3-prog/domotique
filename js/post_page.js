// js/post_page.js
(function(){
  const cfg = window.DM_POST_CFG || { POSTS_URL:"./posts/posts_fr.json", LABELS:{notFound:"Introuvable",meta:"Publié"}, LANG_SWITCH:"" };
  const main = document.getElementById('post');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const toDate = s => { try { return new Date(s).toLocaleDateString(document.documentElement.lang||'fr-CA'); } catch { return s; } };
  const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";

  fetch(cfg.POSTS_URL, { cache:"no-store" }).then(r=>r.json()).then(list=>{
    const p = (Array.isArray(list)?list:[]).find(x=>x.id===id);
    if(!p){ main.innerHTML = "<div class='main-wrap'><p class='muted'>"+cfg.LABELS.notFound+"</p></div>"; return; }
    const langSwitch = cfg.LANG_SWITCH ? cfg.LANG_SWITCH + encodeURIComponent(p.id) : "#";
    main.innerHTML = `
      <article class="post main-wrap">
        <div class="back" style="margin:10px 0 6px"><a href="../">← Home</a></div>
        <h1>${p.title||""}</h1>
        <div class="post-meta">${cfg.LABELS.meta}: ${toDate(p.date)} • ${(p.tags||[]).join(" • ")}</div>
        <img class="post-hero" alt="" src="${(p.image||FALLBACK)}" referrerpolicy="no-referrer" loading="lazy" decoding="async"/>
        <div class="post-body">${(p.body||"").replace(/\n/g,"<br/>")}</div>
        <div class="post-links">${(p.links||[]).map(l=>`<a class="btn" target="_blank" rel="noopener sponsored" href="${l.url}">${l.label||"Link"}</a>`).join(" ")}</div>
      </article>`;
    const sw = document.getElementById('switchLang'); if(sw) sw.href = langSwitch;
  }).catch(e=>{
    main.innerHTML = "<div class='main-wrap'><p class='error'>"+e.message+"</p></div>";
  });
})();
