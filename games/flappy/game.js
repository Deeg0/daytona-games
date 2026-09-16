/* Flappy Bird — faithful clone, no assets. Everything is drawn on a 288x512
   canvas and scaled to the window. Physics are tuned to the original's feel
   (gravity 0.25 px/frame², flap -4.6 px/frame, scroll 2 px/frame at 60 fps),
   expressed per second so any refresh rate plays the same. */
(() => {
  "use strict";

  // ---------- constants ----------
  const W = 288, H = 512;
  const GROUND_H = 112;
  const GROUND_Y = H - GROUND_H;
  const SCROLL = 120;          // px/s  (2 px/frame)
  const GRAVITY = 900;         // px/s² (0.25 px/frame²)
  const FLAP_V = -276;         // px/s  (-4.6 px/frame)
  const MAX_FALL = 600;        // px/s
  const PIPE_W = 52;
  const PIPE_GAP = 98;
  const PIPE_SPACING = 172;    // horizontal distance between pipes
  const BIRD_X = 70;
  const BIRD_W = 34, BIRD_H = 24;
  const MIN_PIPE_TOP = 70;     // shortest top pipe
  const BEST_KEY = "flappy:best";

  // ---------- canvas / scaling ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  let scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    canvas.width = Math.floor(W * scale * dpr);
    canvas.height = Math.floor(H * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- audio (synthesized) ----------
  let actx = null;
  function audio() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; } }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone(freq, dur, type = "square", gain = 0.12, slideTo = null, when = 0) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, a.currentTime + when);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + when + dur);
    g.gain.setValueAtTime(gain, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + dur);
    o.connect(g).connect(a.destination);
    o.start(a.currentTime + when); o.stop(a.currentTime + when + dur + 0.02);
  }
  function noise(dur, gain = 0.2, when = 0) {
    const a = audio(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.createBufferSource(); src.buffer = buf;
    const g = a.createGain(); g.gain.setValueAtTime(gain, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + dur);
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 900;
    src.connect(f).connect(g).connect(a.destination); src.start(a.currentTime + when);
  }
  const sfx = {
    wing: () => { tone(420, 0.08, "sine", 0.08, 900); },
    point: () => { tone(1046, 0.07, "square", 0.07); tone(1568, 0.12, "square", 0.07, null, 0.07); },
    hit: () => { noise(0.18, 0.35); tone(160, 0.18, "square", 0.15, 60); },
    die: () => { tone(500, 0.35, "square", 0.08, 120, 0.15); },
    swoosh: () => { noise(0.22, 0.12); },
  };

  // ---------- state ----------
  const S = { READY: 0, PLAY: 1, DEAD: 2 };
  const g = {
    state: S.READY,
    night: false,
    birdY: 0, birdV: 0, birdRot: 0, wing: 0, wingT: 0,
    pipes: [],       // { x, top, scored }
    groundX: 0, bgX: 0,
    score: 0, best: Number(localStorage.getItem(BEST_KEY) || 0),
    flash: 0, panelT: 0, deadT: 0, newBest: false,
    t: 0, readyBob: 0,
    shake: 0,
    tapFlash: 0,
  };
  window.FLAPPY = g; // for poking at from the console

  function reset() {
    g.state = S.READY;
    g.night = Math.random() < 0.35;
    g.birdY = GROUND_Y / 2 - 20; g.birdV = 0; g.birdRot = 0;
    g.pipes = []; g.score = 0; g.flash = 0; g.panelT = 0; g.deadT = 0; g.newBest = false; g.shake = 0;
  }

  function spawnPipe(x) {
    const range = GROUND_Y - PIPE_GAP - MIN_PIPE_TOP - 40;
    const top = MIN_PIPE_TOP + Math.random() * range;
    g.pipes.push({ x, top, scored: false });
  }

  function flap() {
    if (g.state === S.READY) {
      g.state = S.PLAY;
      g.pipes = [];
      spawnPipe(W + 60);
    }
    if (g.state === S.PLAY) {
      g.birdV = FLAP_V;
      g.wingT = 0;
      sfx.wing();
    } else if (g.state === S.DEAD && g.panelT >= 1) {
      sfx.swoosh();
      reset();
    }
  }

  function die() {
    if (g.state !== S.PLAY) return;
    g.state = S.DEAD;
    g.flash = 1; g.shake = 1; g.deadT = 0; g.panelT = 0;
    sfx.hit();
    if (navigator.vibrate) navigator.vibrate(60);
    if (g.score > g.best) { g.best = g.score; g.newBest = true; localStorage.setItem(BEST_KEY, String(g.best)); }
  }

  // ---------- update ----------
  function update(dt) {
    g.t += dt;
    g.tapFlash = Math.max(0, g.tapFlash - dt * 4);

    if (g.state !== S.DEAD) {
      g.groundX = (g.groundX - SCROLL * dt) % 24;
      g.bgX = (g.bgX - SCROLL * 0.25 * dt) % W;
    }

    if (g.state === S.READY) {
      g.readyBob += dt * 6;
      g.birdY = GROUND_Y / 2 - 20 + Math.sin(g.readyBob) * 5;
      g.wingT += dt;
      g.wing = Math.floor(g.wingT * 10) % 3;
      g.birdRot = 0;
      return;
    }

    if (g.state === S.PLAY) {
      g.birdV = Math.min(MAX_FALL, g.birdV + GRAVITY * dt);
      g.birdY += g.birdV * dt;
      g.wingT += dt;
      g.wing = g.birdV < 0 ? Math.floor(g.wingT * 18) % 3 : 1;
      // tilt: nose up right after a flap, then rotate down as it falls
      const target = g.birdV < 0 ? -0.45 : Math.min(1.45, (g.birdV / MAX_FALL) * 1.9);
      g.birdRot += (target - g.birdRot) * Math.min(1, dt * (g.birdV < 0 ? 18 : 6));

      for (const p of g.pipes) p.x -= SCROLL * dt;
      if (g.pipes.length && g.pipes[0].x < -PIPE_W) g.pipes.shift();
      const last = g.pipes[g.pipes.length - 1];
      if (!last || last.x < W - PIPE_SPACING + PIPE_W) spawnPipe((last ? last.x : W) + PIPE_SPACING);

      // scoring
      for (const p of g.pipes) {
        if (!p.scored && p.x + PIPE_W < BIRD_X) { p.scored = true; g.score++; sfx.point(); }
      }

      // collisions (hitbox slightly inside the sprite)
      const bx = BIRD_X - BIRD_W / 2 + 3, by = g.birdY - BIRD_H / 2 + 3, bw = BIRD_W - 6, bh = BIRD_H - 6;
      if (by + bh >= GROUND_Y) { g.birdY = GROUND_Y - BIRD_H / 2; die(); return; }
      if (by < -30) { g.birdY = -30 + BIRD_H / 2; g.birdV = 0; }
      for (const p of g.pipes) {
        if (bx + bw > p.x && bx < p.x + PIPE_W) {
          if (by < p.top || by + bh > p.top + PIPE_GAP) { die(); return; }
        }
      }
      return;
    }

    // DEAD: bird drops to the ground, then the panel slides in
    g.deadT += dt;
    g.flash = Math.max(0, g.flash - dt * 5);
    g.shake = Math.max(0, g.shake - dt * 4);
    if (g.birdY < GROUND_Y - BIRD_H / 2) {
      g.birdV = Math.min(MAX_FALL, g.birdV + GRAVITY * dt);
      g.birdY = Math.min(GROUND_Y - BIRD_H / 2, g.birdY + g.birdV * dt);
      g.birdRot = Math.min(1.5, g.birdRot + dt * 6);
      if (g.birdY >= GROUND_Y - BIRD_H / 2 && g.deadT > 0.1) sfx.die();
    }
    if (g.deadT > 0.6) g.panelT = Math.min(1, g.panelT + dt * 3);
  }

  // ---------- drawing helpers ----------
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

  function drawText(text, x, y, size, align = "center", fill = "#fff", stroke = "#543847", lw = 3) {
    ctx.font = `bold ${size}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = align; ctx.textBaseline = "top";
    ctx.lineJoin = "round"; ctx.lineWidth = lw; ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }

  // Big score digits, Flappy style: white with dark outline and a drop shadow.
  function drawScore(n, cx, y, size = 36) {
    const s = String(n);
    ctx.font = `bold ${size}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.lineJoin = "round";
    ctx.lineWidth = 5; ctx.strokeStyle = "#543847"; ctx.strokeText(s, cx, y + 2);
    ctx.fillStyle = "#543847"; ctx.fillText(s, cx, y + 2);
    ctx.lineWidth = 4; ctx.strokeStyle = "#543847"; ctx.strokeText(s, cx, y);
    ctx.fillStyle = "#fff"; ctx.fillText(s, cx, y);
  }

  function drawBackground() {
    const night = g.night;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    if (night) { sky.addColorStop(0, "#0a1b3f"); sky.addColorStop(1, "#1e3a72"); }
    else { sky.addColorStop(0, "#4ec0ca"); sky.addColorStop(1, "#70c5ce"); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND_Y);
    if (night) {
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 40; i++) { const sx = (i * 97 + 13) % W, sy = (i * 53 + 7) % (GROUND_Y - 160); const tw = 0.5 + ((Math.sin(g.t * 2 + i) + 1) / 2) * 0.5; ctx.globalAlpha = tw; ctx.fillRect(sx, sy, 2, 2); }
      ctx.globalAlpha = 1;
    }
    // far city + trees strip, scrolling slowly
    const ox = ((g.bgX % W) + W) % W;
    for (const dx of [-W, 0]) drawCity(ox + dx, night);
  }

  function drawCity(x0, night) {
    const cityY = GROUND_Y - 80;
    // clouds/bushes band
    ctx.fillStyle = night ? "#2d4f84" : "#dff5e6";
    for (let i = 0; i < 10; i++) {
      const cx = x0 + i * 30 + 10, r = 14 + (i % 3) * 4;
      ctx.beginPath(); ctx.arc(cx, cityY + 45, r, Math.PI, 0); ctx.fill();
    }
    px(x0, cityY + 45, W, 35, night ? "#2d4f84" : "#dff5e6");
    // buildings
    ctx.fillStyle = night ? "#3a5f96" : "#e2f4e0";
    const heights = [26, 40, 18, 48, 30, 22, 44, 16, 36, 28, 20, 42];
    let bx = x0;
    for (let i = 0; i < heights.length; i++) {
      const bw = 20 + (i % 3) * 4, bh = heights[i];
      ctx.fillStyle = night ? "#3a5f96" : "#e2f4e0";
      ctx.fillRect(bx, cityY + 46 - bh, bw, bh);
      // windows
      ctx.fillStyle = night ? "#ffe89a" : "#c8e8d0";
      for (let wy = cityY + 50 - bh; wy < cityY + 40; wy += 6) for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) if ((wx + wy) % 5 !== 0) ctx.fillRect(wx, wy, 2, 3);
      bx += bw + 4;
    }
    // trees
    ctx.fillStyle = night ? "#2f7d4f" : "#8fd47a";
    for (let i = 0; i < 14; i++) { const tx = x0 + i * 21 + 6; ctx.beginPath(); ctx.arc(tx, cityY + 66, 9, Math.PI, 0); ctx.fill(); }
    px(x0, cityY + 66, W, 14, night ? "#2f7d4f" : "#8fd47a");
  }

  function drawGround() {
    px(0, GROUND_Y, W, GROUND_H, "#ded895");
    px(0, GROUND_Y, W, 2, "#543847");
    px(0, GROUND_Y + 2, W, 10, "#73bf2e");
    // striped edge
    for (let x = g.groundX - 24; x < W + 24; x += 24) {
      ctx.fillStyle = "#9be15d"; ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 2); ctx.lineTo(x + 12, GROUND_Y + 2); ctx.lineTo(x + 6, GROUND_Y + 12); ctx.lineTo(x - 6, GROUND_Y + 12); ctx.fill();
    }
    px(0, GROUND_Y + 12, W, 2, "#5c9a2a");
    px(0, GROUND_Y + 14, W, 3, "#e3d69c");
    // dirt texture
    ctx.fillStyle = "#d3c983";
    for (let x = g.groundX - 24; x < W + 24; x += 24) { ctx.fillRect(x + 4, GROUND_Y + 26, 8, 3); ctx.fillRect(x + 14, GROUND_Y + 40, 6, 3); ctx.fillRect(x + 2, GROUND_Y + 60, 10, 3); ctx.fillRect(x + 16, GROUND_Y + 80, 7, 3); }
  }

  function drawPipe(x, top) {
    const body = "#73bf2e", light = "#9be15d", dark = "#558022", outline = "#543847";
    const capH = 26, capOver = 2;
    const pipeAt = (y, h, capY) => {
      px(x, y, PIPE_W, h, body);
      px(x + 3, y, 10, h, light);
      px(x + PIPE_W - 10, y, 7, h, dark);
      ctx.strokeStyle = outline; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y, PIPE_W - 2, h);
      // cap
      px(x - capOver, capY, PIPE_W + capOver * 2, capH, body);
      px(x - capOver + 3, capY, 12, capH, light);
      px(x + PIPE_W + capOver - 10, capY, 7, capH, dark);
      ctx.strokeRect(x - capOver + 1, capY + 1, PIPE_W + capOver * 2 - 2, capH - 2);
    };
    pipeAt(0, top - capH, top - capH);                       // top pipe, cap at bottom
    const by = top + PIPE_GAP;
    pipeAt(by + capH, GROUND_Y - by - capH, by);              // bottom pipe, cap at top
  }

  function drawBird(x, y, rot, wing) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rot);
    const o = "#543847";
    // body
    ctx.fillStyle = "#f8d548"; ctx.strokeStyle = o; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // belly
    ctx.fillStyle = "#f6e6b0"; ctx.beginPath(); ctx.ellipse(-2, 5, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    // wing (three frames)
    ctx.fillStyle = "#f5c132"; ctx.strokeStyle = o;
    ctx.beginPath();
    if (wing === 0) ctx.ellipse(-6, -4, 8, 4, -0.5, 0, Math.PI * 2);
    else if (wing === 1) ctx.ellipse(-6, 1, 8, 4, 0, 0, Math.PI * 2);
    else ctx.ellipse(-6, 6, 8, 4, 0.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // eye
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(7, -4, 6, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o; ctx.beginPath(); ctx.arc(9, -4, 2.2, 0, Math.PI * 2); ctx.fill();
    // beak
    ctx.fillStyle = "#f0552d";
    ctx.beginPath(); ctx.moveTo(9, 1); ctx.lineTo(20, 3); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 5); ctx.lineTo(19, 5); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawPanel(x, y, w, h) {
    px(x, y, w, h, "#ded895");
    ctx.strokeStyle = "#543847"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    px(x + 4, y + 4, w - 8, h - 8, "#f0e4a8");
    ctx.strokeStyle = "#b9a95f"; ctx.lineWidth = 1; ctx.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
  }

  function drawMedal(cx, cy, score) {
    let color = null, ring = null, label = "";
    if (score >= 40) { color = "#e6f4f7"; ring = "#9fc7cf"; label = "PLAT"; }
    else if (score >= 30) { color = "#f7d15c"; ring = "#c9a227"; label = "GOLD"; }
    else if (score >= 20) { color = "#d8dde3"; ring = "#98a1ab"; label = "SILVER"; }
    else if (score >= 10) { color = "#d8955b"; ring = "#a06a33"; label = "BRONZE"; }
    if (!color) { ctx.fillStyle = "#dbd0a0"; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    // little bird on the medal
    ctx.fillStyle = ring; ctx.beginPath(); ctx.ellipse(cx, cy, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + 4, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    // sparkle
    const sp = (Math.sin(g.t * 6) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + sp * 0.6})`;
    ctx.fillRect(cx - 12 + sp * 4, cy - 12, 3, 3); ctx.fillRect(cx + 9, cy + 7 - sp * 6, 2, 2);
    drawText(label, cx, cy + 26, 7, "center", "#fff", "#543847", 2);
  }

  // ---------- render ----------
  function render() {
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * 6 * g.shake, (Math.random() - 0.5) * 6 * g.shake);
    drawBackground();
    for (const p of g.pipes) drawPipe(p.x, p.top);
    drawGround();
    drawBird(BIRD_X, g.birdY, g.birdRot, g.wing);
    ctx.restore();

    if (g.state === S.READY) {
      drawScore(0, W / 2, 50);
      drawText("Get Ready!", W / 2, 130, 22, "center", "#f7f0a6", "#543847", 4);
      // tap hint: hand + arrow
      const bob = Math.sin(g.t * 5) * 3;
      ctx.save(); ctx.translate(W / 2 + 40, 250 + bob);
      ctx.fillStyle = "#fff"; ctx.strokeStyle = "#543847"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.lineTo(-8, -14); ctx.moveTo(0, -26); ctx.lineTo(8, -14); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(-9, 4, 18, 22, 5); ctx.fill(); ctx.stroke();
      ctx.restore();
      drawText("TAP", W / 2 + 40, 285, 10, "center", "#fff", "#543847", 3);
      if (g.best > 0) drawText(`BEST ${g.best}`, W / 2, GROUND_Y + 40, 10, "center", "#fff", "#543847", 3);
    }

    if (g.state === S.PLAY) drawScore(g.score, W / 2, 50);

    if (g.state === S.DEAD) {
      if (g.panelT > 0) {
        const ease = 1 - Math.pow(1 - g.panelT, 3);
        const py = 400 - 260 * ease;
        drawText("Game Over", W / 2, py - 60, 22, "center", "#f0552d", "#543847", 4);
        drawPanel(W / 2 - 113, py, 226, 116);
        drawMedal(W / 2 - 72, py + 58, g.score);
        drawText("SCORE", W / 2 + 60, py + 16, 9, "center", "#f0552d", "#543847", 2);
        drawScore(g.score, W / 2 + 60, py + 28, 20);
        drawText("BEST", W / 2 + 68, py + 66, 9, "center", "#f0552d", "#543847", 2);
        drawScore(g.best, W / 2 + 60, py + 78, 20);
        if (g.newBest) {
          px(W / 2 + 4, py + 64, 30, 12, "#f0552d");
          drawText("NEW", W / 2 + 19, py + 66, 7, "center", "#fff", "#f0552d", 1);
        }
        if (g.panelT >= 1) {
          const blink = Math.sin(g.t * 6) > -0.3;
          if (blink) drawText("TAP TO PLAY AGAIN", W / 2, py + 140, 10, "center", "#fff", "#543847", 3);
        }
      }
      if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash})`; ctx.fillRect(0, 0, W, H); }
    }
  }

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05; // tab switch / hiccup: don't teleport the bird
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- input ----------
  const onTap = (e) => { if (e.cancelable) e.preventDefault(); audio(); flap(); };
  canvas.addEventListener("pointerdown", onTap);
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); audio(); flap(); }
  });
  window.flap = flap;
  reset();
})();
