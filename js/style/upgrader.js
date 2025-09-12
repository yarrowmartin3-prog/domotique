// style_upgrader.js
(function(){
  const html = document.documentElement;
  const key = 'dm_theme';

  // Appliquer choix mémorisé
  const saved = localStorage.getItem(key);
  if(saved==='dark') html.classList.add('dark');
  if(saved==='light') html.classList.remove('dark');

  // Bouton toggle
  const btn = document.getElementById('switchTheme');
  if(btn){
    btn.addEventListener('click', ()=>{
      const isDark = html.classList.toggle('dark');
      localStorage.setItem(key, isDark?'dark':'light');
    });
  }

  // Souligner lien courant
  document.querySelectorAll('.topnav .navlink').forEach(a=>{
    const here = location.pathname.replace(/\/index\.html?$/,'/');
    const href = new URL(a.getAttribute('href'), location.origin + here).pathname;
    if(href===here){ a.style.color='var(--text)'; a.style.fontWeight='800'; }
  });

  // Effet nav scroll
  let lastY = window.scrollY;
  const nav = document.querySelector('.topnav');
  if(nav){
    window.addEventListener('scroll', ()=>{
      const y = window.scrollY;
      nav.style.transform = (y>lastY && y>42)?'translateY(-60%)':'translateY(0)';
      lastY=y;
    }, {passive:true});
  }
})();
