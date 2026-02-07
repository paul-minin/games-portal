// Einfaches Canvas-Flugzeug-Spiel (Ausweichen & Punkte)
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = canvas.width; let H = canvas.height;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    W = canvas.width; H = canvas.height;
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const scoreEl = document.getElementById('score');
  const messageEl = document.getElementById('message');

  // Spieler
  const plane = {x:80, y:H/2, w:44, h:22, vy:0};
  const gravity = 0.35;
  const thrust = -6; // beim Hochziehen

  let keys = {up:false, down:false};
  window.addEventListener('keydown', e => {
    if(e.key === 'ArrowUp' || e.key === 'w') keys.up = true;
    if(e.key === 'ArrowDown' || e.key === 's') keys.down = true;
    if(e.key === ' ' && state === 'over') start();
    if(e.key === ' ' && state === 'ready') start();
    e.preventDefault && e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    if(e.key === 'ArrowUp' || e.key === 'w') keys.up = false;
    if(e.key === 'ArrowDown' || e.key === 's') keys.down = false;
    e.preventDefault && e.preventDefault();
  });

  // Touch buttons
  const btnUp = document.getElementById('btn-up');
  const btnDown = document.getElementById('btn-down');
  btnUp.addEventListener('touchstart', ()=>keys.up=true); btnUp.addEventListener('touchend', ()=>keys.up=false);
  btnDown.addEventListener('touchstart', ()=>keys.down=true); btnDown.addEventListener('touchend', ()=>keys.down=false);

  // Touch drag to move
  let activeTouch = null;
  canvas.addEventListener('touchstart', e => {
    if(state === 'ready') start();
    const t = e.changedTouches[0]; activeTouch = t.identifier;
  });
  canvas.addEventListener('touchmove', e => {
    for(const t of e.changedTouches){ if(t.identifier === activeTouch){ plane.y = (t.clientY - canvas.getBoundingClientRect().top); }}
  });
  canvas.addEventListener('touchend', e => { activeTouch = null });

  // Hindernisse
  const obstacles = [];
  let spawnTimer = 0; let spawnInterval = 1200; let lastSpawn = performance.now();
  let speed = 2.5;

  // Spielzustand
  let score = 0; let best = 0; let state = 'ready'; // ready, playing, over

  function start(){
    obstacles.length = 0; score = 0; speed = 2.5; state = 'playing'; plane.y = H/2; plane.vy = 0; messageEl.style.display='none';
  }
  function gameOver(){ state = 'over'; messageEl.style.display = 'block'; messageEl.textContent = 'Game over — Leertaste oder tippe zum Neustart'; best = Math.max(best, score);} 

  function spawn(){
    const gap = Math.max(90, 160 - Math.floor(score/10));
    const gapY = 60 + Math.random()*(H-120-gap);
    obstacles.push({x: W/ (window.devicePixelRatio||1) + 20, gapY, gap, w: 48 + Math.random()*20});
  }

  function update(dt){
    if(state !== 'playing') return;
    // Controls
    if(keys.up) plane.vy += thrust*0.12; // quick lift
    if(keys.down) plane.vy += -thrust*0.06; // quick down
    plane.vy += gravity;
    plane.y += plane.vy;
    // bounds
    if(plane.y < 0) plane.y = 0, plane.vy = 0;
    if(plane.y + plane.h > H) plane.y = H - plane.h, plane.vy = 0;

    // spawn
    if(performance.now() - lastSpawn > spawnInterval){ spawn(); lastSpawn = performance.now(); spawnInterval = 900 + Math.random()*600; }

    // move obstacles
    for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i]; o.x -= speed; if(o.x + o.w < -50) { obstacles.splice(i,1); score++; scoreEl.textContent = 'Punkte: ' + score; speed += 0.01; }}

    // collision
    for(const o of obstacles){
      const ox = o.x, ow=o.w, gy=o.gapY, gh=o.gap;
      // top rect
      if(collideRect(plane.x, plane.y, plane.w, plane.h, ox, 0, ow, gy) || collideRect(plane.x, plane.y, plane.w, plane.h, ox, gy+gh, ow, H)){ gameOver(); }
    }
  }

  function collideRect(ax,ay,aw,ah, bx,by,bw,bh){ return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }

  function draw(){
    // background
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#7fd0ff'; ctx.fillRect(0,0, W, H);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc((i*140 + (performance.now()/20)%200)%W, 60 + (i%3)*30, 28, 0, Math.PI*2); ctx.fill(); }

    // obstacles
    ctx.fillStyle = '#2b7aeb';
    for(const o of obstacles){ ctx.fillRect(o.x, 0, o.w, o.gapY); ctx.fillRect(o.x, o.gapY + o.gap, o.w, H - (o.gapY + o.gap)); }

    // plane (triangle)
    ctx.save(); ctx.translate(plane.x, plane.y);
    ctx.rotate(Math.max(-0.4, Math.min(0.6, plane.vy/8)));
    ctx.fillStyle = '#ffdd57'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(34, 0); ctx.lineTo(0,12); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#caa02a'; ctx.fillRect(-6,-10,6,20); // cockpit area
    ctx.restore();

    // HUD
    if(state === 'ready'){ messageEl.style.display='block'; messageEl.textContent='Tippe oder Leertaste zum Starten'; }
    if(state === 'over'){ /* handled in gameOver() */ }
  }

  let last = performance.now();
  function loop(){
    const now = performance.now(); const dt = now - last; last = now;
    update(dt); draw(); requestAnimationFrame(loop);
  }
  loop();

  // Allow click to start or restart
  canvas.addEventListener('mousedown', ()=>{ if(state === 'ready' || state === 'over') start(); else plane.vy = thrust; });
  window.addEventListener('blur', ()=>{ keys.up=false; keys.down=false; });

})();