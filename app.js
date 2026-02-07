const GAMES_JSON = 'games.json';
const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="%23081a25"/><text x="50%" y="50%" font-size="28" fill="%23aab9c6" text-anchor="middle" dy="8">Kein Thumbnail</text></svg>';

let games = [];

async function loadGames(){
  try{
    const res = await fetch(GAMES_JSON);
    games = await res.json();
  }catch(e){
    console.error('Fehler beim Laden von',GAMES_JSON,e);
    games = [];
  }
  renderList();
}

function renderList(){
  const container = document.getElementById('gameList');
  const q = document.getElementById('search').value.toLowerCase();
  const sort = document.getElementById('sort').value;
  let list = games.filter(g=>g.name.toLowerCase().includes(q));
  if(sort==='name-desc') list = list.sort((a,b)=>b.name.localeCompare(a.name)); else list = list.sort((a,b)=>a.name.localeCompare(b.name));

  container.innerHTML = '';
  if(list.length===0){ container.innerHTML = '<p class="muted">Keine Spiele gefunden.</p>'; return }

  list.forEach(g=>{
    const card = document.createElement('article');
    card.className='card';
    card.innerHTML = `
      <img src="${g.thumb || placeholder}" onerror="this.src='${placeholder}'" alt="${g.name} thumbnail">
      <div class="title">${escapeHtml(g.name)}</div>
      <div class="meta">${escapeHtml(g.description || '')}</div>
      <div class="actions">
        <button data-path="${g.path}">Spielen</button>
        <a href="${g.path}" target="_blank" rel="noopener">Neuer Tab</a>
      </div>
    `;

    // open on card click
    card.addEventListener('click',()=> openGame(g.path));

    container.appendChild(card);
  });

  // attach handlers with stopPropagation so anchors/buttons don't trigger card click
  container.querySelectorAll('button[data-path]').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      const path = btn.getAttribute('data-path');
      openGame(path);
    });
  });

  container.querySelectorAll('.card a').forEach(a=>{
    a.addEventListener('click',(e)=>e.stopPropagation());
  });
}

function openGame(path){
  const embed = document.getElementById('openEmbedded').checked;
  const viewer = document.getElementById('viewer');
  const frame = document.getElementById('gameFrame');
  const title = document.getElementById('viewerTitle');
  const openNewTab = document.getElementById('openNewTab');

  title.textContent = path;
  openNewTab.onclick = ()=>window.open(path,'_blank');

  if(embed){
    frame.src = path;
    // focus viewer
    viewer.scrollIntoView({behavior:'smooth'});
  } else {
    window.open(path,'_blank');
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"]+/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])) }

// controls
document.getElementById('search').addEventListener('input',renderList);
document.getElementById('sort').addEventListener('change',renderList);

document.getElementById('closeViewer').addEventListener('click',()=>{
  document.getElementById('gameFrame').src = '';
  document.getElementById('viewerTitle').textContent = 'Wähle ein Spiel';
  document.getElementById('viewer').classList.add('hidden');
});

// close viewer on Escape
document.addEventListener('keydown',(e)=>{
  if(e.key === 'Escape'){
    const viewer = document.getElementById('viewer');
    if(viewer && !viewer.classList.contains('hidden')) document.getElementById('closeViewer').click();
  }
});

// init
loadGames();
