(async function(){
  const cfg = window.DM_POST_CFG || { POSTS_URL:"./posts/posts.json", LABELS:{notFound:"Not found", meta:"Published"} };
  const wrap = document.getElementById('post');
  const titleEl = document.getElementById('post-title');

  const qs = new URLSearchParams(location.search);
  const id = qs.get('id');

  function fmtDate(s){
    try{ return new Date(s).toLocaleDateString(document.documentElement.lang||'en-CA'); }
    catch{ return s; }
  }

  async function loadPosts(){
    const res = await fetch(cfg.POSTS_URL, { cache: "no-store" });
    if(!res.ok) throw new Error('Failed to load posts');
    const json = await res.json();
    return Array.isArray(json)? json : [];
  }

  let posts = [];
  try { posts = await loadPosts(); }
  catch(e){ wrap.innerHTML = `<p style="color:#b00">${e.message}</p>`; return; }

  const p = posts.find(x => String(x.id) === String(id));
  if(!p){
    wrap.innerHTML = `<p style="padding:16px;color:#666">${cfg.LABELS.notFound}</p>`;
    return;
  }

  // Titre & métas
  document.title = (p.title || 'Article') + ' — Domotique';
  titleEl.textContent = p.title || 'Article';

  const metaLine = [cfg.LABELS.meta + ' ' + fmtDate(p.date||''), (p.tags||[]).join(' • ')].filter(Boolean).join(' — ');

  // HTML principal
  const html = `
    <article class="post-full card" style="grid-template-columns:1fr">
      ${p.image ? `<img src="${p.image}" alt="${p.title||''}" style="width:100%;height:auto;border-radius:12px;"/>` : ''}
      <div class="card-body">
        <p class="meta">${metaLine}</p>
        <div class="summary" style="white-space:pre-wrap">${(p.body||p.summary||'').trim()}</div>
        <div class="links" style="margin-top:12px;"></div>
      </div>
    </article>
  `;
  wrap.innerHTML = html;

  // Liens externes éventuels
  const links = wrap.querySelector('.links');
  (p.links||[]).forEach(l=>{
    const a=document.createElement('a');
    a.href=l.url; a.textContent=l.label||'Lien'; a.target="_blank"; a.rel="noopener";
    links.appendChild(a);
  });

  // Partage (icônes inline, même style que la liste)
  const ICONS={
    twitter:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M22 5.8c-.7.3-1.4.5-2.1.6c.8-.5 1.3-1.1 1.6-2c-.8.5-1.7.9-2.6 1.1A3.7 3.7 0 0 0 12.6 8c0 .3 0 .6.1.9A10.5 10.5 0 0 1 3 5.2a3.7 3.7 0 0 0 1.1 4.9c-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7c-.3.1-.6.1-.9.1c-.2 0-.4 0-.6-.1c.4 1.4 1.8 2.5 3.4 2.5A7.5 7.5 0 0 1 2 18.5c-.3 0-.6 0-.8 0A10.6 10.6 0 0 0 7.7 20c6.9 0 10.7-5.8 10.7-10.7v-.5c.7-.5 1.3-1.1 1.8-1.8z"/></svg>',
    facebook:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M13 22v-8h3l.5-4H13V8.1c0-1.1.3-1.9 2-1.9h1.7V2.6C16.4 2.4 15.3 2 14 2c-3 0-5 1.8-5 5.2V10H6v4h3v8z"/></svg>',
    linkedin:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M6 9h3v12H6zM7.5 3A1.8 1.8 0 1 0 7.5 6.6 1.8 1.8 0 0 0 7.5 3zM10.5 9H13v1.6h.1c.4-.7 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8V21h-3v-5.3c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V21h-3z"/></svg>',
    link:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M10 14a5 5 0 0 1 0-7.1l2.1-2.1a5 5 0 1 1 7.1 7.1l-1.2 1.2l-1.4-1.4l1.2-1.2a3 3 0 0 0-4.2-4.2L11.5 8a3 3 0 0 0 0 4.2l.3.3L10 14Zm4 6l-2.1 2.1a5 5 0 0 1-7.1-7.1L6 13.8l1.4 1.4l-1.2 1.2a3 3 0 0 0 4.2 4.2L12.5 18a3 3 0 0 0 0-4.2l-.3-.3L14 12a5 5 0 0 1 0 7.1Z"/></svg>'
  };

  const share = document.createElement('div');
  share.className = 'share-buttons';
  const baseURL = location.href.split('#')[0];
  const url = encodeURIComponent(baseURL + (baseURL.includes('?') ? '&' : '?') + 'utm_source=social&utm_medium=share_buttons&utm_campaign=post');
  const text = encodeURIComponent(p.title||'');

  function icon(svg,label,href,isBtn=false,cb=null){
    const el=isBtn?document.createElement('button'):document.createElement('a');
    el.className='share-btn';
    el.setAttribute('aria-label',label);
    el.innerHTML=svg+'<span>'+label+'</span>';
    if(isBtn){ el.type='button'; el.onclick=cb; } else { el.href=href; el.target="_blank"; el.rel="noopener"; }
    return el;
  }

  share.append(
    icon(ICONS.twitter,'Twitter',`https://twitter.com/intent/tweet?url=${url}&text=${text}`),
    icon(ICONS.facebook,'Facebook',`https://www.facebook.com/sharer/sharer.php?u=${url}`),
    icon(ICONS.linkedin,'LinkedIn',`https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`),
    icon(ICONS.link,'Copier','#',true, async()=>{ await navigator.clipboard.writeText(baseURL); alert('Lien copié !'); })
  );
  links.appendChild(share);

  // (facultatif) injecter dynamiquement un JSON-LD Article plus riche
  try{
    const ld = {
      "@context":"https://schema.org",
      "@type":"Article",
      "headline": p.title || "Article",
      "inLanguage": "fr",
      "datePublished": p.date || "",
      "image": p.image || "",
      "author": { "@type":"Person", "name":"yarrowmartin3-prog" },
      "mainEntityOfPage": baseURL
    };
    const s = document.createElement('script');
    s.type="application/ld+json";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }catch{}
})();
