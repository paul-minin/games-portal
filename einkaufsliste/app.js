const STORAGE_KEY = 'einkaufsliste_data';

let data = { lists: {}, order: [] };
let currentListId = null;

// DOM
const listsEl = document.getElementById('lists');
const itemsEl = document.getElementById('items');
const currentListNameEl = document.getElementById('currentListName');
const newListNameInput = document.getElementById('newListName');
const addListBtn = document.getElementById('addListBtn');
const newItemInput = document.getElementById('newItemInput');
const addItemBtn = document.getElementById('addItemBtn');
const renameListBtn = document.getElementById('renameListBtn');
const deleteListBtn = document.getElementById('deleteListBtn');

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ data = JSON.parse(raw) }catch(e){ console.error('fehler beim parsen', e) }
  }
  if(data.order.length === 0){
    // Beispiel-Liste anlegen
    const id = idGen();
    data.lists[id] = { name: 'Wocheneinkauf', items: [ {id:idGen(), text:'Milch', done:false}, {id:idGen(), text:'Brot', done:false} ] };
    data.order.push(id);
    currentListId = id;
    saveData();
  } else {
    currentListId = currentListId || data.order[0];
  }
}

function idGen(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

function renderLists(){
  listsEl.innerHTML = '';
  data.order.forEach(id => {
    const list = data.lists[id];
    const li = document.createElement('li');
    li.dataset.id = id;
    li.className = (id === currentListId) ? 'active' : '';
    li.innerHTML = `<span>${escapeHtml(list.name)} <span class="count">(${list.items.length})</span></span>`;
    li.addEventListener('click', ()=>{ currentListId = id; render(); });
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Liste löschen';
    delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); deleteList(id); });
    li.appendChild(delBtn);
    listsEl.appendChild(li);
  });
}

function renderItems(){
  itemsEl.innerHTML = '';
  if(!currentListId){ currentListNameEl.textContent = 'Keine Liste'; return }
  const list = data.lists[currentListId];
  currentListNameEl.textContent = list.name;
  list.items.forEach(item => {
    const li = document.createElement('li');
    li.className = item.done ? 'done' : '';
    const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = item.done;
    cb.addEventListener('change', ()=>{ toggleItem(item.id); });
    const span = document.createElement('span'); span.className='text'; span.textContent = item.text;
    const del = document.createElement('button'); del.textContent = 'Löschen'; del.addEventListener('click', ()=>{ deleteItem(item.id); });
    li.appendChild(cb); li.appendChild(span); li.appendChild(del);
    itemsEl.appendChild(li);
  });
}

function render(){ renderLists(); renderItems(); }

function addList(){
  const name = newListNameInput.value.trim();
  if(!name) return;
  const id = idGen();
  data.lists[id] = { name, items: [] };
  data.order.push(id);
  newListNameInput.value = '';
  currentListId = id;
  saveData();
  render();
}

function deleteList(id){
  if(!confirm('Liste wirklich löschen?')) return;
  delete data.lists[id];
  data.order = data.order.filter(x => x !== id);
  if(currentListId === id) currentListId = data.order[0] || null;
  saveData(); render();
}

function renameList(){
  if(!currentListId) return; const list = data.lists[currentListId];
  const name = prompt('Neuer Name', list.name); if(!name) return;
  list.name = name.trim(); saveData(); render();
}

function addItem(){
  if(!currentListId) return alert('Wähle zuerst eine Liste aus.');
  const text = newItemInput.value.trim(); if(!text) return;
  const list = data.lists[currentListId];
  list.items.push({ id: idGen(), text, done:false });
  newItemInput.value = '';
  saveData(); render();
}

function deleteItem(itemId){
  const list = data.lists[currentListId];
  list.items = list.items.filter(i => i.id !== itemId);
  saveData(); render();
}

function toggleItem(itemId){
  const list = data.lists[currentListId];
  const it = list.items.find(i => i.id === itemId);
  if(!it) return; it.done = !it.done; saveData(); render();
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// Events
addListBtn.addEventListener('click', addList);
newListNameInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addList(); });
addItemBtn.addEventListener('click', addItem);
newItemInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addItem(); });
renameListBtn.addEventListener('click', renameList);
deleteListBtn.addEventListener('click', ()=>{ if(currentListId) deleteList(currentListId); });

// Install prompt (PWA)
// `beforeinstallprompt` wird auf Android/Chrome ausgelöst
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-block';
});
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch(e) {}
    deferredPrompt = null;
  });
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(() => console.log('Service Worker registered')).catch((e)=>console.warn('SW registration failed', e));
  });
}

// init
loadData(); render();