let canvas, ctx, particles = [];
let raf = 0;
let reduced = false;
let lowPower = false;

function applyReducedMotion() {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else if (!reduced && !raf && ctx) {
    loop();
  }
}

export function initParticles() {
  canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  applyReducedMotion();
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyReducedMotion);
  resize();
  window.addEventListener("resize", resize);
  if (!reduced) loop();
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (reduced || lowPower) return;
      spawnSparkles(e.clientX, e.clientY);
    },
    { passive: true }
  );
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function loop() {
  if (!ctx) return;
  const t0 = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.vy += p.grav || 0;
    ctx.globalAlpha = Math.max(0, p.life);
    if (p.kind === "firefly") {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, "rgba(232,197,71,0.9)");
      g.addColorStop(1, "rgba(232,197,71,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    } else if (p.kind === "petal") {
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    } else if (p.kind === "spark") {
      ctx.strokeStyle = "#e8c547";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x - 4, p.y);
      ctx.lineTo(p.x + 4, p.y);
      ctx.moveTo(p.x, p.y - 4);
      ctx.lineTo(p.x, p.y + 4);
      ctx.stroke();
    } else if (p.kind === "ember") {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  });
  if (particles.length < 60 && !lowPower && !reduced) {
    if (Math.random() < 0.04) addFirefly();
    if (Math.random() < 0.02) addPetal();
  }
  if (!reduced) raf = requestAnimationFrame(loop);
  else raf = 0;
  const dt = performance.now() - t0;
  if (dt > 50) lowPower = true;
}

function addFirefly() {
  particles.push({
    kind: "firefly",
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.3,
    r: 3 + Math.random() * 4,
    life: 1,
    decay: 0.002,
  });
}

function addPetal() {
  particles.push({
    kind: "petal",
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0.4 + Math.random() * 0.5,
    w: 6,
    h: 10,
    rot: Math.random() * Math.PI,
    color: Math.random() > 0.5 ? "#f4a8b8" : "#f4e8d0",
    life: 1,
    decay: 0.003,
    grav: 0.002,
  });
}

export function spawnSparkles(x, y) {
  if (!ctx || reduced) return;
  for (let i = 0; i < 7; i++) {
    particles.push({
      kind: "spark",
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: 0.05,
    });
  }
}

export function burstHearts(x, y) {
  if (!ctx || reduced) return;
  for (let i = 0; i < 12; i++) {
    particles.push({
      kind: "petal",
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 3,
      w: 8,
      h: 8,
      rot: 0,
      color: "#e85d8a",
      life: 1,
      decay: 0.02,
      grav: 0.05,
    });
  }
}

export function boostEmbers() {
  if (!ctx || reduced) return;
  for (let i = 0; i < 20; i++) {
    particles.push({
      kind: "ember",
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.7,
      vx: (Math.random() - 0.5) * 1,
      vy: -1 - Math.random() * 2,
      r: 2 + Math.random() * 3,
      color: `rgba(255,${140 + Math.random() * 60 | 0},60,0.9)`,
      life: 1,
      decay: 0.015,
    });
  }
}
