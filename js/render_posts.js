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
    if(!posts.length){
      FEED.innerHTML=`<p style="padding:16px;color:#666">${t('noContent','No content')}</p>`;
      return;
    }
    const q=SEARCH.value.trim(), tag=TAGSEL.value||"";
    const filtered=posts.filter(p=>match(p,q,tag));
    if(!filtered.length){
      FEED.innerHTML=`<p style="padding:16px;color:#666">${t('noResult','No result')}</p>`;
      return;
    }

    const tmpl=document.getElementById('card-tmpl');
    filtered.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).forEach(p=>{
      const node=tmpl.content.cloneNode(true);
      const img=node.querySelector('.thumb'),
            title=node.querySelector('.title'),
            meta=node.querySelector('.meta'),
            sum=node.querySelector('.summary'),
            links=node.querySelector('.links');

      // image + texte
      img.src=p.image||''; img.alt=p.title||'';
      img.loading="lazy"; img.decoding="async";
      title.textContent=p.title||'';
      meta.textContent=[fmtDate(p.date||''),(p.tags||[]).join(' • ')].filter(Boolean).join(' — ');
      sum.textContent=p.summary||'';

      // liens fournis
      (p.links||[]).forEach(l=>{
        const a=document.createElement('a');
        a.href=l.url; a.textContent=l.label||'Lien';
        a.target="_blank"; a.rel="noopener";
        links.appendChild(a);
      });

      // --- Boutons de partage ---
      const shareWrap=document.createElement('div');
      shareWrap.className="share-buttons";

      const url=encodeURIComponent(window.location.href);
      const text=encodeURIComponent(p.title);

      const tw=document.createElement('a');
      tw.href=`https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      tw.textContent="Twitter";
      tw.target="_blank"; tw.rel="noopener";

      const fb=document.createElement('a');
      fb.href=`https://www.facebook.com/sharer/sharer.php?u=${url}`;
      fb.textContent="Facebook";
      fb.target="_blank"; fb.rel="noopener";

      const li=document.createElement('a');
      li.href=`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
      li.textContent="LinkedIn";
      li.target="_blank"; li.rel="noopener";

      const cp=document.createElement('button');
      cp.textContent="Copier le lien";
      cp.onclick=async()=>{ await navigator.clipboard.writeText(window.location.href); alert("Lien copié !"); };

      shareWrap.appendChild(tw);
      shareWrap.appendChild(document.createTextNode(" • "));
      shareWrap.appendChild(fb);
      shareWrap.appendChild(document.createTextNode(" • "));
      shareWrap.appendChild(li);
      shareWrap.appendChild(document.createTextNode(" • "));
      shareWrap.appendChild(cp);

      links.appendChild(shareWrap);

      FEED.appendChild(node);
    });
  }

  // Thème clair/sombre
  BTN_THEME?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dm_theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
  if(localStorage.getItem('dm_theme')==='dark')
    document.documentElement.classList.add('dark');

  // Charger
  let POSTS=[];
  try{ POSTS=await loadPosts(); buildTags(POSTS); render(POSTS); }
  catch(e){ FEED.innerHTML=`<p style="padding:16px;color:#b00">${e.message}</p>`; }

  TAGSEL.addEventListener('change',()=>render(POSTS));
  SEARCH.addEventListener('input',()=>render(POSTS));
})();
