(function () {
  "use strict";

  const STORAGE_KEY = "dateNightState_v1";

  const SCREENS = [
    "welcome",
    "rating",
    "vibe",
    "another-date",
    "food",
    "activity",
    "when",
    "celebration",
  ];

  const NO_LABELS = [
    "Nay",
    "Are you sure?",
    "Really sure??",
    "Think about the tavern snacks 🍿",
    "My aura is dropping 📉",
    "Pookie pls 🥹",
    "Ok I'm crying (fake) 😭",
    "Fine, it's tiny now",
    "nay",
  ];

  const NO_EMOJIS = ["🥺", "😳", "😢", "😭", "🫠"];

  const VIBE_OPTIONS = [
    "Enchanted forest stroll 🌲",
    "Main character energy 🎬",
    "Rom-com montage 💞",
    "Monster-hunter banter (generic) ⚔️",
    "Unexpectedly bussin feast 🍝",
    "Delulu but make it real ✨",
  ];

  const FOOD_OPTIONS = [
    "🍕 Pizza — peasant classic, royal taste",
    "🍣 Sushi — fancy era at court",
    "🍔 Burgers & fries — tavern feast",
    "🍝 Pasta — Lady and the Tramp energy",
    "🌮 Tacos — taco 'bout a quest",
    "🥐 Brunch — sweet rolls & second breakfast",
    "🍜 Ramen / street food — market provisions",
    "🍰 Just dessert — sweet rolls only",
    "🎲 Surprise me (toss a coin… mostly heads)",
  ];

  const ACTIVITY_OPTIONS = [
    "🐎 Horse riding (your favorite)",
    "🌲 Nature hike + forest picnic",
    "🏰 Medieval fair or castle visit",
    "🎮 Cozy fantasy game night",
    "🎬 Movie night (I'll let you pick… maybe)",
    "🌅 Sunset walk + coffee",
    "🧺 Picnic among the trees",
    "🎨 Painting / pottery date",
    "🎤 Karaoke (my aura may not survive)",
    "🛋️ Cozy night in + bad movie ranking",
  ];

  const VIBE_CHIPS = [
    "Cozy hearth 🧸",
    "Fancy court 💅",
    "Chaotic quest 🎢",
    "Soft romantic 🕯️",
    "Adventure mode 🗺️",
  ];

  const DAY_CHIPS = [
    { id: "fri", label: "This Fri eve 🌙" },
    { id: "sat", label: "This Sat ☀️" },
    { id: "sun", label: "This Sun 🧇" },
    { id: "next", label: "Next week (play hard to get)" },
    { id: "pick", label: "📆 Consult the calendar" },
  ];

  const TIME_CHIPS = [
    "Morning ride ☕",
    "Afternoon 🌤️",
    "Golden hour 🌅",
    "Evening stars 🌙",
    "Late night tales 🌌",
  ];

  const params = new URLSearchParams(window.location.search);
  const guestName = (params.get("name") || "you").trim() || "you";

  const defaultState = () => ({
    rating: 10,
    ratingBonus: false,
    todayVibe: "",
    secondDate: "",
    noAttempts: 0,
    food: [],
    activities: [],
    vibe: "",
    notes: "",
    day: "",
    time: "",
    fanumTax: true,
    honestNo: false,
  });

  let state = loadState();
  let currentScreen = "welcome";
  let yesScale = 1;
  let noScale = 1;
  let ambientInterval = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...defaultState(), ...JSON.parse(raw) };
      }
    } catch (_) {
      /* ignore */
    }
    return defaultState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* ignore */
    }
  }

  function personalize() {
    $$("[data-name]").forEach((el) => {
      el.textContent = guestName;
    });
  }

  function screenIndex(id) {
    const i = SCREENS.indexOf(id);
    return i >= 0 ? i : 0;
  }

  function updateProgress() {
    const container = $("#progressHearts");
    if (!container) return;
    const idx = screenIndex(currentScreen);
    const total = SCREENS.length;
    let html = "";
    for (let i = 0; i < total; i++) {
      const filled = i <= idx;
      const sym = i % 3 === 2 ? (filled ? "♥" : "♡") : filled ? "✦" : "◇";
      html += `<span class="heart ${filled ? "heart--filled" : "heart--empty"}" aria-hidden="true">${sym}</span>`;
    }
    container.innerHTML = html;
  }

  function goTo(screenId) {
    const prev = $(`.screen[data-screen="${currentScreen}"]`);
    const next = $(`.screen[data-screen="${screenId}"]`);
    if (!next) return;

    if (prev && prev !== next) {
      prev.classList.remove("screen--active");
      prev.classList.add("screen--leaving");
      setTimeout(() => prev.classList.remove("screen--leaving"), 450);
    }

    currentScreen = screenId;
    next.classList.add("screen--active");
    $$(".screen").forEach((s) => {
      if (s !== next) s.classList.remove("screen--active");
    });

    updateProgress();
    saveState();

    if (screenId === "celebration") {
      setBackgroundMode("celebration");
      renderTicket();
      startConfetti();
      boostAmbient();
    } else {
      setBackgroundMode("quest");
    }

    if (screenId === "when") {
      preloadCelebrationBg();
    }

    if (screenId === "another-date") {
      resetNoButtonPosition();
      $("#realNoLink").hidden = state.noAttempts < 7;
    }
  }

  function nextScreen() {
    const idx = screenIndex(currentScreen);
    if (idx < SCREENS.length - 1) {
      goTo(SCREENS[idx + 1]);
    }
  }

  /* ——— Welcome ——— */
  function initWelcome() {
    const envelope = $("#envelope");
    const btnOpen = $("#btnOpen");
    const loading = $("#loadingRizz");
    const fill = $("#loadingRizzFill");
    const text = $("#loadingRizzText");

    function runLoading() {
      loading.hidden = false;
      const steps = [
        { pct: 67, msg: "Consulting the oracle… 67%…" },
        { pct: 77, msg: "Toss a coin… ok fine, 6-7 lol…" },
        { pct: 100, msg: "Scroll unlocked — 100%" },
      ];
      let i = 0;
      const tick = () => {
        if (i >= steps.length) {
          btnOpen.hidden = false;
          return;
        }
        fill.style.width = steps[i].pct + "%";
        text.textContent = steps[i].msg;
        i += 1;
        setTimeout(tick, i === 2 ? 400 : 550);
      };
      tick();
    }

    function openEnvelope() {
      envelope.classList.add("open");
      envelope.style.animation = "none";
      runLoading();
    }

    envelope.addEventListener("click", openEnvelope);
    envelope.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openEnvelope();
      }
    });

    btnOpen.addEventListener("click", () => nextScreen());
  }

  /* ——— Rating slider ——— */
  function captionForRating(n) {
    if (n >= 10) return "Verdict: flawless. +1000 aura ✨";
    if (n === 9) return "So close. The court rounds up for you 😌";
    if (n >= 7) return "Close… but the royal judges say nay.";
    if (n >= 4) return "6-7?? Not in this kingdom 🙅";
    return "Error 404: that number does not exist 🚫";
  }

  function initRating() {
    const slider = $("#ratingSlider");
    const valueEl = $("#sliderValue");
    const caption = $("#ratingCaption");
    const chip = $("#chipEleven");
    const submit = $("#btnRatingSubmit");
    let lastDrag = 10;
    let bonusShown = false;

    slider.value = "10";
    valueEl.textContent = "10";

    slider.addEventListener("input", () => {
      const v = parseInt(slider.value, 10);
      lastDrag = v;
      valueEl.textContent = String(v);
      caption.textContent = captionForRating(v);
    });

    function springToTen() {
      slider.classList.add("boing");
      slider.value = "10";
      valueEl.textContent = "10";
      caption.textContent = captionForRating(lastDrag);
      state.rating = 10;
      setTimeout(() => slider.classList.remove("boing"), 600);
      if (!bonusShown) {
        bonusShown = true;
        chip.hidden = false;
      }
    }

    slider.addEventListener("change", springToTen);
    slider.addEventListener("pointerup", springToTen);
    slider.addEventListener("touchend", springToTen);

    chip.addEventListener("click", () => {
      state.ratingBonus = true;
      state.rating = 11;
      caption.textContent = "Legendary loot unlocked. Down bad (respectfully) 😳";
      saveState();
    });

    submit.addEventListener("click", () => {
      state.rating = state.ratingBonus ? 11 : 10;
      saveState();
      nextScreen();
    });
  }

  /* ——— Vibe ——— */
  function initVibe() {
    const container = $("#vibeOptions");
    const noted = $("#vibeNoted");

    VIBE_OPTIONS.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option-btn";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        state.todayVibe = label;
        saveState();
        noted.hidden = false;
        $$(".option-btn", container).forEach((b) => b.classList.remove("option-btn--selected"));
        btn.classList.add("option-btn--selected");
        setTimeout(() => nextScreen(), 700);
      });
      container.appendChild(btn);
    });
  }

  /* ——— Another date / No dodge ——— */
  function resetNoButtonPosition() {
    const btnNo = $("#btnNo");
    const container = $("#dateButtons");
    if (!btnNo || !container) return;
    yesScale = 1;
    noScale = 1;
    btnNo.style.position = "absolute";
    btnNo.style.left = "50%";
    btnNo.style.top = "80px";
    btnNo.style.transform = "translateX(-50%) scale(1)";
    btnNo.textContent = NO_LABELS[0];
    $("#btnYes").style.transform = "scale(1)";
    $("#btnYes").style.fontSize = "";
  }

  function clampNoPosition(btn, x, y) {
    const pad = 12;
    const rect = btn.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const maxX = window.innerWidth - w - pad;
    const maxY = window.innerHeight - h - pad;
    const minX = pad;
    const minY = pad + 60;
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  function initAnotherDate() {
    const btnYes = $("#btnYes");
    const btnNo = $("#btnNo");
    const emoji = $("#dateEmoji");
    const toast = $("#yesToast");
    const realNo = $("#realNoLink");
    const honestContinue = $("#btnHonestContinue");

    function dodgeNo(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      state.noAttempts += 1;
      saveState();

      noScale *= 0.85;
      yesScale *= 1.2;

      const attempt = Math.min(state.noAttempts, NO_LABELS.length) - 1;
      btnNo.textContent = NO_LABELS[attempt] || "no";
      const emojiIdx = Math.min(Math.floor((state.noAttempts - 1) / 2), NO_EMOJIS.length - 1);
      emoji.textContent = NO_EMOJIS[emojiIdx];

      const w = btnNo.offsetWidth * noScale;
      const h = btnNo.offsetHeight * noScale;
      const randomX = padRandom(window.innerWidth - w - 24, 24);
      const randomY = padRandom(window.innerHeight * 0.35, 120);

      const clamped = clampNoPosition(btnNo, randomX, randomY);
      btnNo.style.left = clamped.x + "px";
      btnNo.style.top = clamped.y + "px";
      btnNo.style.transform = `scale(${noScale})`;
      btnNo.style.position = "fixed";

      btnYes.style.transform = `scale(${yesScale})`;
      btnYes.style.fontSize = yesScale > 1.4 ? "1.35rem" : "";

      if (state.noAttempts >= 7) {
        realNo.hidden = false;
      }
    }

    function padRandom(max, min) {
      return min + Math.random() * (max - min);
    }

    btnNo.addEventListener("pointerdown", dodgeNo, { passive: false });
    btnNo.addEventListener("touchstart", dodgeNo, { passive: false });

    btnYes.addEventListener("click", () => {
      state.secondDate = "yes";
      saveState();
      toast.hidden = false;
      hopHorseMascots();
      burstConfetti();
      setTimeout(() => nextScreen(), 1200);
    });

    realNo.addEventListener("click", () => {
      state.honestNo = true;
      state.secondDate = "no";
      saveState();
      goTo("honest-no");
    });

    honestContinue.addEventListener("click", () => {
      state.secondDate = "yes";
      saveState();
      goTo("food");
    });
  }

  /* ——— Food ——— */
  function initFood() {
    const container = $("#foodOptions");
    const fanum = $("#fanumTax");
    const label = $("#fanumTaxLabel");
    const next = $("#btnFoodNext");

    FOOD_OPTIONS.forEach((text) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card-option";
      card.textContent = text;
      card.addEventListener("click", () => {
        card.classList.toggle("card-option--selected");
        if (state.food.includes(text)) {
          state.food = state.food.filter((f) => f !== text);
        } else {
          state.food.push(text);
        }
        saveState();
      });
      container.appendChild(card);
    });

    fanum.addEventListener("click", (e) => {
      e.preventDefault();
      label.classList.add("wiggle");
      fanum.checked = true;
      state.fanumTax = true;
      setTimeout(() => label.classList.remove("wiggle"), 400);
    });

    next.addEventListener("click", () => nextScreen());
  }

  /* ——— Activity ——— */
  function initActivity() {
    const actContainer = $("#activityOptions");
    const vibeContainer = $("#vibeChips");
    const notes = $("#notesInput");
    const next = $("#btnActivityNext");

    ACTIVITY_OPTIONS.forEach((text) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "card-option";
      card.textContent = text;
      card.addEventListener("click", () => {
        card.classList.toggle("card-option--selected");
        if (state.activities.includes(text)) {
          state.activities = state.activities.filter((a) => a !== text);
        } else {
          state.activities.push(text);
        }
        saveState();
      });
      actContainer.appendChild(card);
    });

    VIBE_CHIPS.forEach((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-select";
      chip.textContent = text;
      chip.addEventListener("click", () => {
        state.vibe = text;
        $$(".chip-select", vibeContainer).forEach((c) => c.classList.remove("chip-select--active"));
        chip.classList.add("chip-select--active");
        saveState();
      });
      vibeContainer.appendChild(chip);
    });

    notes.addEventListener("input", () => {
      state.notes = notes.value.trim();
      saveState();
    });

    next.addEventListener("click", () => nextScreen());
  }

  /* ——— When ——— */
  function initWhen() {
    const dayContainer = $("#dayChips");
    const timeContainer = $("#timeChips");
    const datePicker = $("#datePicker");
    const finish = $("#btnWhenFinish");
    const countdownEl = $("#bookingCountdown");
    const countdownNum = $("#countdownNum");

    DAY_CHIPS.forEach(({ id, label }) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-select";
      chip.textContent = label;
      chip.dataset.dayId = id;
      chip.addEventListener("click", () => {
        $$(".chip-select", dayContainer).forEach((c) => c.classList.remove("chip-select--active"));
        chip.classList.add("chip-select--active");
        if (id === "pick") {
          datePicker.hidden = false;
          datePicker.focus();
        } else {
          datePicker.hidden = true;
          state.day = label;
          saveState();
        }
      });
      dayContainer.appendChild(chip);
    });

    datePicker.addEventListener("change", () => {
      if (datePicker.value) {
        const d = new Date(datePicker.value + "T12:00:00");
        state.day = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        saveState();
      }
    });

    TIME_CHIPS.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-select";
      chip.textContent = label;
      chip.addEventListener("click", () => {
        $$(".chip-select", timeContainer).forEach((c) => c.classList.remove("chip-select--active"));
        chip.classList.add("chip-select--active");
        state.time = label;
        saveState();
      });
      timeContainer.appendChild(chip);
    });

    finish.addEventListener("click", () => {
      if (!state.day) state.day = "TBD (surprise me)";
      if (!state.time) state.time = "Golden hour 🌅";
      saveState();

      countdownEl.hidden = false;
      let n = 3;
      countdownNum.textContent = String(n);
      const iv = setInterval(() => {
        n -= 1;
        if (n > 0) {
          countdownNum.textContent = String(n);
        } else {
          clearInterval(iv);
          countdownEl.querySelector("p").textContent = "Inscribing decree… sealed 🔒";
          setTimeout(() => nextScreen(), 600);
        }
      }, 1000);
    });
  }

  /* ——— Ticket & share ——— */
  function ratingLabel() {
    return state.rating >= 11 || state.ratingBonus ? "11/10 · Legendary loot 🏆" : "10/10";
  }

  function buildSummaryText() {
    const lines = [
      "⚜ ROYAL QUEST DECREE · Contract #002",
      `Lady / Guest of honor: ${guestName}`,
      `Rating of today's quest: ${ratingLabel()}`,
      `Today felt like: ${state.todayVibe || "—"}`,
      `Another quest together? ${state.secondDate === "yes" ? "AYE 💖" : "Honest decline 🤍"} (tried to say nay ${state.noAttempts}× 😏)`,
      `Provisions: ${state.food.length ? state.food.join("; ") : "Surprise feast"}`,
      `Adventures: ${state.activities.length ? state.activities.join("; ") : "Your call"}`,
      `Mood of the realm: ${state.vibe || "—"}`,
      `When we ride: ${state.day || "—"} · ${state.time || "—"}`,
      `Terms & notes: ${state.notes || "—"}`,
      "Fanum tax: approved by ancient law ✅",
      "— Sealed with wax (and feelings) 💌",
    ];
    return lines.join("\n");
  }

  function renderTicket() {
    const ticket = $("#dateTicket");
    ticket.textContent = buildSummaryText();
  }

  function initCelebration() {
    $("#btnSend").addEventListener("click", () => {
      const text = encodeURIComponent(buildSummaryText());
      window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    });

    $("#btnCopy").addEventListener("click", async () => {
      const text = buildSummaryText();
      const toast = $("#copyToast");
      try {
        await navigator.clipboard.writeText(text);
        toast.hidden = false;
        setTimeout(() => (toast.hidden = true), 2500);
      } catch (_) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          toast.hidden = false;
        } catch (__) {
          /* ignore */
        }
        document.body.removeChild(ta);
      }
    });

    $("#btnReplay").addEventListener("click", () => {
      state = defaultState();
      saveState();
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = window.location.pathname + (guestName !== "you" ? `?name=${encodeURIComponent(guestName)}` : "");
    });
  }

  /* ——— Confetti & hearts ——— */
  const canvas = $("#confettiCanvas");
  const ctx = canvas.getContext("2d");
  let confettiPieces = [];
  let confettiRunning = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function startConfetti() {
    confettiPieces = [];
    const colors = ["#c9a227", "#e8c547", "#6b2d3a", "#3d5c45", "#f4e8d0"];
    for (let i = 0; i < 80; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vy: 2 + Math.random() * 4,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * 360,
        vr: -6 + Math.random() * 12,
      });
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(tickConfetti);
    }
  }

  function burstConfetti() {
    startConfetti();
    setTimeout(() => {
      confettiPieces = [];
    }, 4000);
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > canvas.height) p.y = -20;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (confettiPieces.length && currentScreen === "celebration") {
      requestAnimationFrame(tickConfetti);
    } else {
      confettiRunning = false;
    }
  }

  function ensureAmbientStyles() {
    if (document.getElementById("ambientParticleStyle")) return;
    const style = document.createElement("style");
    style.id = "ambientParticleStyle";
    style.textContent = `
      @keyframes driftUp {
        to { transform: translateY(-105vh) translateX(20px) rotate(45deg); opacity: 0; }
      }
      @keyframes firefly {
        0%, 100% { opacity: 0.2; transform: translate(0, 0); }
        50% { opacity: 0.9; transform: translate(8px, -12px); }
      }
    `;
    document.head.appendChild(style);
  }

  function spawnAmbientParticle(kind) {
    const layer = $("#ambient");
    if (!layer) return;
    const el = document.createElement("span");
    const left = 5 + Math.random() * 90;
    if (kind === "leaf") {
      el.textContent = "🍃";
      el.style.cssText = `
        position:absolute;left:${left}%;bottom:-16px;
        font-size:${14 + Math.random() * 10}px;opacity:${0.35 + Math.random() * 0.35};
        pointer-events:none;animation:driftUp ${5 + Math.random() * 4}s linear forwards;
      `;
    } else if (kind === "heart") {
      el.textContent = "♥";
      el.style.cssText = `
        position:absolute;left:${left}%;bottom:-16px;
        font-size:${10 + Math.random() * 8}px;color:rgba(201,162,39,${0.25 + Math.random() * 0.35});
        pointer-events:none;animation:driftUp ${6 + Math.random() * 3}s ease-in forwards;
      `;
    } else {
      el.textContent = "•";
      el.style.cssText = `
        position:absolute;left:${left}%;top:${15 + Math.random() * 70}%;
        font-size:${6 + Math.random() * 6}px;color:rgba(232,197,71,${0.5 + Math.random() * 0.5});
        pointer-events:none;animation:firefly ${2 + Math.random() * 3}s ease-in-out infinite;
      `;
    }
    layer.appendChild(el);
    setTimeout(() => el.remove(), kind === "firefly" ? 8000 : 9000);
  }

  function startAmbient() {
    ensureAmbientStyles();
    if (ambientInterval) return;
    ambientInterval = setInterval(() => {
      const r = Math.random();
      if (r < 0.12) spawnAmbientParticle("heart");
      else if (r < 0.45) spawnAmbientParticle("leaf");
      else spawnAmbientParticle("firefly");
    }, 700);
  }

  function boostAmbient() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => spawnAmbientParticle(Math.random() > 0.5 ? "leaf" : "heart"), i * 120);
    }
  }

  function preloadAsset(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  function preloadCelebrationBg() {
    if (preloadCelebrationBg.done) return;
    preloadCelebrationBg.done = true;
    preloadAsset("assets/images/bg-celebration.webp");
    preloadAsset("assets/images/bg-celebration.jpg");
  }

  function preloadAssets() {
    const urls = [
      "assets/images/bg-forest.webp",
      "assets/images/bg-forest.jpg",
      "assets/images/horse.webp",
      "assets/images/horse.jpg",
      "assets/images/parchment.webp",
      "assets/images/parchment.jpg",
    ];
    urls.forEach((url) => preloadAsset(url));
  }

  function setBackgroundMode(mode) {
    const quest = $(".scene-bg__layer--quest");
    const cel = $("#bgCelebrationLayer");
    if (!quest || !cel) return;

    if (mode === "celebration") {
      preloadCelebrationBg();
      document.body.classList.add("bg-celebration");
      cel.hidden = false;
      quest.classList.remove("is-visible");
      requestAnimationFrame(() => cel.classList.add("is-visible"));
    } else {
      document.body.classList.remove("bg-celebration");
      cel.classList.remove("is-visible");
      quest.classList.add("is-visible");
      window.setTimeout(() => {
        if (currentScreen !== "celebration") cel.hidden = true;
      }, 900);
    }
  }

  function hopHorseMascots() {
    ["#horseWelcome", "#horseQuest"].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.classList.remove("horse-mascot--hop");
      void el.offsetWidth;
      el.classList.add("horse-mascot--hop");
    });
  }

  /* ——— Boot ——— */
  function init() {
    preloadAssets();
    startAmbient();
    personalize();
    updateProgress();
    initWelcome();
    initRating();
    initVibe();
    initAnotherDate();
    initFood();
    initActivity();
    initWhen();
    initCelebration();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
