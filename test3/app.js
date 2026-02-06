// Einfaches Canvas-Spiel: Sterne fangen
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start');
const restartBtn = document.getElementById('restart');
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');

let W=0,H=0, last=0;
function resize(){
  W = canvas.width = canvas.clientWidth * devicePixelRatio;
  H = canvas.height = canvas.clientHeight * devicePixelRatio;
}
window.addEventListener('resize', resize);
resize();

// Spieler
const player = {x:0,y:0,r:25*devicePixelRatio,speed:8*devicePixelRatio};
function resetPlayer(){player.x = W/2; player.y = H - 80*devicePixelRatio}
resetPlayer();

// Spielzustand
let stars = [];
let score = 0;
let lives = 3;
let running = false;
let spawnRate = 800; // ms
let lastSpawn = 0;
let leftDown=false, rightDown=false;
let pointerId = null;

function spawnStar(){
  const size = (8 + Math.random()*18) * devicePixelRatio;
  stars.push({x: Math.random()*(W-2*size)+size, y: -size, vy: (1.2+Math.random()*1.6)*devicePixelRatio, r:size});
}

function start(){
  score = 0; lives = 3; stars = []; spawnRate=800; running = true; overlay.style.display='none'; restartBtn.style.display='none'; resetPlayer();
}

function gameOver(){
  running = false; overlay.style.display='flex'; restartBtn.style.display='inline-block'; document.getElementById('title').textContent = 'Game Over — Punkte: '+score;
}

// Input: Keyboard
window.addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') leftDown = true;
  if(e.key === 'ArrowRight' || e.key === 'd') rightDown = true;
});
window.addEventListener('keyup', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') leftDown = false;
  if(e.key === 'ArrowRight' || e.key === 'd') rightDown = false;
});

// Pointer / Touch: Drag to move
canvas.addEventListener('pointerdown', e=>{
  canvas.setPointerCapture(e.pointerId);
  pointerId = e.pointerId;
  movePlayerTo(e.clientX);
});
canvas.addEventListener('pointermove', e=>{
  if(e.pointerId !== pointerId) return;
  movePlayerTo(e.clientX);
});
canvas.addEventListener('pointerup', e=>{ if(e.pointerId === pointerId) pointerId = null; });

function movePlayerTo(clientX){
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * devicePixelRatio;
  player.x = Math.max(player.r, Math.min(W-player.r, x));
}

// Touch buttons
leftBtn.addEventListener('pointerdown', ()=>leftDown=true);
leftBtn.addEventListener('pointerup', ()=>leftDown=false);
leftBtn.addEventListener('pointerleave', ()=>leftDown=false);
rightBtn.addEventListener('pointerdown', ()=>rightDown=true);
rightBtn.addEventListener('pointerup', ()=>rightDown=false);
rightBtn.addEventListener('pointerleave', ()=>rightDown=false);

// Hauptschleife
function update(dt){
  // Beweg Spieler
  if(leftDown && !rightDown) player.x -= player.speed * dt * 0.06;
  if(rightDown && !leftDown) player.x += player.speed * dt * 0.06;
  player.x = Math.max(player.r, Math.min(W-player.r, player.x));

  // Sterne
  for(let i=stars.length-1;i>=0;i--){
    const s = stars[i]; s.y += s.vy * dt * 0.06;
    // Kollision
    const dx = s.x - player.x;
    const dy = s.y - player.y;
    if(Math.hypot(dx,dy) < s.r + player.r - 8*devicePixelRatio){
      score += Math.round(10 + s.r / devicePixelRatio);
      stars.splice(i,1);
      continue;
    }
    if(s.y - s.r > H){ // verpasst
      stars.splice(i,1);
      lives -= 1;
      if(lives <= 0) gameOver();
    }
  }

  // Spawn
  if(running && performance.now() - lastSpawn > spawnRate){ spawnStar(); lastSpawn = performance.now(); if(spawnRate>350) spawnRate *= 0.995 }

  scoreEl.textContent = 'Punkte: ' + score;
  livesEl.textContent = 'Leben: ' + lives;
}

function draw(){
  ctx.clearRect(0,0,W,H);
  // Hintergrund hübsch
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#041a2c'); g.addColorStop(1,'#021124');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // Spieler
  ctx.beginPath(); ctx.fillStyle = '#06b6d4'; ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#073042'; ctx.beginPath(); ctx.arc(player.x, player.y+player.r*0.2, player.r*0.65,0,Math.PI*2); ctx.fill();

  // Sterne
  for(const s of stars){
    ctx.beginPath(); ctx.fillStyle = '#ffd166'; ctx.arc(s.x, s.y, s.r,0,Math.PI*2); ctx.fill();
    // Glanz
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.arc(s.x - s.r*0.35, s.y - s.r*0.35, s.r*0.45,0,Math.PI*2); ctx.fill();
  }

  if(!running){
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0,0,W,H);
  }
}

function loop(ts){
  const dt = ts - last; last = ts;
  if(running) update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

startBtn.addEventListener('click', ()=>{start();});
restartBtn.addEventListener('click', ()=>{start(); overlay.style.display='none';});

// kleine Optimierung: Spieler richtig positionieren nach Resize
window.addEventListener('resize', ()=>{resetPlayer();});

// initial setup
resetPlayer();
ctx.imageSmoothingEnabled = true;

// Hinweis: Auf iPad am besten im Safari öffnen, die Buttons funktionieren per Touch.
