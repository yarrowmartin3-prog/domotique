(async function () {
  const FEED = document.getElementById('feed');
  const TAGSEL = document.getElementById('tagFilter');
  const SEARCH = document.getElementById('search');
  const BTN_THEME = document.getElementById('switchTheme');
  const cfg = window.DM_CFG || { POSTS_URL: "./posts/posts.json", TEXTS:{} };

  const t = (k, d) => (cfg.TEXTS && cfg.TEXTS[k]) || d;

  const fmtDate = s => { try { return new Date(s).toLocaleDateString('fr-CA'); } catch { return s; } };

  async function loadPosts(){
    const res = await fetch(cfg.POSTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Impossible de charger posts.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  function buildTags(posts){
    const all = new Set();
    posts.forEach(p => (p.tags||[]).forEach(t => all.add(t)));
    TAGSEL.innerHTML = '<option value="">Tous les tags</option>' +
      [...all].sort().map(x => `<option value="${x}">${x}</option>`).join('');
  }

  function match(p,q,tag){
    const hay = [p.title,p.summary,p.body,...(p.tags||[])].join(" ").toLowerCase();
    const okQ = !q || hay.includes(q.toLowerCase());
    const okT = !tag || (p.tags||[]).includes(tag);
    return okQ && okT;
  }

  function render(posts){
    FEED.innerHTML = "";
    if (!posts.length){ FEED.innerHTML = `<p style="padding:16px;color:#666">${t('noContent','No content')}</p>`; return; }
    const q = SEARCH.value.trim(); const tag = TAGSEL.value || "";
    const filtered = posts.filter(p => match(p,q,tag));
    if (!filtered.length){ FEED.innerHTML = `<p style="padding:16px;color:#666">${t('noResult','No result')}</p>`; return; }

    const tmpl = document.getElementById('card-tmpl');
    filtered.sort((a,b)=> new Date(b.date||0)-new Date(a.date||0)).forEach(p=>{
      const node = tmpl.content.cloneNode(true);
      const img = node.querySelector('.thumb');
      const title = node.querySelector('.title');
      const meta = node.querySelector('.meta');
      const sum = node.querySelector('.summary');
      const links = node.querySelector('.links');

      img.src = p.image || ''; img.alt = p.title || '';
      title.textContent = p.title || 'Sans titre';
      meta.textContent = [fmtDate(p.date||''),(p.tags||[]).join(' • ')].filter(Boolean).join(' — ');
      sum.textContent = p.summary || '';
      (p.links||[]).forEach(l=>{
        const a = document.createElement('a'); a.href=l.url; a.textContent=l.label||'Lien'; a.target="_blank"; a.rel="noopener"; links.appendChild(a);
      });
      FEED.appendChild(node);
    });
  }

  // Thème
  BTN_THEME?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('dm_theme', document.documentElement.classList.contains('dark')?'dark':'light');
  });
  if (localStorage.getItem('dm_theme')==='dark') document.documentElement.classList.add('dark');

  // Go
  let POSTS=[];
  try{ POSTS = await loadPosts(); buildTags(POSTS); render(POSTS); }
  catch(e){ FEED.innerHTML = `<p style="padding:16px;color:#b00">${e.message}</p>`; }

  TAGSEL.addEventListener('change', ()=>render(POSTS));
  SEARCH.addEventListener('input', ()=>render(POSTS));
})();
