(async function () {
  const FEED = document.getElementById('feed');
  const TAGSEL = document.getElementById('tagFilter');
  const SEARCH = document.getElementById('search');
  const BTN_THEME = document.getElementById('switchTheme');
  const cfg = window.DM_CFG || { POSTS_URL: "./posts/posts.json", TEXTS:{} };
  const t = (k,d)=> (cfg.TEXTS && cfg.TEXTS[k]) || d;
  const fmtDate = s => { try { return new Date(s).toLocaleDateString(document.documentElement.lang||'en-CA'); } catch { return s; } };

  async function loadPosts(){
    const res = await fetch(cfg.POSTS_URL, { cache:"no-store" });
    if(!res.ok) throw new Error("Failed to load posts.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  function buildTags(posts){
    const all=new Set();
    posts.forEach(p=>(p.tags||[]).forEach(x=>all.add(x)));
    const labelAll = document.documentElement.lang==='fr'?'Tous les tags':'All tags';
    TAGSEL.innerHTML = `<option value="">${labelAll}</option>` + [...all].sort().map(x=>`<option value="${x}">${x}</option>`).join('');
  }

  function match(p,q,tag){
    const hay=[p.title,p.summary,p.body,...(p.tags||[])].join(" ").toLowerCase();
    return (!q||hay.includes(q.toLowerCase())) && (!tag||(p.tags||[]).includes(tag));
  }

  function render(posts){
    FEED.innerHTML="";
    if(!posts.length){ FEED.innerHTML=`<p class="muted">${t('noContent','No content')}</p>`; return; }
    const q=SEARCH.value.trim(), tag=TAGSEL.value||"";
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

      img.src=p.image||''; img.alt=p.title||''; img.loading="lazy";
      title.textContent=p.title||'';
      meta.textContent=[fmtDate(p.date||''),(p.tags||[]).join(' • ')].filter(Boolean).join(' — ');
      sum.textContent=p.summary||'';

      // bouton “Lire l’article / Read article”
      const isFR = document.documentElement.lang === 'fr';
      const read = document.createElement('a');
      read.className='btn-read';
      read.textContent=isFR?'Lire l’article':'Read article';
      read.href = (isFR? './post.html' : '../post.html') + `?id=${encodeURIComponent(p.id)}`;
      links.appendChild(read);

      // clic sur carte (sauf liens)
      card.classList.add('clickable');
      card.addEventListener('click',(e)=>{
        if(e.target.closest('a,button')) return;
        window.location.href = read.href;
      });

      FEED.appendChild(node);
    });
  }

  BTN_THEME?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dm_theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
  if(localStorage.getItem('dm_theme')==='dark') document.documentElement.classList.add('dark');

  let POSTS=[];
  try{ POSTS=await loadPosts(); buildTags(POSTS); render(POSTS); }
  catch(e){ console.error(e); FEED.innerHTML=`<p class="error">Erreur: ${e.message}</p>`; }

  TAGSEL.addEventListener('change',()=>render(POSTS));
  SEARCH.addEventListener('input',()=>render(POSTS));
})();
