(() => {
  "use strict";

  const canvas = document.getElementById("game");
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext("2d");

  const ui = {
    hudTitle: document.getElementById("hudTitle"),
    scoreLabel: document.getElementById("scoreLabel"),
    score: document.getElementById("score"),
    best: document.getElementById("best"),
    help: document.getElementById("helpText"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayLine1: document.getElementById("overlayLine1"),
    overlayLine2: document.getElementById("overlayLine2"),
    gameList: document.getElementById("gameList"),
    primaryBtn: document.getElementById("primaryBtn"),
    menuBtn: document.getElementById("menuBtn"),
  };

  const gameButtons = Array.from(
    ui.gameList?.querySelectorAll("button[data-game]") ?? []
  );

  // Logical resolution (canvas width/height attributes). We render in this coordinate space.
  const W = canvas.width;
  const H = canvas.height;

  const storage = {
    getBest(gameId) {
      const raw = localStorage.getItem(`arcade_best_${gameId}`);
      const n = raw == null ? 0 : Number(raw);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    },
    setBest(gameId, value) {
      localStorage.setItem(`arcade_best_${gameId}`, String(Math.floor(value)));
    },
  };

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, maxInclusive) {
    return Math.floor(min + Math.random() * (maxInclusive - min + 1));
  }

  function aabb(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= r * r;
  }

  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x, y };
  }

  function setOverlay({ title, line1, line2, showGameList, primaryText, showMenuBtn }) {
    if (!ui.overlay) return;
    ui.overlay.hidden = false;

    const showList = Boolean(showGameList);
    const showMenu = Boolean(showMenuBtn);

    if (ui.overlayTitle && title != null) ui.overlayTitle.textContent = title;
    if (ui.overlayLine1 && line1 != null) ui.overlayLine1.textContent = line1;
    if (ui.overlayLine2 && line2 != null) ui.overlayLine2.textContent = line2;

    if (ui.gameList) ui.gameList.hidden = !showList;
    if (ui.primaryBtn && primaryText != null) ui.primaryBtn.textContent = primaryText;
    if (ui.menuBtn) ui.menuBtn.hidden = !showMenu;
  }

  function setGameButtonPressed(gameId) {
    for (const btn of gameButtons) {
      const pressed = btn.dataset.game === gameId;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#10142a");
    g.addColorStop(1, "#0a0d1a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#8aa0ff";
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = 60 + i * 34;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function createRunner() {
    const GROUND_Y = Math.round(H * 0.82);

    const state = {
      running: false,
      over: false,
      score: 0,
      speed: 420,
    };

    const player = {
      x: Math.round(W * 0.18),
      y: GROUND_Y,
      w: 40,
      h: 48,
      vy: 0,
      onGround: true,
    };

    /** @type {{x:number,y:number,w:number,h:number}[]} */
    let obstacles = [];
    let spawnTimer = 0;

    function reset() {
      state.running = false;
      state.over = false;
      state.score = 0;
      state.speed = 420;

      player.y = GROUND_Y;
      player.vy = 0;
      player.onGround = true;

      obstacles = [];
      spawnTimer = 0;
    }

    function start() {
      state.running = true;
    }

    function jump() {
      if (!state.running || state.over) return;
      if (!player.onGround) return;
      player.vy = -820;
      player.onGround = false;
    }

    function primaryAction() {
      if (!state.running) start();
      jump();
    }

    function spawnObstacle() {
      const w = randInt(24, 44);
      const h = randInt(26, 68);
      obstacles.push({ x: W + 20, y: GROUND_Y - h, w, h });
    }

    function update(dt) {
      if (!state.running || state.over) return;

      state.speed += dt * 10;
      state.score += dt * (state.speed / 140);

      const gravity = 2200;
      player.vy += gravity * dt;
      player.y += player.vy * dt;

      if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.vy = 0;
        player.onGround = true;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnObstacle();
        const base = 1.05;
        const speedFactor = Math.max(0.55, 420 / state.speed);
        spawnTimer = base * rand(0.65, 1.4) * speedFactor;
      }

      const dx = state.speed * dt;
      for (const ob of obstacles) ob.x -= dx;
      obstacles = obstacles.filter((ob) => ob.x + ob.w > -30);

      const p = { x: player.x, y: player.y - player.h, w: player.w, h: player.h };
      for (const ob of obstacles) {
        if (aabb(p, ob)) {
          state.over = true;
          state.running = false;
          break;
        }
      }
    }

    function draw() {
      drawBackground();

      ctx.fillStyle = "#151a33";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.fillStyle = "#243066";
      ctx.fillRect(0, GROUND_Y, W, 6);

      ctx.fillStyle = "#ffb86b";
      for (const ob of obstacles) {
        roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 7);
        ctx.fill();
      }

      const px = player.x;
      const py = player.y - player.h;
      ctx.fillStyle = "#7aa2ff";
      roundRect(ctx, px, py, player.w, player.h, 10);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(px + player.w - 14, py + 12, 6, 6);
    }

    return {
      id: "runner",
      name: "Runner",
      scoreLabel: "Score",
      help: "Runner: Space/Klick/Touch = springen · R = Neustart · Esc = Menü",
      reset,
      start,
      update,
      draw,
      primaryAction,
      getScore: () => Math.floor(state.score),
      isOver: () => state.over,
      getEndTitle: () => "Game Over",
      onKeyDown(e) {
        if (e.code === "Space") {
          e.preventDefault();
          primaryAction();
        }
      },
      onPointerDown() {
        primaryAction();
      },
    };
  }

  function createSnake() {
    const state = {
      running: false,
      over: false,
      acc: 0,
      tick: 0.13,
      score: 0,
      win: false,
    };

    const cell = 24;
    const cols = Math.max(14, Math.floor((W - 90) / cell));
    const rows = Math.max(10, Math.floor((H - 90) / cell));
    const boardW = cols * cell;
    const boardH = rows * cell;
    const ox = Math.floor((W - boardW) / 2);
    const oy = Math.floor((H - boardH) / 2);

    /** @type {{x:number,y:number}[]} */
    let snake = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 0, y: 0 };

    let touchStart = null;

    function equals(a, b) {
      return a.x === b.x && a.y === b.y;
    }

    function inSnake(cellPos) {
      return snake.some((s) => s.x === cellPos.x && s.y === cellPos.y);
    }

    function placeFood() {
      for (let tries = 0; tries < 1000; tries++) {
        const p = { x: randInt(0, cols - 1), y: randInt(0, rows - 1) };
        if (!inSnake(p)) {
          food = p;
          return;
        }
      }
      state.win = true;
      state.over = true;
      state.running = false;
    }

    function reset() {
      state.running = false;
      state.over = false;
      state.acc = 0;
      state.tick = 0.13;
      state.score = 0;
      state.win = false;

      const startX = Math.floor(cols / 2);
      const startY = Math.floor(rows / 2);
      snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
        { x: startX - 3, y: startY },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      placeFood();
    }

    function start() {
      state.running = true;
    }

    function primaryAction() {
      if (!state.running) start();
    }

    function setDir(nx, ny) {
      // prevent reversing
      if (dir.x + nx === 0 && dir.y + ny === 0) return;
      nextDir = { x: nx, y: ny };
    }

    function step() {
      dir = nextDir;

      const head = snake[0];
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
        state.over = true;
        state.running = false;
        return;
      }

      if (inSnake(newHead)) {
        state.over = true;
        state.running = false;
        return;
      }

      snake.unshift(newHead);
      if (equals(newHead, food)) {
        state.score += 1;
        state.tick = Math.max(0.06, 0.13 - state.score * 0.0022);
        placeFood();
      } else {
        snake.pop();
      }
    }

    function update(dt) {
      if (!state.running || state.over) return;
      state.acc += dt;
      while (state.acc >= state.tick) {
        state.acc -= state.tick;
        step();
        if (state.over) break;
      }
    }

    function draw() {
      drawBackground();

      // Board
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundRect(ctx, ox - 10, oy - 10, boardW + 20, boardH + 20, 14);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.fillRect(ox, oy, boardW, boardH);

      // Food
      ctx.fillStyle = "#ffb86b";
      ctx.beginPath();
      ctx.arc(
        ox + food.x * cell + cell / 2,
        oy + food.y * cell + cell / 2,
        cell * 0.34,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Snake
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const x = ox + s.x * cell;
        const y = oy + s.y * cell;
        ctx.fillStyle = i === 0 ? "#7aa2ff" : "rgba(122,162,255,0.82)";
        roundRect(ctx, x + 2, y + 2, cell - 4, cell - 4, 8);
        ctx.fill();
      }

      // Frame
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 2;
      roundRect(ctx, ox - 10, oy - 10, boardW + 20, boardH + 20, 14);
      ctx.stroke();
    }

    function onKeyDown(e) {
      if (e.code === "Space") {
        e.preventDefault();
        primaryAction();
        return;
      }
      const k = e.code;
      if (k === "ArrowUp" || k === "KeyW") {
        e.preventDefault();
        setDir(0, -1);
      } else if (k === "ArrowDown" || k === "KeyS") {
        e.preventDefault();
        setDir(0, 1);
      } else if (k === "ArrowLeft" || k === "KeyA") {
        e.preventDefault();
        setDir(-1, 0);
      } else if (k === "ArrowRight" || k === "KeyD") {
        e.preventDefault();
        setDir(1, 0);
      }
    }

    function onPointerDown(pos) {
      primaryAction();
      touchStart = pos;
    }

    function onPointerUp(pos) {
      if (!touchStart) return;
      const dx = pos.x - touchStart.x;
      const dy = pos.y - touchStart.y;
      touchStart = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        setDir(dx > 0 ? 1 : -1, 0);
      } else {
        setDir(0, dy > 0 ? 1 : -1);
      }
    }

    return {
      id: "snake",
      name: "Snake",
      scoreLabel: "Score",
      help: "Snake: Pfeile/WASD oder Swipe · Space = Start · R = Neustart · Esc = Menü",
      reset,
      start,
      update,
      draw,
      primaryAction,
      getScore: () => state.score,
      isOver: () => state.over,
      getEndTitle: () => (state.win ? "Gewonnen!" : "Game Over"),
      onKeyDown,
      onPointerDown,
      onPointerUp,
    };
  }

  function createFlappy() {
    const state = {
      running: false,
      over: false,
      score: 0,
    };

    const bird = {
      x: Math.round(W * 0.27),
      y: Math.round(H * 0.45),
      r: 14,
      vy: 0,
    };

    /** @type {{x:number,gapY:number,scored:boolean}[]} */
    let pipes = [];
    let spawnTimer = 0;

    function reset() {
      state.running = false;
      state.over = false;
      state.score = 0;
      bird.y = Math.round(H * 0.45);
      bird.vy = 0;
      pipes = [];
      spawnTimer = 0.65;
    }

    function start() {
      state.running = true;
    }

    function flap() {
      bird.vy = -520;
    }

    function primaryAction() {
      if (!state.running) start();
      flap();
    }

    function spawnPipe() {
      const gap = 140;
      const margin = 54;
      const gapY = randInt(margin, H - margin - gap);
      pipes.push({ x: W + 40, gapY, scored: false });
    }

    function update(dt) {
      if (!state.running || state.over) return;

      const gravity = 1400;
      const speed = 260 + state.score * 8;
      const gap = 140;
      const pipeW = 72;

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnPipe();
        spawnTimer = Math.max(0.85, 1.25 - state.score * 0.01);
      }

      bird.vy += gravity * dt;
      bird.y += bird.vy * dt;

      for (const p of pipes) p.x -= speed * dt;
      pipes = pipes.filter((p) => p.x + pipeW > -40);

      if (bird.y - bird.r < 0 || bird.y + bird.r > H) {
        state.over = true;
        state.running = false;
        return;
      }

      for (const p of pipes) {
        const topRect = { x: p.x, y: 0, w: pipeW, h: p.gapY };
        const botRect = { x: p.x, y: p.gapY + gap, w: pipeW, h: H - (p.gapY + gap) };
        const hitTop = circleRectCollide(bird.x, bird.y, bird.r, topRect.x, topRect.y, topRect.w, topRect.h);
        const hitBot = circleRectCollide(bird.x, bird.y, bird.r, botRect.x, botRect.y, botRect.w, botRect.h);
        if (hitTop || hitBot) {
          state.over = true;
          state.running = false;
          return;
        }

        if (!p.scored && p.x + pipeW < bird.x) {
          p.scored = true;
          state.score += 1;
        }
      }
    }

    function draw() {
      // Sky
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#0f1a3a");
      g.addColorStop(1, "#0a0d1a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Soft clouds
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#8aa0ff";
      for (let i = 0; i < 10; i++) {
        const cx = (i * 120 + (state.score * 12) % 1200) % (W + 200) - 100;
        const cy = 40 + (i % 5) * 46;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 54, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const gap = 140;
      const pipeW = 72;

      // Pipes
      ctx.fillStyle = "rgba(124, 255, 180, 0.85)";
      for (const p of pipes) {
        roundRect(ctx, p.x, 0, pipeW, p.gapY - 8, 10);
        ctx.fill();
        roundRect(ctx, p.x, p.gapY + gap + 8, pipeW, H - (p.gapY + gap + 8), 10);
        ctx.fill();
      }

      // Bird
      ctx.fillStyle = "#7aa2ff";
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.arc(bird.x + 6, bird.y - 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    return {
      id: "flappy",
      name: "Flappy",
      scoreLabel: "Score",
      help: "Flappy: Space/Klick/Touch = flap · R = Neustart · Esc = Menü",
      reset,
      start,
      update,
      draw,
      primaryAction,
      getScore: () => state.score,
      isOver: () => state.over,
      getEndTitle: () => "Game Over",
      onKeyDown(e) {
        if (e.code === "Space") {
          e.preventDefault();
          primaryAction();
        }
      },
      onPointerDown() {
        primaryAction();
      },
    };
  }

  function createBreakout() {
    const state = {
      running: false,
      over: false,
      win: false,
      score: 0,
      left: false,
      right: false,
    };

    const paddle = {
      x: W / 2,
      y: Math.round(H * 0.86),
      w: 140,
      h: 16,
      speed: 700,
    };

    const ball = {
      x: W / 2,
      y: paddle.y - 18,
      r: 8,
      vx: 280,
      vy: -520,
      stuck: true,
    };

    /** @type {{x:number,y:number,w:number,h:number,alive:boolean}[]} */
    let bricks = [];

    function buildBricks() {
      bricks = [];
      const cols = 10;
      const rows = 6;
      const pad = 10;
      const top = 62;
      const totalW = Math.min(W - 60, 760);
      const brickW = Math.floor((totalW - pad * (cols - 1)) / cols);
      const startX = Math.floor((W - (brickW * cols + pad * (cols - 1))) / 2);
      const brickH = 20;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bricks.push({
            x: startX + c * (brickW + pad),
            y: top + r * (brickH + pad),
            w: brickW,
            h: brickH,
            alive: true,
          });
        }
      }
    }

    function reset() {
      state.running = false;
      state.over = false;
      state.win = false;
      state.score = 0;
      state.left = false;
      state.right = false;

      paddle.x = W / 2;
      paddle.w = 140;

      ball.x = paddle.x;
      ball.y = paddle.y - 18;
      ball.vx = 280 * (Math.random() < 0.5 ? -1 : 1);
      ball.vy = -520;
      ball.stuck = true;

      buildBricks();
    }

    function start() {
      state.running = true;
      if (ball.stuck) {
        ball.stuck = false;
        ball.vx = (260 + Math.random() * 80) * (Math.random() < 0.5 ? -1 : 1);
        ball.vy = -520;
      }
    }

    function primaryAction() {
      if (!state.running) {
        start();
        return;
      }
      if (ball.stuck) start();
    }

    function update(dt) {
      if (!state.running || state.over) return;

      // Paddle
      let move = 0;
      if (state.left) move -= 1;
      if (state.right) move += 1;
      paddle.x += move * paddle.speed * dt;
      paddle.x = clamp(paddle.x, paddle.w / 2 + 12, W - paddle.w / 2 - 12);

      if (ball.stuck) {
        ball.x = paddle.x;
        ball.y = paddle.y - 18;
        return;
      }

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Walls
      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx *= -1;
      } else if (ball.x + ball.r > W) {
        ball.x = W - ball.r;
        ball.vx *= -1;
      }
      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy *= -1;
      }
      if (ball.y - ball.r > H + 30) {
        state.over = true;
        state.running = false;
        return;
      }

      // Paddle collision
      const paddleRect = {
        x: paddle.x - paddle.w / 2,
        y: paddle.y - paddle.h / 2,
        w: paddle.w,
        h: paddle.h,
      };
      if (circleRectCollide(ball.x, ball.y, ball.r, paddleRect.x, paddleRect.y, paddleRect.w, paddleRect.h) && ball.vy > 0) {
        const hit = (ball.x - paddle.x) / (paddle.w / 2);
        const angle = hit * (Math.PI / 3.2);
        const speed = Math.min(820, Math.hypot(ball.vx, ball.vy) * 1.03 + 12);
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
        ball.y = paddleRect.y - ball.r - 0.5;
      }

      // Brick collisions
      const ballBox = { x: ball.x - ball.r, y: ball.y - ball.r, w: ball.r * 2, h: ball.r * 2 };
      for (const b of bricks) {
        if (!b.alive) continue;
        if (!aabb(ballBox, b)) continue;

        b.alive = false;
        state.score += 10;

        // Simple bounce: decide based on penetration
        const cx = ball.x;
        const cy = ball.y;
        const prevX = cx - ball.vx * dt;
        const prevY = cy - ball.vy * dt;
        const prevBox = { x: prevX - ball.r, y: prevY - ball.r, w: ball.r * 2, h: ball.r * 2 };

        const hitFromSide = prevBox.x + prevBox.w <= b.x || prevBox.x >= b.x + b.w;
        if (hitFromSide) ball.vx *= -1;
        else ball.vy *= -1;

        break;
      }

      if (bricks.every((b) => !b.alive)) {
        state.win = true;
        state.over = true;
        state.running = false;
      }
    }

    function draw() {
      drawBackground();

      // Bricks
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (!b.alive) continue;
        const hue = (i * 13) % 360;
        ctx.fillStyle = `hsla(${hue}, 85%, 70%, 0.85)`;
        roundRect(ctx, b.x, b.y, b.w, b.h, 8);
        ctx.fill();
      }

      // Paddle
      ctx.fillStyle = "rgba(122,162,255,0.9)";
      roundRect(ctx, paddle.x - paddle.w / 2, paddle.y - paddle.h / 2, paddle.w, paddle.h, 10);
      ctx.fill();

      // Ball
      ctx.fillStyle = "#ffb86b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    }

    function onKeyDown(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        state.left = true;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        state.right = true;
      } else if (e.code === "Space") {
        e.preventDefault();
        primaryAction();
      }
    }

    function onKeyUp(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") state.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") state.right = false;
    }

    function onPointerMove(pos) {
      paddle.x = clamp(pos.x, paddle.w / 2 + 12, W - paddle.w / 2 - 12);
    }

    function onPointerDown(pos) {
      onPointerMove(pos);
      primaryAction();
    }

    return {
      id: "breakout",
      name: "Breakout",
      scoreLabel: "Score",
      help: "Breakout: Maus/Touch bewegen · Pfeile/A&D · Space = starten · R = Neustart · Esc = Menü",
      reset,
      start,
      update,
      draw,
      primaryAction,
      getScore: () => state.score,
      isOver: () => state.over,
      getEndTitle: () => (state.win ? "Gewonnen!" : "Game Over"),
      onKeyDown,
      onKeyUp,
      onPointerMove,
      onPointerDown,
    };
  }

  const games = {
    runner: createRunner(),
    snake: createSnake(),
    flappy: createFlappy(),
    breakout: createBreakout(),
  };

  const app = {
    mode: /** @type {"menu"|"playing"|"gameover"} */ ("menu"),
    currentId: "runner",
    lastTs: 0,
  };

  function currentGame() {
    return games[app.currentId];
  }

  function updateHud() {
    const g = currentGame();
    if (ui.hudTitle) ui.hudTitle.textContent = g.name;
    if (ui.scoreLabel) ui.scoreLabel.textContent = g.scoreLabel ?? "Score";
    if (ui.help) ui.help.textContent = g.help;

    const best = storage.getBest(g.id);
    if (ui.best) ui.best.textContent = String(best);
    if (ui.score) ui.score.textContent = "0";
  }

  function selectGame(gameId) {
    if (!games[gameId]) return;
    app.currentId = gameId;
    setGameButtonPressed(gameId);
    currentGame().reset();
    updateHud();
    showMenu();
  }

  function showMenu() {
    app.mode = "menu";
    setOverlay({
      title: "Arcade",
      line1: "Wähle ein Spiel",
      line2: "Space/Klick/Touch: Start · Esc: Menü",
      showGameList: true,
      primaryText: "Start",
      showMenuBtn: false,
    });
  }

  function startPlay() {
    const g = currentGame();
    g.start();
    app.mode = "playing";
    if (ui.overlay) ui.overlay.hidden = true;
  }

  function restart() {
    const g = currentGame();
    g.reset();
    startPlay();
  }

  function showGameOver() {
    const g = currentGame();
    const score = g.getScore();
    const bestOld = storage.getBest(g.id);
    const bestNew = Math.max(bestOld, score);
    if (bestNew !== bestOld) storage.setBest(g.id, bestNew);

    if (ui.best) ui.best.textContent = String(bestNew);

    app.mode = "gameover";
    setOverlay({
      title: g.getEndTitle?.() ?? "Game Over",
      line1: `Score: ${score} · Best: ${bestNew}`,
      line2: "R oder Button = Neustart · Esc/Menu = Menü",
      showGameList: false,
      primaryText: "Neustart",
      showMenuBtn: true,
    });
  }

  function primaryAction() {
    if (app.mode === "menu") {
      startPlay();
      return;
    }
    if (app.mode === "gameover") {
      restart();
      return;
    }
    currentGame().primaryAction?.();
  }

  function tick(ts) {
    if (!app.lastTs) app.lastTs = ts;
    const dt = Math.min(0.033, (ts - app.lastTs) / 1000);
    app.lastTs = ts;

    const g = currentGame();
    if (app.mode === "playing") {
      g.update(dt);
      if (g.isOver()) {
        showGameOver();
      }
    }

    g.draw(ctx);
    const score = g.getScore();
    if (ui.score) ui.score.textContent = String(score);

    requestAnimationFrame(tick);
  }

  // UI wiring
  ui.primaryBtn?.addEventListener("click", () => primaryAction());
  ui.menuBtn?.addEventListener("click", () => showMenu());
  for (const btn of gameButtons) {
    btn.addEventListener("click", () => selectGame(btn.dataset.game));
  }

  // Input
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      e.preventDefault();
      showMenu();
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      if (app.mode === "playing" || app.mode === "gameover") restart();
      return;
    }
    if (e.code === "Space" && app.mode !== "playing") {
      e.preventDefault();
      primaryAction();
      return;
    }
    currentGame().onKeyDown?.(e);
  });

  window.addEventListener("keyup", (e) => {
    currentGame().onKeyUp?.(e);
  });

  canvas.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      const pos = getPointerPos(e);
      if (app.mode === "menu") {
        startPlay();
        return;
      }
      if (app.mode === "gameover") {
        restart();
        return;
      }
      currentGame().onPointerDown?.(pos);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (app.mode !== "playing") return;
      const pos = getPointerPos(e);
      currentGame().onPointerMove?.(pos);
    },
    { passive: true }
  );

  canvas.addEventListener(
    "pointerup",
    (e) => {
      if (app.mode !== "playing") return;
      const pos = getPointerPos(e);
      currentGame().onPointerUp?.(pos);
    },
    { passive: true }
  );

  // Boot
  selectGame("runner");
  requestAnimationFrame(tick);
})();
