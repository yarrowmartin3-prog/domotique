// js/render_posts.js
(async function () {
  const FEED = document.getElementById('feed');
  const TAGSEL = document.getElementById('tagFilter');
  const SEARCH = document.getElementById('search');
  const BTN_THEME = document.getElementById('switchTheme');
  const cfg = window.DM_CFG || { POSTS_URL: "./posts/posts_fr.json", TEXTS:{} };
  const t = (k,d)=> (cfg.TEXTS && cfg.TEXTS[k]) || d;
  const FALLBACK = "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=1200&auto=format&fit=crop&q=70";
  const fmtDate = s => { try { return new Date(s).toLocaleDateString(document.documentElement.lang||'fr-CA'); } catch { return s; } };
  const norm = s => (s||"").toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim();

  async function loadPosts(){
    const res = await fetch(cfg.POSTS_URL, { cache:"no-store" });
    if(!res.ok) throw new Error("Failed to load posts.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  function buildTags(posts){
    const all=new Set(); posts.forEach(p=>(p.tags||[]).forEach(x=>all.add(x)));
    const labelAll = document.documentElement.lang==='fr'?'Tous les tags':'All tags';
    if(TAGSEL){ TAGSEL.innerHTML = `<option value="">${labelAll}</option>` + [...all].sort().map(x=>`<option value="${x}">${x}</option>`).join(''); }
  }
  function match(p,q,tag){
    const hay = norm([p.title,p.summary,p.body,...(p.tags||[])].join(" "));
    const qq = norm(q||"");
    const okQ = !qq || hay.includes(qq);
    const okT = !tag || (p.tags||[]).includes(tag);
    return okQ && okT;
  }
  function fixImage(el, url){
    el.referrerPolicy = "no-referrer"; el.loading="lazy"; el.decoding="async";
    el.src = (url && /^https?:\/\//i.test(url)) ? url : FALLBACK;
    el.onerror = ()=> { el.onerror=null; el.src=FALLBACK; };
  }
  function render(posts){
    FEED.innerHTML="";
    if(!posts.length){ FEED.innerHTML=`<p class="muted">${t('noContent','No content')}</p>`; return; }
    const q=SEARCH?.value?.trim()||"", tag=TAGSEL?.value||"";
    const filtered=posts.filter(p=>match(p,q,tag));
    if(!filtered.length){ FEED.innerHTML=`<p class="muted">${t('noResult','No result')}</p>`; return; }
    const tmpl=document.getElementById('card-tmpl');
    filtered.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).forEach(p=>{
      const node=tmpl.content.cloneNode(true);
      const card=node.querySelector('.card');
      const img=node.querySelector('.thumb');
      const title=node.querySelector('.title');
      const meta=node.querySelector('.meta');
      const sum=node.querySelector('.summary');
      const links=node.querySelector('.links');
      fixImage(img, p.image); title.textContent=p.title||'';
      meta.textContent=[fmtDate(p.date||''),(p.tags||[]).join(' • ')].filter(Boolean).join(' — ');
      sum.textContent=p.summary||'';
      const isFR = document.documentElement.lang === 'fr';
      const read = document.createElement('a');
      read.className='btn'; read.textContent=isFR?'Lire l’article':'Read article';
      read.href = (isFR? './post.html' : '../post.html') + `?id=${encodeURIComponent(p.id)}`;
      read.rel="noopener"; links.appendChild(read);
      (p.links||[]).slice(0,1).forEach(l=>{
        const a=document.createElement('a'); a.className='btn'; a.href=l.url; a.target='_blank'; a.rel='noopener sponsored';
        a.textContent=(isFR?'Voir':'View')+' • '+(l.label||'Link'); links.appendChild(a);
      });
      card.addEventListener('click',(e)=>{ if(e.target.closest('a,button')) return; window.location.href = read.href; });
      FEED.appendChild(node);
    });
  }
  BTN_THEME?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dm_theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
  if(localStorage.getItem('dm_theme')==='dark') document.documentElement.classList.add('dark');

  let POSTS=[]; try{ POSTS=await loadPosts(); buildTags(POSTS); render(POSTS); }
  catch(e){ console.error(e); FEED.innerHTML=`<p class="error">Erreur: ${e.message}</p>`; }
  const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
  const rerender=debounce(()=>render(POSTS),120);
  TAGSEL?.addEventListener('change',rerender);
  SEARCH?.addEventListener('input',rerender);
})();
