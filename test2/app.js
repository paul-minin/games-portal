// Einfacher Cookie Clicker mit localStorage
const countEl = document.getElementById('count');
const cpsEl = document.getElementById('cps');
const cookieBtn = document.getElementById('cookie');
const buyAutoBtn = document.getElementById('buyAuto');
const resetBtn = document.getElementById('reset');
const autoCostEl = document.getElementById('autoCost');

let state = {
  cookies: 0,
  cps: 0,
  autoCount: 0,
  autoCost: 50
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem('cc_state'));
    if (s) state = Object.assign(state, s);
  } catch (e) { console.warn('load error', e); }
}

function save() {
  localStorage.setItem('cc_state', JSON.stringify(state));
}

function updateUI() {
  countEl.textContent = Math.floor(state.cookies);
  cpsEl.textContent = state.cps;
  autoCostEl.textContent = state.autoCost;
}

cookieBtn.addEventListener('click', () => {
  state.cookies += 1;
  updateUI();
  save();
});

buyAutoBtn.addEventListener('click', () => {
  if (state.cookies >= state.autoCost) {
    state.cookies -= state.autoCost;
    state.autoCount += 1;
    state.cps += 1;
    state.autoCost = Math.ceil(state.autoCost * 1.8);
    updateUI();
    save();
  } else {
    alert('Nicht genug Cookies!');
  }
});

resetBtn.addEventListener('click', () => {
  if (confirm('Reset?')) {
    state = { cookies:0, cps:0, autoCount:0, autoCost:50 };
    save(); updateUI();
  }
});

// Auto-click per second
setInterval(() => {
  state.cookies += state.cps;
  updateUI();
  save();
}, 1000);

// Initial
load(); updateUI();

// keyboard: Leertaste click
window.addEventListener('keyup', (e) => { if (e.code === 'Space') cookieBtn.click(); });