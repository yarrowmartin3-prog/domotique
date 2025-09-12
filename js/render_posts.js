(async function () {
  const FEED = document.getElementById('feed');
  const TAGSEL = document.getElementById('tagFilter');
  const SEARCH = document.getElementById('search');
  const BTN_THEME = document.getElementById('switchTheme');
  const cfg = window.DM_CFG || { POSTS_URL: "./posts/posts.json", TEXTS:{} };
  const t = (k,d)=> (cfg.TEXTS && cfg.TEXTS[k]) || d;
  const fmtDate = s => { try { return new Date(s).toLocaleDateString(document.documentElement.lang||'en-CA'); } catch { return s; } };

  // Icônes inline (pour garder tes boutons de partage)
  const ICONS = {
    twitter:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M22 5.8c-.7.3-1.4.5-2.1.6c.8-.5 1.3-1.1 1.6-2c-.8.5-1.7.9-2.6 1.1A3.7 3.7 0 0 0 12.6 8c0 .3 0 .6.1.9A10.5 10.5 0 0 1 3 5.2a3.7 3.7 0 0 0 1.1 4.9c-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7c-.3.1-.6.1-.9.1c-.2 0-.4 0-.6-.1c.4 1.4 1.8 2.5 3.4 2.5A7.5 7.5 0 0 1 2 18.5c-.3 0-.6 0-.8 0A10.6 10.6 0 0 0 7.7 20c6.9 0 10.7-5.8 10.7-10.7v-.5c.7-.5 1.3-1.1 1.8-1.8z"/></svg>',
    facebook:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M13 22v-8h3l.5-4H13V8.1c0-1.1.3-1.9 2-1.9h1.7V2.6C16.4 2.4 15.3 2 14 2c-3 0-5 1.8-5 5.2V10H6v4h3v8z"/></svg>',
    linkedin:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M6 9h3v12H6zM7.5 3A1.8 1.8 0 1 0 7.5 6.6 1.8 1.8 0 0 0 7.5 3zM10.5 9H13v1.6h.1c.4-.7 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V21h-3v-5.3c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-3z"/></svg>',
    link:'<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M10 14a5 5 0 0 1 0-7.1l2.1-2.1a5 5 0 1 1 7.1 7.1l-1.2 1.2l-1.4-1.4l1.2-1.2a3 3 0 0 0-4.2-4.2L11.5 8a3 3 0 0 0 0 4.2l.3.3L10 14Zm4 6l-2.1 2.1a5 5 0 0 1-7.1-7.1L6 13.8l1.4 1.4l-1.2 1.2a3 3 0 0 0 4.2 4.2L12.5 18a3 3 0 0 0 0-4.2l-.3-.3L14 12a5 5 0 0 1 0 7.1Z"/></svg>'
  };

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
    if(!posts.length){ FEED.innerHTML=`<p style="padding:16px;color:#666">${t('noContent','No content')}</p>`; return; }
    const q=SEARCH.value.trim(), tag=TAGSEL.value||"";
    const filtered=posts.filter(p=>match(p,q,tag));
    if(!filtered.length){ FEED.innerHTML=`<p style="padding:16px;color:#666">${t('noResult','No result')}</p>`; return; }

    const tmpl=document.getElementById('card-tmpl');
    filtered.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0)).forEach(p=>{
      const node=tmpl.content.cloneNode(true);
      const cardEl = node.querySelector('.card');            // on capte la carte
      const img=node.querySelector('.thumb');
      const title=node.querySelector('.title');
      const meta=node.querySelector('.meta');
      const sum=node.querySelector('.summary');
      const links=node.querySelector('.links');

      // image + texte
      img.src=p.image||''; img.alt=p.title||'';
      img.loading="lazy"; img.decoding="async";
      title.textContent=p.title||'';
      meta.textContent=[fmtDate(p.date||''),(p.tags||[]).join(' • ')].filter(Boolean).join(' — ');
      sum.textContent=p.summary||'';

      // liens fournis (externes)
      (p.links||[]).forEach(l=>{
        const a=document.createElement('a');
        a.href=l.url; a.textContent=l.label||'Lien';
        a.target="_blank"; a.rel="noopener";
        links.appendChild(a);
      });

      // --- Partage avec icônes ---
      const shareWrap=document.createElement('div');
      shareWrap.className="share-buttons";
      const baseURL = window.location.href.split('#')[0];
      const url = encodeURIComponent(baseURL + (baseURL.includes('?') ? '&' : '?') + 'utm_source=social&utm_medium=share_buttons&utm_campaign=card');
      const text=encodeURIComponent(p.title);

      function btn(html,label,href,isBtn=false,cb=null){
        const el=isBtn?document.createElement('button'):document.createElement('a');
        el.className='share-btn'; el.setAttribute('aria-label',label); el.innerHTML=html+'<span>'+label+'</span>';
        if(isBtn){ el.type='button'; el.onclick=cb; } else { el.href=href; el.target="_blank"; el.rel="noopener"; }
        return el;
      }
      const tw = btn(ICONS.twitter,'Twitter',`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
      const fb = btn(ICONS.facebook,'Facebook',`https://www.facebook.com/sharer/sharer.php?u=${url}`);
      const li = btn(ICONS.linkedin,'LinkedIn',`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`);
      const cp = btn(ICONS.link,document.documentElement.lang==='fr'?'Copier':'Copy link','#',true,async()=>{ await navigator.clipboard.writeText(baseURL); alert(document.documentElement.lang==='fr'?'Lien copié !':'Link copied!'); });
      shareWrap.append(tw,fb,li,cp);
      links.appendChild(shareWrap);

      // --- Navigation vers page article sur clic carte ---
      cardEl.dataset.id = p.id;
      cardEl.classList.add('clickable');
      cardEl.addEventListener('click', (ev)=>{
        // ne pas intercepter le clic si c'est un vrai lien/bouton
        if(ev.target.closest('a,button')) return;
        const lang = document.documentElement.lang || 'en';
        const target = (lang==='fr') ? `./post.html?id=${encodeURIComponent(p.id)}` : `./post.html?id=${encodeURIComponent(p.id)}`;
        window.location.href = target;
      });

      FEED.appendChild(node);
    });
  }

  // Thème
  BTN_THEME?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dm_theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
  if(localStorage.getItem('dm_theme')==='dark') document.documentElement.classList.add('dark');

  // Load
  let POSTS=[];
  try{ POSTS=await loadPosts(); buildTags(POSTS); render(POSTS); }
  catch(e){ FEED.innerHTML=`<p style="padding:16px;color:#b00">${e.message}</p>`; }

  TAGSEL.addEventListener('change',()=>render(POSTS));
  SEARCH.addEventListener('input',()=>render(POSTS));
})();
