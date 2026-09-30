/* BOLT ARENA — local arena roguelite. No external assets. */
(() => {
  const VW = 1600;
  const VH = 900;
  const BOARD_KEY = "bolt-arena-v1";

  const CHARACTERS = {
    funke: { name: "Funke", hp: 90, speed: 345, rate: 0.13, dmg: 12, color: "#5ce1e6" },
    hammer: { name: "Hammer", hp: 145, speed: 255, rate: 0.22, dmg: 24, pierce: 1, color: "#ffc857" },
    geist: { name: "Geist", hp: 110, speed: 305, rate: 0.16, dmg: 13, drones: 1, color: "#c084fc" },
  };

  const UPGRADES = [
    { id: "dmg", name: "Scharfschuss", desc: "Schaden +5", max: 8, apply: (p) => { p.dmg += 5; } },
    { id: "rate", name: "Schnellfeuer", desc: "Schießt spürbar schneller", max: 6, apply: (p) => { p.rate = Math.max(0.05, p.rate * 0.86); } },
    { id: "multi", name: "Salve", desc: "+1 Projektil im Fächer", max: 4, apply: (p) => { p.multi += 1; } },
    { id: "pierce", name: "Durchschuss", desc: "Schüsse gehen durch einen weiteren Gegner", max: 3, apply: (p) => { p.pierce += 1; } },
    { id: "crit", name: "Krit", desc: "Kritchance +8%", max: 5, apply: (p) => { p.crit += 0.08; } },
    { id: "speed", name: "Turbolauf", desc: "Tempo +10%", max: 5, apply: (p) => { p.speed *= 1.1; } },
    { id: "hp", name: "Panzer", desc: "+30 Leben und Heilung", max: 6, apply: (p) => { p.hpMax += 30; if (p.hp > 0) p.hp = Math.min(p.hpMax, p.hp + 30); } },
    { id: "shield", name: "Schild", desc: "+1 Schild, fängt den nächsten Treffer", max: 3, apply: (p) => { p.shield += 1; } },
    { id: "leech", name: "Lebensraub", desc: "Treffer heilen dich ein Stück", max: 4, apply: (p) => { p.leech += 0.06; } },
    { id: "dash", name: "Phantomschritt", desc: "Dash ist schneller wieder da", max: 4, apply: (p) => { p.dashCdMax = Math.max(0.38, p.dashCdMax - 0.16); } },
    { id: "drone", name: "Drohne", desc: "+1 Begleitdrohne", max: 3, apply: (p) => { p.droneCount += 1; } },
    { id: "magnet", name: "Magnet", desc: "Heilkugeln fliegen zu dir", max: 3, apply: (p) => { p.magnet += 90; } },
    { id: "split", name: "Splitter", desc: "Treffer sprühen Funken", max: 1, apply: (p) => { p.split = true; } },
  ];

  const PILLARS = [
    { x: 470, y: 430, r: 58 },
    { x: 1130, y: 540, r: 74 },
    { x: 830, y: 250, r: 46 },
  ];

  const CALLOUTS = { 5: "SAUBER", 10: "BRUTAL", 15: "GLÜHEND", 20: "UNSTOPPBAR" };
  const BOSS_NAMES = ["GLITCH", "OVERLORD", "KERNSTURM", "ABGRUND"];

  const canvas = document.getElementById("view");
  const ctx = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const keys = new Set();
  const mouse = { x: 800, y: 420 };
  const touch = { moveActive: false, mx: 0, my: 0, aimActive: false, ax: 800, ay: 420 };

  const players = [];
  const enemies = [];
  const pBullets = [];
  const eBullets = [];
  const particles = [];
  const floats = [];
  const pickups = [];
  const ghosts = [];
  const drones = [];

  const state = {
    mode: "menu",
    character: "funke",
    playKind: "solo",
    wave: 0,
    phase: "announce",
    announceT: 0,
    banner: "",
    queue: [],
    spawnCd: 0,
    time: 0,
    score: 0,
    combo: 0,
    comboT: 0,
    bestCombo: 0,
    kills: 0,
    callout: "",
    calloutT: 0,
    shake: 0,
    flash: 0,
    hitstop: 0,
    ranks: {},
    picks: [],
    saved: false,
    sim: false,
  };

  let nextId = 1;
  let viewScale = 1;
  let viewOx = 0;
  let viewOy = 0;
  let attractT = 0;
  let lastKind = "solo";

  const audio = {
    ctx: null,
    muted: false,
    musicOn: false,
    step: 0,
    timer: 0,
    ensure() {
      if (this.muted) return null;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    tone(freq, dur, type, gain, slide) {
      try {
        const ctxA = this.ensure();
        if (!ctxA) return;
        const t = ctxA.currentTime;
        const osc = ctxA.createOscillator();
        const g = ctxA.createGain();
        osc.type = type || "square";
        osc.frequency.setValueAtTime(freq, t);
        if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(ctxA.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch {
        /* Audio is optional. */
      }
    },
    noise(dur, gain) {
      const ctxA = this.ensure();
      if (!ctxA) return;
      const n = Math.max(1, Math.floor(ctxA.sampleRate * dur));
      const buf = ctxA.createBuffer(1, n, ctxA.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctxA.createBufferSource();
      const g = ctxA.createGain();
      src.buffer = buf;
      g.gain.value = gain;
      src.connect(g).connect(ctxA.destination);
      src.start();
    },
    shoot() { this.tone(640, 0.05, "square", 0.03, 0.5); },
    hit() { this.tone(180, 0.06, "sawtooth", 0.03, 0.4); },
    dash() { this.noise(0.08, 0.04); },
    hurt() { this.tone(90, 0.18, "sawtooth", 0.05, 0.5); },
    pick() { this.tone(520, 0.12, "triangle", 0.04, 1.4); },
    boom() { this.noise(0.2, 0.07); this.tone(70, 0.25, "sine", 0.06, 0.4); },
    startMusic() {
      if (this.musicOn) return;
      this.musicOn = true;
      const loop = () => {
        if (!this.musicOn) return;
        this.playStep();
        this.timer = window.setTimeout(loop, 230);
      };
      loop();
    },
    stopMusic() {
      this.musicOn = false;
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = 0;
    },
    playStep() {
      if (this.muted) return;
      const scale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25];
      const melody = [0, 2, 4, 2, 3, 4, 6, 4, 2, 1, 0, 4, 3, 2, 1, 0];
      const boss = enemies.some((e) => e.kind === "boss" && !e.dead);
      const bend = boss ? 1.26 : 1;
      const note = melody[this.step % melody.length];
      this.tone(scale[note] * bend, 0.16, "triangle", 0.018);
      if (this.step % 4 === 0) this.tone(110 * bend, 0.18, "sine", 0.03);
      if (this.step % 2 === 0) this.noise(0.03, 0.012);
      this.step = (this.step + 1) % melody.length;
    },
  };

  function rand(n) { return Math.random() * n; }
  function dist2(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy; }
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function loadBoard() {
    try { return JSON.parse(localStorage.getItem(BOARD_KEY) || "[]"); }
    catch { return []; }
  }

  function renderBoard() {
    const board = document.getElementById("board");
    const rows = loadBoard();
    board.replaceChildren();
    if (!rows.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Noch leer. Der erste Run schreibt sich hier rein.";
      board.appendChild(li);
      return;
    }
    for (const row of rows) {
      const li = document.createElement("li");
      li.textContent = `${row.name} — ${row.score} · Welle ${row.wave}`;
      board.appendChild(li);
    }
  }

  function particle(x, y, color, speed, life, size) {
    const a = rand(Math.PI * 2);
    const s = speed * (0.35 + Math.random());
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life, max: life, color, size,
    });
    if (particles.length > 420) particles.splice(0, particles.length - 420);
  }

  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) particle(x, y, color, speed, 0.25 + Math.random() * 0.35, 2 + Math.random() * 3);
  }

  function floater(x, y, text, color) {
    floats.push({ x, y, text, color, life: 0.7, vy: -46 });
  }

  function makePlayer(kind, human, x, y, color, slot, name) {
    const c = CHARACTERS[kind];
    return {
      kind, human, slot, name, x, y, r: 16,
      color: color || c.color,
      hp: c.hp, hpMax: c.hp,
      speed: c.speed, rate: c.rate, cool: 0.2,
      dmg: c.dmg, multi: 1, pierce: c.pierce || 0,
      crit: 0.06, leech: 0, magnet: 86,
      dashCd: 0, dashCdMax: 1.05, dashing: 0,
      dashVx: 0, dashVy: 0, ghostTick: 0,
      shield: 0, droneCount: c.drones || 0, droneCool: [],
      split: false, aim: -Math.PI / 2, invuln: 1.1,
    };
  }

  function makeEnemy(kind, wave) {
    const scale = 1 + (wave - 1) * 0.17;
    const table = {
      grunt: { hp: 24, speed: 125, r: 18, touch: 12, color: "#ff4d6d" },
      dasher: { hp: 32, speed: 95, r: 18, touch: 18, color: "#ff7a3c" },
      spitter: { hp: 20, speed: 110, r: 16, touch: 10, color: "#ff3cac" },
      orbiter: { hp: 28, speed: 150, r: 16, touch: 12, color: "#7cf4ff" },
      elite: { hp: 86, speed: 100, r: 26, touch: 16, color: "#ffc857" },
      boss: { hp: 520 + wave * 28, speed: 76, r: 54, touch: 22, color: "#d946ef" },
    };
    const t = table[kind];
    const hp = kind === "boss" ? t.hp : Math.round(t.hp * scale);
    return {
      id: nextId++,
      kind, x: VW / 2, y: 80,
      hp, hpMax: hp,
      speed: t.speed * (kind === "boss" ? 1 : 1 + (wave - 1) * 0.025),
      r: t.r, touch: t.touch, color: t.color,
      flash: 0, t: Math.random() * 2, cool: 0.4 + Math.random() * 0.6,
      wind: 0, lunging: 0, lx: 0, ly: 0,
      orbit: rand(Math.PI * 2),
      dead: false, touchCd: 0, chargeGate: -1,
    };
  }

  function edgePoint() {
    const side = (Math.random() * 4) | 0;
    const inset = 48;
    if (side === 0) return { x: 90 + rand(VW - 180), y: inset };
    if (side === 1) return { x: VW - inset, y: 90 + rand(VH - 180) };
    if (side === 2) return { x: 90 + rand(VW - 180), y: VH - inset };
    return { x: inset, y: 90 + rand(VH - 180) };
  }

  function hitsPillar(x, y, r) {
    return PILLARS.some((o) => {
      const dx = x - o.x;
      const dy = y - o.y;
      return dx * dx + dy * dy < (o.r + r) * (o.r + r);
    });
  }

  function clampEntity(e, r) {
    const m = 26 + r;
    for (const o of PILLARS) {
      let dx = e.x - o.x;
      let dy = e.y - o.y;
      const min = r + o.r;
      let d2 = dx * dx + dy * dy;
      if (d2 < min * min) {
        let d = Math.sqrt(d2);
        if (d < 0.001) { dx = 1; dy = 0; d = 1; }
        e.x = o.x + (dx / d) * (min + 0.5);
        e.y = o.y + (dy / d) * (min + 0.5);
      }
    }
    if (e.x < m) e.x = m;
    if (e.y < m) e.y = m;
    if (e.x > VW - m) e.x = VW - m;
    if (e.y > VH - m) e.y = VH - m;
  }

  function nearestEnemy(from) {
    let best = null;
    let bestD = 1e12;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = dist2(from, e);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function nearestLiving(from) {
    let best = null;
    let bestD = 1e12;
    for (const p of players) {
      if (p.hp <= 0) continue;
      const d = dist2(from, p);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  function spawnEnemy(kind) {
    const e = makeEnemy(kind, state.wave);
    if (kind === "boss") {
      e.x = VW / 2;
      e.y = 210;
    } else {
      for (let i = 0; i < 8; i++) {
        const p = edgePoint();
        e.x = p.x;
        e.y = p.y;
        const crowded = players.some((pl) => pl.hp > 0 && dist2(pl, e) < 180 * 180);
        if (!crowded && !hitsPillar(e.x, e.y, e.r)) break;
      }
    }
    clampEntity(e, e.r);
    enemies.push(e);
    return e;
  }

  function buildQueue(n) {
    if (n % 5 === 0) {
      const q = ["boss"];
      const adds = 4 + Math.floor(n / 5);
      for (let i = 0; i < adds; i++) q.push(i % 2 ? "dasher" : "spitter");
      return q;
    }
    const count = Math.min(20, 5 + n * 2);
    const pool = ["grunt", "grunt"];
    if (n >= 2) pool.push("dasher");
    if (n >= 3) pool.push("spitter");
    if (n >= 4) pool.push("orbiter");
    if (n >= 7) pool.push("dasher", "spitter");
    const q = [];
    for (let i = 0; i < count; i++) q.push(pool[(Math.random() * pool.length) | 0]);
    q.push("elite");
    return q;
  }

  function bossTitle(n) {
    const index = (((n / 5) | 0) - 1) % BOSS_NAMES.length;
    return "BOSS · " + BOSS_NAMES[(index + BOSS_NAMES.length) % BOSS_NAMES.length];
  }

  function clearWorld() {
    players.length = 0;
    enemies.length = 0;
    pBullets.length = 0;
    eBullets.length = 0;
    particles.length = 0;
    floats.length = 0;
    pickups.length = 0;
    ghosts.length = 0;
    drones.length = 0;
  }

  function resetRun() {
    clearWorld();
    state.wave = 0;
    state.phase = "announce";
    state.announceT = 0;
    state.banner = "";
    state.queue = [];
    state.spawnCd = 0;
    state.time = 0;
    state.score = 0;
    state.combo = 0;
    state.comboT = 0;
    state.bestCombo = 0;
    state.kills = 0;
    state.callout = "";
    state.calloutT = 0;
    state.shake = 0;
    state.flash = 0;
    state.hitstop = 0;
    state.ranks = {};
    state.picks = [];
    state.saved = false;
  }

  function show(id) {
    for (const name of ["menu", "upgrade", "pause", "over"]) {
      document.getElementById(name).hidden = name !== id;
    }
    document.getElementById("btn-pause").hidden = id !== null || state.mode !== "play";
  }

  function showMenu() {
    state.mode = "menu";
    audio.stopMusic();
    clearWorld();
    show("menu");
    document.getElementById("btn-pause").hidden = true;
    renderBoard();
  }

  function beginWave(n) {
    state.mode = "play";
    state.wave = n;
    state.phase = "announce";
    state.announceT = 1.4;
    state.banner = n % 5 === 0 ? bossTitle(n) : "WELLE " + n;
    state.queue = [];
    state.spawnCd = 0;
    document.getElementById("upgrade").hidden = true;
    document.getElementById("pause").hidden = true;
    document.getElementById("over").hidden = true;
    document.getElementById("menu").hidden = true;
    document.getElementById("btn-pause").hidden = false;
  }

  function startGame(kind, opts) {
    lastKind = kind;
    resetRun();
    state.playKind = kind;
    state.sim = !!(opts && opts.silent);
    const hero = makePlayer(state.character, true, 760, 700, null, 1, "Du");
    players.push(hero);
    if (kind === "ki") {
      players.push(makePlayer("funke", false, 900, 730, "#c084fc", 0, "KI"));
    }
    if (kind === "coop") {
      players.push(makePlayer("funke", true, 620, 730, "#ff4d8a", 2, "Freund"));
    }
    beginWave(1);
    if (!state.sim) {
      audio.ensure();
      audio.startMusic();
    }
  }

  function humansDead() {
    const humans = players.filter((p) => p.human);
    return humans.length > 0 && humans.every((p) => p.hp <= 0);
  }

  function hurt(p, amount) {
    if (!p || p.hp <= 0 || p.invuln > 0 || p.dashing > 0) return;
    if (p.shield > 0) {
      p.shield -= 1;
      p.invuln = 0.28;
      burst(p.x, p.y, "#9be7ff", 16, 180);
      audio.tone(300, 0.08, "square", 0.03, 1.6);
      return;
    }
    p.hp -= amount;
    p.invuln = 0.8;
    if (!reduceMotion) state.shake = Math.max(state.shake, 12);
    state.flash = 0.22;
    state.hitstop = Math.max(state.hitstop, 0.045);
    audio.hurt();
    if (p.hp <= 0) {
      p.hp = 0;
      burst(p.x, p.y, p.color, 28, 260);
      if (p.human && humansDead()) gameOver();
      if (!p.human) p.deadTimer = 5;
    }
  }

  function damageEnemy(e, dmg, crit, owner, split) {
    if (!e || e.dead || e.hp <= 0) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (crit) floater(e.x, e.y - e.r, Math.round(dmg) + "!", "#ffc857");
    if (owner && owner.hp > 0 && owner.leech) {
      owner.hp = Math.min(owner.hpMax, owner.hp + dmg * owner.leech);
    }
    particle(e.x, e.y, e.color, 80, 0.2, 2);
    if (split) {
      for (let i = 0; i < 5; i++) {
        const a = rand(Math.PI * 2);
        pBullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
          r: 3, dmg: 4, crit: false, pierce: 0,
          hits: new Set([e.id]), owner, split: false, life: 0.22,
          color: "#ffc857",
        });
      }
    }
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      onKill(e);
    }
  }

  function onKill(e) {
    state.kills += 1;
    state.combo += 1;
    state.comboT = 2.15;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    const base = e.kind === "boss" ? 280 : e.kind === "elite" ? 70 : 16;
    const gain = Math.round(base * (1 + state.combo * 0.12));
    state.score += gain;
    floater(e.x, e.y, "+" + gain, "#ffc857");
    burst(e.x, e.y, e.color, e.kind === "boss" ? 40 : 14, e.kind === "boss" ? 320 : 200);
    if (!reduceMotion) state.shake = Math.max(state.shake, e.kind === "boss" ? 18 : 6);
    state.hitstop = Math.max(state.hitstop, e.kind === "boss" ? 0.12 : 0.025);
    if (e.kind === "boss") audio.boom();
    else audio.hit();
    if (CALLOUTS[state.combo]) {
      state.callout = CALLOUTS[state.combo];
      state.calloutT = 0.85;
    }
    if (e.kind === "elite" || e.kind === "boss" || Math.random() < 0.14) {
      pickups.push({
        x: e.x, y: e.y, r: 12,
        value: e.kind === "boss" ? 46 : 20,
        life: 16,
      });
    }
  }

  function fire(p) {
    if (pBullets.length > 90) return;
    const n = p.multi;
    const spread = 0.11;
    for (let i = 0; i < n; i++) {
      const a = p.aim + (i - (n - 1) / 2) * spread;
      const crit = Math.random() < p.crit;
      const dmg = p.dmg * (crit ? 2 : 1);
      pBullets.push({
        x: p.x + Math.cos(a) * 20,
        y: p.y + Math.sin(a) * 20,
        vx: Math.cos(a) * 740,
        vy: Math.sin(a) * 740,
        r: 5, dmg, crit, pierce: p.pierce,
        hits: new Set(), owner: p, split: p.split, life: 1.05,
        color: crit ? "#ffc857" : p.color,
      });
    }
    audio.shoot();
  }

  function eBullet(x, y, angle, speed, dmg, r) {
    if (eBullets.length > 120) return;
    eBullets.push({
      x, y, r,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      dmg, life: 4.2,
    });
  }

  function padWish() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];
    if (!gp) return null;
    const dead = 0.22;
    let x = gp.axes[0] || 0;
    let y = gp.axes[1] || 0;
    if (Math.hypot(x, y) < dead) { x = 0; y = 0; }
    let ax = gp.axes[2] || 0;
    let ay = gp.axes[3] || 0;
    let aim = null;
    if (Math.hypot(ax, ay) > dead) aim = Math.atan2(ay, ax);
    const dash = !!(gp.buttons[0] && gp.buttons[0].pressed);
    return { x, y, aim, dash };
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y);
    if (len < 0.001) return { x: 0, y: 0 };
    const mag = Math.min(1, len);
    return { x: (x / len) * mag, y: (y / len) * mag };
  }

  function aiWish(p) {
    const t = nearestEnemy(p);
    if (!t) return { x: 0, y: 0, aim: p.aim, dash: false };
    const dx = t.x - p.x;
    const dy = t.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    let x = dx / d;
    let y = dy / d;
    if (d < 140) { x = -x; y = -y; }
    else if (d < 230) { x = -dy / d; y = dx / d; }
    return { x, y, aim: Math.atan2(dy, dx), dash: d < 112 && p.dashCd <= 0 };
  }

  function p1Wish(p) {
    if (touch.moveActive || touch.aimActive) {
      const aim = touch.aimActive ? Math.atan2(touch.ay - p.y, touch.ax - p.x) : p.aim;
      const mv = normalize(touch.mx, touch.my);
      return { x: mv.x, y: mv.y, aim, dash: false };
    }
    const pad = padWish();
    let x = 0;
    let y = 0;
    if (keys.has("KeyA")) x -= 1;
    if (keys.has("KeyD")) x += 1;
    if (keys.has("KeyW")) y -= 1;
    if (keys.has("KeyS")) y += 1;
    if (state.playKind !== "coop") {
      if (keys.has("ArrowLeft")) x -= 1;
      if (keys.has("ArrowRight")) x += 1;
      if (keys.has("ArrowUp")) y -= 1;
      if (keys.has("ArrowDown")) y += 1;
    }
    if (pad && (pad.x || pad.y)) { x = pad.x; y = pad.y; }
    const mv = normalize(x, y);
    let aim = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    if (pad && pad.aim != null) aim = pad.aim;
    const dash = keys.has("ShiftLeft") || keys.has("Space") || touch.wantDash || !!(pad && pad.dash);
    touch.wantDash = false;
    return { x: mv.x, y: mv.y, aim, dash };
  }

  function p2Wish(p) {
    let x = 0;
    let y = 0;
    if (keys.has("ArrowLeft")) x -= 1;
    if (keys.has("ArrowRight")) x += 1;
    if (keys.has("ArrowUp")) y -= 1;
    if (keys.has("ArrowDown")) y += 1;
    const mv = normalize(x, y);
    const t = nearestEnemy(p);
    const aim = t ? Math.atan2(t.y - p.y, t.x - p.x) : p.aim;
    return { x: mv.x, y: mv.y, aim, dash: keys.has("ShiftRight") };
  }

  function wishFor(p) {
    if (state.sim || !p.human) return aiWish(p);
    if (p.slot === 2) return p2Wish(p);
    return p1Wish(p);
  }

  function updatePlayer(p, dt) {
    if (p.hp <= 0) {
      if (!p.human) {
        p.deadTimer = (p.deadTimer || 5) - dt;
        if (p.deadTimer <= 0) {
          const host = players.find((h) => h.human && h.hp > 0) || players[0];
          p.x = host.x + 40;
          p.y = host.y + 30;
          p.hp = Math.round(p.hpMax * 0.65);
          p.invuln = 1.3;
          burst(p.x, p.y, p.color, 18, 160);
        }
      }
      return;
    }
    const wish = wishFor(p);
    p.aim = wish.aim;
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    if (wish.dash && p.dashCd <= 0 && p.dashing <= 0) {
      p.dashing = 0.15;
      p.dashCd = p.dashCdMax;
      p.dashVx = Math.cos(p.aim) * 820;
      p.dashVy = Math.sin(p.aim) * 820;
      p.ghostTick = 0;
      audio.dash();
    }
    if (p.dashing > 0) {
      p.dashing -= dt;
      p.x += p.dashVx * dt;
      p.y += p.dashVy * dt;
      p.ghostTick -= dt;
      if (p.ghostTick <= 0) {
        ghosts.push({ x: p.x, y: p.y, aim: p.aim, life: 0.16, color: p.color });
        p.ghostTick = 0.03;
      }
    } else {
      p.x += wish.x * p.speed * dt;
      p.y += wish.y * p.speed * dt;
      if (wish.x || wish.y) {
        if (Math.random() < 0.4) particle(p.x - Math.cos(p.aim) * 10, p.y - Math.sin(p.aim) * 10, p.color, 30, 0.18, 2);
      }
    }
    clampEntity(p, p.r);
    p.cool -= dt;
    let shots = 0;
    while (p.cool <= 0 && shots < 3 && p.dashing <= 0) {
      fire(p);
      p.cool += p.rate;
      shots += 1;
    }
  }

  function updateDrones(dt) {
    drones.length = 0;
    for (const p of players) {
      if (p.hp <= 0 || p.droneCount <= 0) continue;
      if (p.droneCool.length < p.droneCount) {
        while (p.droneCool.length < p.droneCount) p.droneCool.push(0.2);
      }
      for (let i = 0; i < p.droneCount; i++) {
        const ang = state.time * 2.1 + (i * Math.PI * 2) / p.droneCount;
        const x = p.x + Math.cos(ang) * 50;
        const y = p.y + Math.sin(ang) * 50;
        drones.push({ x, y, color: p.color });
        p.droneCool[i] -= dt;
        if (p.droneCool[i] <= 0) {
          const t = nearestEnemy({ x, y });
          if (t && dist2({ x, y }, t) < 480 * 480) {
            const a = Math.atan2(t.y - y, t.x - x);
            pBullets.push({
              x, y,
              vx: Math.cos(a) * 560,
              vy: Math.sin(a) * 560,
              r: 4, dmg: p.dmg * 0.5, crit: false, pierce: 0,
              hits: new Set(), owner: p, split: false, life: 0.8,
              color: "#efe7ff",
            });
            p.droneCool[i] = 0.46;
          }
        }
      }
    }
  }

  function updateEnemy(e, dt) {
    if (e.dead) return;
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    e.touchCd = Math.max(0, e.touchCd - dt);
    const target = nearestLiving(e);
    if (!target) return;
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;

    if (e.kind === "dasher") {
      if (e.lunging > 0) {
        e.lunging -= dt;
        e.x += e.lx * dt;
        e.y += e.ly * dt;
      } else if (e.wind > 0) {
        e.wind -= dt;
        if (e.wind <= 0) {
          e.lunging = 0.3;
          e.lx = nx * 580;
          e.ly = ny * 580;
        }
      } else if (d < 360) {
        e.wind = 0.42;
      } else {
        e.x += nx * e.speed * dt;
        e.y += ny * e.speed * dt;
      }
    } else if (e.kind === "spitter") {
      if (d < 200) { e.x -= nx * e.speed * dt; e.y -= ny * e.speed * dt; }
      else if (d > 340) { e.x += nx * e.speed * dt; e.y += ny * e.speed * dt; }
      e.cool -= dt;
      if (e.cool <= 0 && d < 560) {
        eBullet(e.x, e.y, Math.atan2(dy, dx), 255, 11, 7);
        e.cool = Math.max(0.48, 1.15 - state.wave * 0.03);
      }
    } else if (e.kind === "orbiter") {
      e.orbit += dt * 1.5;
      const rad = 200;
      const tx = target.x + Math.cos(e.orbit) * rad;
      const ty = target.y + Math.sin(e.orbit) * rad;
      e.x += (tx - e.x) * Math.min(1, dt * 2.4);
      e.y += (ty - e.y) * Math.min(1, dt * 2.4);
      e.cool -= dt;
      if (e.cool <= 0) {
        eBullet(e.x, e.y, Math.atan2(target.y - e.y, target.x - e.x), 280, 10, 6);
        e.cool = 0.85;
      }
    } else if (e.kind === "boss") {
      if (e.lunging > 0) {
        e.lunging -= dt;
        e.x += e.lx * dt;
        e.y += e.ly * dt;
      } else {
        const slow = e.wind > 0 ? 0.3 : 1;
        e.x += nx * e.speed * slow * dt;
        e.y += ny * e.speed * slow * dt;
      }
      if (e.wind > 0) {
        e.wind -= dt;
        if (e.wind <= 0) {
          e.lunging = 0.42;
          e.lx = nx * 460;
          e.ly = ny * 460;
        }
      } else if (e.lunging <= 0 && e.t > 2.4 && ((e.t / 4.8) | 0) !== e.chargeGate) {
        e.chargeGate = (e.t / 4.8) | 0;
        e.wind = 0.55;
      }
      e.cool -= dt;
      if (e.cool <= 0) {
        const count = e.hp < e.hpMax * 0.5 ? 16 : 12;
        for (let i = 0; i < count; i++) {
          const a = e.orbit + (i / count) * Math.PI * 2;
          eBullet(e.x, e.y, a, e.hp < e.hpMax * 0.5 ? 210 : 165, 12, 8);
        }
        e.orbit += 0.28;
        e.cool = e.hp < e.hpMax * 0.5 ? 1.25 : 2.05;
        audio.tone(90, 0.12, "square", 0.03, 0.7);
      }
    } else {
      e.x += nx * e.speed * dt;
      e.y += ny * e.speed * dt;
    }

    clampEntity(e, e.r);
    if (e.touchCd <= 0 && dist2(e, target) < (e.r + target.r) * (e.r + target.r)) {
      hurt(target, e.touch);
      e.touchCd = 0.55;
    }
  }

  function separateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j];
        if (b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.r + b.r - 2;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < min * min) {
          const d = Math.sqrt(d2);
          const push = (min - d) / 2;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  function updateBullets(dt) {
    for (const b of pBullets) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.x < -30 || b.y < -30 || b.x > VW + 30 || b.y > VH + 30 || hitsPillar(b.x, b.y, b.r)) {
        b.dead = true;
        continue;
      }
      for (const e of enemies) {
        if (e.dead || b.hits.has(e.id)) continue;
        if (dist2(b, e) < (b.r + e.r) * (b.r + e.r)) {
          b.hits.add(e.id);
          damageEnemy(e, b.dmg, b.crit, b.owner, b.split);
          if (b.hits.size > b.pierce) { b.dead = true; break; }
        }
      }
    }
    for (const b of eBullets) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.x < -40 || b.y < -40 || b.x > VW + 40 || b.y > VH + 40 || hitsPillar(b.x, b.y, b.r)) {
        b.dead = true;
        continue;
      }
      for (const p of players) {
        if (p.hp <= 0) continue;
        if (dist2(b, p) < (b.r + p.r) * (b.r + p.r)) {
          hurt(p, b.dmg);
          b.dead = true;
          break;
        }
      }
    }
  }

  function updatePickups(dt) {
    for (const item of pickups) {
      item.life -= dt;
      if (item.life <= 0) { item.dead = true; continue; }
      let closest = null;
      let best = 1e12;
      for (const p of players) {
        if (p.hp <= 0) continue;
        const d = dist2(item, p);
        if (d < best) { best = d; closest = p; }
      }
      if (closest && best < closest.magnet * closest.magnet) {
        const d = Math.sqrt(best) || 1;
        item.x += ((closest.x - item.x) / d) * 220 * dt;
        item.y += ((closest.y - item.y) / d) * 220 * dt;
        if (best < (closest.r + item.r) * (closest.r + item.r)) {
          closest.hp = Math.min(closest.hpMax, closest.hp + item.value);
          item.dead = true;
          floater(closest.x, closest.y - 20, "+" + item.value, "#9cff9c");
          audio.pick();
        }
      }
    }
  }

  function updatePlay(dt) {
    if (state.mode !== "play") return;
    if (state.hitstop > 0) {
      state.hitstop -= dt;
      return;
    }
    state.time += dt;
    state.comboT -= dt;
    if (state.comboT <= 0) state.combo = 0;
    state.calloutT = Math.max(0, state.calloutT - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.shake *= 0.86;

    if (state.phase === "announce") {
      state.announceT -= dt;
      if (state.announceT <= 0) {
        state.phase = "fight";
        state.queue = buildQueue(state.wave);
        state.spawnCd = 0.15;
      }
    } else if (state.queue.length) {
      state.spawnCd -= dt;
      if (state.spawnCd <= 0) {
        spawnEnemy(state.queue.shift());
        state.spawnCd = Math.max(0.1, 0.26 - state.wave * 0.008);
      }
    }

    for (const p of players) updatePlayer(p, dt);
    updateDrones(dt);
    for (const e of enemies) updateEnemy(e, dt);
    separateEnemies();
    updateBullets(dt);
    updatePickups(dt);

    const alive = enemies.some((e) => !e.dead);
    if (state.phase === "fight" && !alive && state.queue.length === 0 && state.mode === "play") {
      openUpgrade();
      return;
    }
    if (state.mode === "play" && humansDead()) gameOver();
  }

  function sweep() {
    function drop(list) {
      for (let i = list.length - 1; i >= 0; i--) if (list[i].dead || list[i].life <= 0) list.splice(i, 1);
    }
    drop(enemies);
    drop(pBullets);
    drop(eBullets);
    drop(pickups);
    drop(ghosts);
    drop(particles);
    drop(floats);
  }

  function updateFx(dt) {
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    for (const f of floats) {
      f.life -= dt;
      f.y += f.vy * dt;
    }
    for (const g of ghosts) g.life -= dt;
  }

  function rollUpgrades() {
    const pool = shuffle(UPGRADES.filter((u) => (state.ranks[u.id] || 0) < u.max));
    const heal = {
      id: "heal",
      name: "Reparatur",
      desc: "Heilt 45 Leben",
      apply(p) { if (p.hp > 0) p.hp = Math.min(p.hpMax, p.hp + 45); },
    };
    const picks = pool.slice(0, 3);
    while (picks.length < 3) picks.push(heal);
    return picks;
  }

  function openUpgrade() {
    state.mode = "upgrade";
    state.picks = rollUpgrades();
    const box = document.getElementById("cards");
    box.replaceChildren();
    state.picks.forEach((u, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.innerHTML = `<span class="card__key">${i + 1}</span><strong></strong><em></em>`;
      btn.querySelector("strong").textContent = u.name;
      btn.querySelector("em").textContent = u.desc;
      btn.addEventListener("click", () => chooseUpgrade(i));
      box.appendChild(btn);
    });
    if (!state.sim) {
      document.getElementById("upgrade").hidden = false;
      document.getElementById("btn-pause").hidden = true;
      audio.tone(660, 0.14, "triangle", 0.04, 1.5);
    }
  }

  function chooseUpgrade(index) {
    if (state.mode !== "upgrade") return;
    const upgrade = state.picks[index] || state.picks[0];
    if (!upgrade) return;
    if (upgrade.id !== "heal") state.ranks[upgrade.id] = (state.ranks[upgrade.id] || 0) + 1;
    for (const p of players) upgrade.apply(p);
    audio.pick();
    beginWave(state.wave + 1);
  }

  function gameOver() {
    if (state.mode === "over") return;
    state.mode = "over";
    audio.boom();
    const title = state.wave >= 10 ? "Legende" : state.wave >= 5 ? "Stark" : "Getroffen";
    document.getElementById("over-title").textContent = title;
    document.getElementById("over-score").textContent = String(state.score);
    document.getElementById("over-stats").textContent =
      `Welle ${state.wave} · ${state.kills} Abschüsse · Combo ${state.bestCombo}`;
    if (!state.sim) {
      show("over");
      document.getElementById("btn-pause").hidden = true;
      const input = document.getElementById("pname");
      if (!input.value) input.value = "DU";
      input.focus();
      input.select();
    }
  }

  function commitScore() {
    if (state.saved) return;
    state.saved = true;
    const name = (document.getElementById("pname").value || "DU").trim().slice(0, 12) || "DU";
    const board = loadBoard();
    board.push({ name, score: state.score, wave: state.wave, combo: state.bestCombo });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem(BOARD_KEY, JSON.stringify(board.slice(0, 8)));
    renderBoard();
  }

  function updateAttract(dt) {
    attractT += dt;
    if (particles.length < 40 && Math.random() < 0.4) {
      particle(rand(VW), rand(VH), Math.random() < 0.5 ? "#5ce1e6" : "#ff3d8a", 20, 1.4, 2);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawShip(x, y, aim, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aim);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-13, 10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-13, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.flash > 0) ctx.fillStyle = "#ffffff";
    else ctx.fillStyle = e.color;
    if (e.kind === "boss") {
      ctx.rotate(e.t * 0.6);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * e.r;
        const py = Math.sin(a) * e.r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.rotate(e.t);
      ctx.strokeStyle = "#ffc857";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.kind === "dasher") {
      ctx.rotate(Math.atan2(e.ly || 1, e.lx || 0));
      ctx.beginPath();
      ctx.moveTo(e.r, 0);
      ctx.lineTo(-e.r, e.r * 0.8);
      ctx.lineTo(-e.r * 0.4, 0);
      ctx.lineTo(-e.r, -e.r * 0.8);
      ctx.closePath();
      ctx.fill();
    } else if (e.kind === "spitter") {
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0b14";
      ctx.beginPath();
      ctx.arc(e.r * 0.3, 0, e.r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === "orbiter") {
      ctx.rotate(e.orbit);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, e.r, 0, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-e.r * 0.75, -e.r * 0.75, e.r * 1.5, e.r * 1.5);
    }
    if (e.wind > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.r + 10 + Math.sin(e.t * 30) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    if (e.kind === "boss" || e.kind === "elite") {
      const w = e.kind === "boss" ? 90 : 40;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w, 6);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - w / 2, e.y - e.r - 16, w * Math.max(0, e.hp / e.hpMax), 6);
    }
  }

  function drawHUD() {
    ctx.textAlign = "left";
    ctx.fillStyle = "#f4fbff";
    ctx.font = "700 22px Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillText("WELLE " + state.wave, 36, 46);
    ctx.textAlign = "center";
    ctx.font = "800 28px Trebuchet MS, Segoe UI, sans-serif";
    ctx.fillStyle = "#ffc857";
    ctx.fillText(String(state.score), VW / 2, 48);
    if (state.combo > 1) {
      ctx.fillStyle = "#ff3d8a";
      ctx.font = "800 22px Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillText("x" + state.combo, VW - 80, 46);
    }
    const boss = enemies.find((e) => e.kind === "boss" && !e.dead);
    if (boss) {
      const w = 420;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(VW / 2 - w / 2, 62, w, 10);
      ctx.fillStyle = "#d946ef";
      ctx.fillRect(VW / 2 - w / 2, 62, w * Math.max(0, boss.hp / boss.hpMax), 10);
    }
    let y = VH - 36 - players.length * 28;
    ctx.font = "700 16px Trebuchet MS, Segoe UI, sans-serif";
    ctx.textAlign = "left";
    for (const p of players) {
      ctx.fillStyle = p.color;
      ctx.fillText(p.name, 36, y);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      roundRect(110, y - 14, 220, 12, 4);
      ctx.fill();
      const fillW = 220 * Math.max(0, p.hp / p.hpMax);
      ctx.fillStyle = p.color;
      if (fillW > 2) {
        roundRect(110, y - 14, fillW, 12, 4);
        ctx.fill();
      }
      if (p.shield > 0) {
        ctx.fillStyle = "#9be7ff";
        ctx.fillText("▣".repeat(p.shield), 340, y);
      }
      y += 28;
    }
    if (state.banner && (state.phase === "announce" || state.announceT > 0)) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, state.announceT));
      ctx.textAlign = "center";
      ctx.font = "800 64px Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillStyle = "#f4fbff";
      ctx.fillText(state.banner, VW / 2, VH / 2);
      ctx.restore();
    }
    if (state.calloutT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, state.calloutT * 2);
      ctx.textAlign = "center";
      ctx.font = "800 42px Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillStyle = "#ff3d8a";
      ctx.fillText(state.callout, VW / 2, VH / 2 + 80);
      ctx.restore();
    }
    if (state.wave === 1 && state.time < 6.5 && state.playKind) {
      ctx.textAlign = "center";
      ctx.font = "600 18px Trebuchet MS, Segoe UI, sans-serif";
      ctx.fillStyle = "rgba(244,251,255,0.8)";
      const hint = state.playKind === "coop"
        ? "Du: WASD + Maus + Umschalt    Freund: Pfeile + Rechts-Umschalt"
        : "WASD bewegen · Maus zielen · Feuer automatisch · Umschalt dasht";
      ctx.fillText(hint, VW / 2, VH - 28);
    }
  }

  function drawWorld() {
    ctx.fillStyle = "#070910";
    ctx.fillRect(0, 0, VW, VH);
    ctx.strokeStyle = "rgba(92,225,230,0.08)";
    ctx.lineWidth = 1;
    const drift = (attractT + state.time) * 24;
    for (let x = -80; x < VW + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x + (drift % 80), 0);
      ctx.lineTo(x + (drift % 80), VH);
      ctx.stroke();
    }
    for (let y = 40; y < VH; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VW, y);
      ctx.stroke();
    }

    for (const o of PILLARS) {
      ctx.fillStyle = "#101624";
      ctx.strokeStyle = "#5ce1e6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (state.mode === "menu") {
      const cx = VW / 2;
      const cy = VH / 2 + 30;
      const demo = [
        { r: 180, speed: 0.7, color: "#5ce1e6", kind: "ship" },
        { r: 280, speed: -0.45, color: "#ff4d6d", kind: "enemy" },
        { r: 340, speed: 0.32, color: "#ff7a3c", kind: "enemy" },
        { r: 230, speed: 0.9, color: "#ffc857", kind: "enemy" },
      ];
      demo.forEach((d, i) => {
        const a = attractT * d.speed + i;
        const x = cx + Math.cos(a) * d.r;
        const y = cy + Math.sin(a * 0.8) * d.r * 0.55;
        if (d.kind === "ship") drawShip(x, y, a + Math.PI / 2, d.color, 1);
        else {
          ctx.fillStyle = d.color;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(a);
          ctx.fillRect(-12, -12, 24, 24);
          ctx.restore();
        }
      });
    }

    for (const g of ghosts) {
      drawShip(g.x, g.y, g.aim, g.color, Math.max(0, g.life / 0.16) * 0.45);
    }
    for (const item of pickups) {
      ctx.fillStyle = "#9cff9c";
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of eBullets) {
      ctx.fillStyle = "#ff8ab8";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of pBullets) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of enemies) if (!e.dead) drawEnemy(e);
    for (const d of drones) {
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of players) {
      if (p.hp <= 0) continue;
      if (p.invuln > 0 && !p.dashing && Math.sin(state.time * 40) > 0) continue;
      for (let i = 0; i < p.shield; i++) {
        ctx.strokeStyle = "rgba(155,231,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26 + i * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawShip(p.x, p.y, p.aim, p.color, 1);
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = "center";
    ctx.font = "800 18px Trebuchet MS, Segoe UI, sans-serif";
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life / 0.7);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    if (state.mode === "play" || state.mode === "upgrade" || state.mode === "pause" || state.mode === "over") drawHUD();

    const human = players.find((p) => p.human && p.slot === 1) || players[0];
    const low = human && human.hp > 0 ? 1 - human.hp / human.hpMax : 0;
    const g = ctx.createRadialGradient(VW / 2, VH / 2, 220, VW / 2, VH / 2, 760);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, low > 0.55 ? "rgba(90,0,20,0.45)" : "rgba(0,0,0,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,80,110,${state.flash})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    viewScale = Math.min(window.innerWidth / VW, window.innerHeight / VH);
    viewOx = (window.innerWidth - VW * viewScale) / 2;
    viewOy = (window.innerHeight - VH * viewScale) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function worldFromClient(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewOx) / viewScale,
      y: (clientY - rect.top - viewOy) / viewScale,
    };
  }

  function render() {
    ctx.setTransform(canvas.width / window.innerWidth, 0, 0, canvas.height / window.innerHeight, 0, 0);
    ctx.fillStyle = "#05070d";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    if (!reduceMotion && state.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
    }
    ctx.translate(viewOx, viewOy);
    ctx.scale(viewScale, viewScale);
    drawWorld();
    ctx.restore();
  }

  function frame(ts) {
    if (!frame.last) frame.last = ts;
    const dt = Math.min(0.05, (ts - frame.last) / 1000);
    frame.last = ts;
    if (!document.hidden) {
      if (state.mode === "menu") updateAttract(dt);
      else if (state.mode === "play") updatePlay(dt);
      if (state.mode !== "menu") updateFx(dt);
      else updateFx(dt);
      sweep();
      render();
    }
    requestAnimationFrame(frame);
  }

  function selectChar(id) {
    if (!CHARACTERS[id]) return;
    state.character = id;
    document.querySelectorAll(".char").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.char === id);
    });
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    document.getElementById("btn-mute").textContent = audio.muted ? "Ton aus" : "Ton an";
    if (audio.muted) audio.stopMusic();
    else if (state.mode === "play") audio.startMusic();
  }

  function bind() {
    document.querySelectorAll(".char").forEach((btn) => {
      btn.addEventListener("click", () => selectChar(btn.dataset.char));
    });
    document.getElementById("btn-solo").addEventListener("click", () => startGame("solo"));
    document.getElementById("btn-ki").addEventListener("click", () => startGame("ki"));
    document.getElementById("btn-coop").addEventListener("click", () => startGame("coop"));
    document.getElementById("btn-pause").addEventListener("click", () => {
      if (state.mode !== "play") return;
      state.mode = "pause";
      show("pause");
    });
    document.getElementById("btn-resume").addEventListener("click", () => {
      if (state.mode !== "pause") return;
      state.mode = "play";
      show(null);
      document.getElementById("menu").hidden = true;
      document.getElementById("upgrade").hidden = true;
      document.getElementById("pause").hidden = true;
      document.getElementById("over").hidden = true;
      document.getElementById("btn-pause").hidden = false;
    });
    document.getElementById("btn-quit").addEventListener("click", () => showMenu());
    document.getElementById("btn-again").addEventListener("click", () => {
      commitScore();
      startGame(lastKind);
    });
    document.getElementById("btn-menu").addEventListener("click", () => {
      commitScore();
      showMenu();
    });
    document.getElementById("btn-mute").addEventListener("click", toggleMute);
    document.getElementById("pname").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitScore();
        startGame(lastKind);
      }
    });

    window.addEventListener("keydown", (e) => {
      keys.add(e.code);
      if (e.code === "ShiftRight") keys.add("ShiftRight");
      if (e.code === "ShiftLeft") keys.add("ShiftLeft");
      const typing = document.activeElement && document.activeElement.tagName === "INPUT";
      if (typing) return;
      if (state.mode === "play" && (e.code === "Space" || e.code.startsWith("Arrow"))) e.preventDefault();
      if (e.code === "KeyM") toggleMute();
      if (e.code === "Escape") {
        if (state.mode === "play") {
          state.mode = "pause";
          show("pause");
        } else if (state.mode === "pause") {
          document.getElementById("btn-resume").click();
        }
      }
      if (state.mode === "menu" && e.code === "Enter" && (!document.activeElement || document.activeElement.tagName !== "BUTTON")) {
        startGame("solo");
      }
      if (state.mode === "menu" && e.code === "Digit1") selectChar("funke");
      if (state.mode === "menu" && e.code === "Digit2") selectChar("hammer");
      if (state.mode === "menu" && e.code === "Digit3") selectChar("geist");
      if (state.mode === "upgrade" && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3")) {
        chooseUpgrade(Number(e.code.slice(-1)) - 1);
      }
    });
    window.addEventListener("keyup", (e) => {
      keys.delete(e.code);
    });
    window.addEventListener("mousemove", (e) => {
      const p = worldFromClient(e.clientX, e.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
    });
    window.addEventListener("blur", () => keys.clear());
    window.addEventListener("resize", resize);

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      const p = worldFromClient(e.clientX, e.clientY);
      const left = e.clientX < window.innerWidth * 0.45;
      if (e.pointerType === "touch" && left) {
        touch.moveActive = true;
        touch.idMove = e.pointerId;
        touch.sx = p.x;
        touch.sy = p.y;
        touch.mx = 0;
        touch.my = 0;
      } else if (e.pointerType === "touch") {
        const now = performance.now();
        if (now - (touch.lastAim || 0) < 280) touch.wantDash = true;
        touch.lastAim = now;
        touch.aimActive = true;
        touch.idAim = e.pointerId;
        touch.ax = p.x;
        touch.ay = p.y;
      } else {
        mouse.x = p.x;
        mouse.y = p.y;
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      const p = worldFromClient(e.clientX, e.clientY);
      if (touch.moveActive && e.pointerId === touch.idMove) {
        const mv = normalize((p.x - touch.sx) / 70, (p.y - touch.sy) / 70);
        touch.mx = mv.x;
        touch.my = mv.y;
      } else if (touch.aimActive && e.pointerId === touch.idAim) {
        touch.ax = p.x;
        touch.ay = p.y;
      } else if (e.pointerType !== "touch") {
        mouse.x = p.x;
        mouse.y = p.y;
      }
    });
    function endPointer(e) {
      if (e.pointerId === touch.idMove) {
        touch.moveActive = false;
        touch.mx = 0;
        touch.my = 0;
      }
      if (e.pointerId === touch.idAim) touch.aimActive = false;
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
  }

  function runSim() {
    startGame("solo", { silent: true });
    for (let i = 0; i < 20 * 60; i++) {
      if (state.mode === "over") break;
      if (state.mode === "upgrade") chooseUpgrade(0);
      if (state.mode !== "play") continue;
      updatePlay(1 / 60);
      updateFx(1 / 60);
      sweep();
      for (const e of enemies) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) throw new Error("enemy nan");
      }
      for (const p of players) {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error("player nan");
      }
    }
    if (state.kills < 1) throw new Error("no kills");
    if (!(state.score > 0)) throw new Error("no score");
    const summary = `ok kills=${state.kills} score=${state.score} wave=${state.wave}`;
    state.sim = false;
    return summary;
  }

  function boot() {
    resize();
    bind();
    renderBoard();
    const params = new URLSearchParams(location.search);
    if (params.has("sim")) {
      const el = document.getElementById("sim");
      try {
        el.textContent = runSim();
      } catch (err) {
        el.textContent = "ERR " + (err && err.stack ? err.stack : err);
      }
      el.hidden = false;
      showMenu();
    }
    requestAnimationFrame(frame);
  }

  boot();
})();
