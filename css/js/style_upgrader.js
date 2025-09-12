// Apply "pro" skin + accent switcher
(() => {
  const html = document.documentElement;
  const ACCENTS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'];
  function setAccent(c){ document.documentElement.style.setProperty('--accent', c); localStorage.setItem('dm_accent', c); }
  function mountUI(){
    const holder = document.createElement('div');
    holder.style.cssText = "position:fixed;right:12px;bottom:12px;display:flex;gap:8px;z-index:9999";
    ACCENTS.forEach(c=>{
      const b=document.createElement('button');
      b.title=`Accent ${c}`;
      b.style.cssText=`width:22px;height:22px;border-radius:999px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.2);background:${c}`;
      b.onclick=()=>setAccent(c);
      holder.appendChild(b);
    });
    document.body.appendChild(holder);
  }
  // add header gradient class if .site-header exists
  const header = document.querySelector('.site-header');
  if(header) header.classList.add('header-gradient');

  // sticky toolbar if present
  const tb = document.querySelector('.toolbar');
  if(tb) tb.classList.add('sticky-toolbar');

  // restore accent
  const saved = localStorage.getItem('dm_accent'); if(saved) setAccent(saved);
  mountUI();
})();
