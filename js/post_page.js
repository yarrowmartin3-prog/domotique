(async function(){
  const el = document.getElementById('post');
  const cfg = window.DM_POST_CFG || {};
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";

  function md(s){
    const html = (s||'').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').split('\n').map(p=>p.trim()).filter(Boolean).map(p=>`<p>${p}</p>`).join('');
    return html || '<p></p>';
  }

  function imgTag(src, alt){
    const safe = (src && src.startsWith('http')) ? src : FALLBACK;
    return `<img class="post-hero" src="${safe}" alt="${alt||''}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK}'">`;
  }

  async function getPosts(){
    const res = await fetch(cfg.POSTS_URL, {cache:'no-store'});
    if(!res.ok) throw new Error('load');
    const data = await res.json();
    return Array.isArray(data)?data:[];
  }

  try{
    const posts = await getPosts();
    const p = posts.find(x=>String(x.id)===String(id));
    if(!p){
      el.innerHTML = `<p class="error">${(cfg.LABELS&&cfg.LABELS.notFound)||'Not found'}</p>`;
      return;
    }
    document.title = `${p.title} — ${document.documentElement.lang==='fr'?'Domotique':'Home Automation'}`;

    const metaLabel = (cfg.LABELS&&cfg.LABELS.meta)||'Published';
    const backHref = document.documentElement.lang==='fr'?'./':'../';
    const sw = document.getElementById('switchLang');
    if(sw && cfg.LANG_SWITCH){ sw.href = cfg.LANG_SWITCH + encodeURIComponent(p.id); }

    el.innerHTML = `
      <article class="post">
        <h1>${p.title||''}</h1>
        <p class="post-meta">${metaLabel} ${new Date(p.date||'').toLocaleDateString(document.documentElement.lang||'en-CA')} — ${(p.tags||[]).join(' • ')}</p>
        ${imgTag(p.image, p.title)}
        <div class="post-body">${md(p.body||p.summary||'')}</div>
        ${(p.links&&p.links.length)?`<div class="post-links">${p.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener sponsored">${l.label||'Lien'}</a>`).join(' ')}</div>`:''}
        <p class="back"><a href="${backHref}">← ${document.documentElement.lang==='fr'?'Retour':'Back'}</a></p>
      </article>
    `;
  }catch(e){
    el.innerHTML = `<p class="error">Erreur de chargement.</p>`;
  }
})();
