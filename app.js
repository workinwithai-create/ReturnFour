const CDN = "https://cdn.jsdelivr.net/gh/workinwithai-create/PreEight@main/public/samples";
const STEPS = 16;
const PREV = 4;
const RET = 4;
const CHORUS = 4;
const recipes = [
  { id:"walk-back", name:"Walk back", blurb:"Upright walks the roots home over four bars. Chorus lands on purpose." },
  { id:"kit-rebuild", name:"Kit rebuild", blurb:"Hats thin, snare ghost, kick opens. Energy returns without a slam." },
  { id:"brass-settle", name:"Brass settle", blurb:"Trumpet holds then answers the last bridge chord into the hook." },
  { id:"bass-land", name:"Bass land", blurb:"Finger bass drops an octave and sits on the tonic before 1." },
  { id:"piano-resolve", name:"Piano resolve", blurb:"Grand plays a quiet V–I figure. No new hook yet." },
  { id:"nylon-home", name:"Nylon home", blurb:"One nylon arpeggio across the barline. Live, not a MIDI scale." },
  { id:"violin-bed", name:"Violin bed", blurb:"Soft violin holds the third and leans into the tonic." },
  { id:"half-time", name:"Half-time return", blurb:"Pocket halves. Space opens. Chorus hits with air." },
  { id:"stop-then-home", name:"Stop then home", blurb:"Two hits, two bars of air, then the chorus returns human." },
  { id:"full-return", name:"Full return", blurb:"Everyone writes four bars of approach home. No new material." }
];
function bar(symbol, piano, guitar, bass){ return { symbol, piano, guitar, bass }; }
const grooves = [
  { id:"amber", name:"Amber Room", bpm:96, key:"A minor",
    prev:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)],
    ret:[bar("F",[41,45,48,53],[41,48,53],41),bar("G",[43,47,50,55],[43,47,50],31),bar("E7",[40,44,47,50],[40,47,50],28),bar("Am",[45,48,52,57],[45,52,57],33)],
    chorus:[bar("Am",[45,48,52,57],[45,52,57],33),bar("F",[41,45,48,53],[41,48,53],41),bar("C",[48,52,55,60],[48,52,55],36),bar("G",[43,47,50,55],[43,47,50],31)] },
  { id:"porch", name:"Porch Light", bpm:88, key:"E major",
    prev:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)],
    ret:[bar("A",[33,37,40,45],[33,40,45],33),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("B",[35,39,42,47],[35,42,47],23)],
    chorus:[bar("E",[40,44,47,52],[40,47,52],28),bar("B",[35,39,42,47],[35,42,47],23),bar("C#m",[44,47,51,56],[44,51,56],32),bar("A",[33,37,40,45],[33,40,45],33)] },
  { id:"fold", name:"Fold Night", bpm:102, key:"D minor",
    prev:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)],
    ret:[bar("Bb",[34,38,41,46],[34,41,46],34),bar("C",[36,40,43,48],[36,43,48],24),bar("A7",[33,37,40,43],[33,40,43],33),bar("Dm",[38,41,45,50],[38,45,50],26)],
    chorus:[bar("Dm",[38,41,45,50],[38,45,50],26),bar("Bb",[34,38,41,46],[34,41,46],34),bar("F",[41,45,48,53],[41,48,53],29),bar("C",[36,40,43,48],[36,43,48],24)] }
];
const state = { groove: grooves[0], recipe: recipes[0], playing: false, bar: -1, mode: null };
let ctx, bus, buffers = {}, timer = null;

const sampleMap = {
  pC4: "piano/C4.mp3", pA3: "piano/A3.mp3", pE3: "piano/E3.mp3", pG3: "piano/G3.mp3",
  gA2: "guitar/A2.mp3", gE3: "guitar/E3.mp3", gC3: "guitar/C3.mp3",
  bA1: "bass/A1.mp3", bC2: "bass/C2.mp3", bE1: "bass/E1.mp3",
  tC4: "trumpet/C4.mp3", tG3: "trumpet/G3.mp3",
  vA3: "violin/A3.mp3", vE4: "violin/E4.mp3",
  kick: "drums/kick.mp3", snare: "drums/snare.mp3", hat: "drums/hihat.mp3", crash: "drums/crash.mp3"
};

async function load() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  bus = ctx.createGain(); bus.gain.value = 0.85; bus.connect(ctx.destination);
  const keys = Object.keys(sampleMap);
  let loaded = 0;
  document.getElementById("status").textContent = `Seating chairs… 0/${keys.length}`;
  await Promise.all(keys.map(async (k) => {
    try {
      const r = await fetch(`${CDN}/${sampleMap[k]}`);
      const ab = await r.arrayBuffer();
      buffers[k] = await ctx.decodeAudioData(ab);
    } catch (e) { console.warn("miss", k, e); }
    loaded++;
    document.getElementById("status").textContent = `Seating chairs… ${loaded}/${keys.length}`;
  }));
  document.getElementById("status").textContent = "Chairs seated · live FluidR3 + kit";
}

function playBuf(name, when, rate = 1, gain = 0.4) {
  const b = buffers[name]; if (!b || !ctx) return;
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
  const g = ctx.createGain(); g.gain.value = gain; src.connect(g); g.connect(bus); src.start(when);
}
function rateFromMidi(midi, baseMidi) { return Math.pow(2, (midi - baseMidi) / 12); }
function zone(i) {
  if (i < PREV) return "prev";
  if (i < PREV + RET) return "return";
  return "chorus";
}
function chordAt(i) {
  if (i < PREV) return state.groove.prev[i];
  if (i < PREV + RET) return state.groove.ret[i - PREV];
  return state.groove.chorus[i - PREV - RET];
}

function scheduleBar(barIndex, t0, stepDur) {
  const ch = chordAt(barIndex); const z = zone(barIndex); const rec = state.recipe.id;
  const onRet = z === "return";
  for (let s = 0; s < STEPS; s++) {
    const when = t0 + s * stepDur;
    if (onRet && rec === "stop-then-home") {
      if (barIndex === PREV || barIndex === PREV + 1) {
        if (s === 0) playBuf("kick", when, 1, 0.35);
        if (s === 8) playBuf("snare", when, 1, 0.2);
      }
      continue;
    }
    if (onRet && rec === "half-time") {
      if (s === 0) playBuf("kick", when, 1, 0.55);
      if (s === 8) playBuf("snare", when, 1, 0.35);
      if (s % 4 === 0) playBuf("hat", when, 1, 0.04);
    } else if (onRet && rec === "kit-rebuild") {
      if (s === 0) playBuf("kick", when, 1, 0.45);
      if (s === 8) playBuf("snare", when, 1, 0.22);
      if (s === 12) playBuf("snare", when, 1.02, 0.12);
      if (s % 2 === 0) playBuf("hat", when, 1, 0.05);
    } else if (z === "chorus") {
      if (s === 0) { playBuf("kick", when, 1, 0.72); playBuf("crash", when, 1, 0.18); }
      if (s === 8) playBuf("snare", when, 1, 0.48);
      if (s % 2 === 0) playBuf("hat", when, 1, 0.07);
    } else {
      if (s === 0) playBuf("kick", when, 1, 0.58);
      if (s === 8) playBuf("snare", when, 1, 0.36);
      if (s % 2 === 0) playBuf("hat", when, 1, onRet ? 0.05 : 0.06);
    }
    if (s === 0) {
      const pGain = onRet && rec === "piano-resolve" ? 0.32 : 0.22;
      playBuf("pC4", when, rateFromMidi(ch.piano[2] || 60, 60), pGain);
      playBuf("pA3", when, rateFromMidi(ch.piano[1] || 57, 57), 0.16);
      playBuf("bA1", when, rateFromMidi(ch.bass, 33), onRet ? 0.48 : 0.38);
      playBuf("gA2", when, rateFromMidi(ch.guitar[0] || 45, 45), onRet ? 0.18 : 0.16);
    }
    if (onRet && rec === "walk-back" && (s === 4 || s === 8 || s === 12)) {
      const step = s === 4 ? 2 : s === 8 ? 5 : 7;
      playBuf("bA1", when, rateFromMidi(ch.bass + step, 33), 0.42);
    }
    if (onRet && rec === "bass-land" && (s === 0 || s === 8)) {
      playBuf("bC2", when, rateFromMidi(ch.bass - 12, 36), 0.5);
    }
    if (onRet && rec === "piano-resolve" && (s === 4 || s === 12)) {
      playBuf("pC4", when, rateFromMidi((ch.piano[2] || 60) + (s === 4 ? 2 : 0), 60), 0.18);
    }
    if (onRet && rec === "brass-settle" && (s === 0 || s === 8)) {
      playBuf("tC4", when, rateFromMidi((ch.piano[2] || 60) + 5, 60), 0.24);
    }
    if (onRet && rec === "violin-bed" && (s === 0 || s === 8)) {
      playBuf("vA3", when, rateFromMidi(ch.piano[1] || 57, 57), 0.2);
    }
    if (onRet && rec === "nylon-home" && (s === 0 || s === 6 || s === 12)) {
      playBuf("gE3", when, rateFromMidi((ch.guitar[0] || 45) + Math.floor(s / 4), 52), 0.24);
    }
    if (onRet && rec === "full-return" && s === 8) {
      playBuf("tC4", when, rateFromMidi(ch.piano[2] || 60, 60), 0.16);
      playBuf("vA3", when, rateFromMidi(ch.piano[1] || 57, 57), 0.12);
    }
  }
}

function stop() {
  state.playing = false; state.mode = null;
  if (timer) clearTimeout(timer); timer = null;
  paintBars();
}

async function play(mode) {
  if (!ctx) await load();
  if (ctx.state === "suspended") await ctx.resume();
  stop(); state.playing = true; state.mode = mode;
  const startBar = mode === "return" ? PREV : 0;
  const endBar = mode === "loop" ? PREV : mode === "return" ? PREV + RET : PREV + RET + CHORUS;
  const stepDur = 60 / state.groove.bpm / 4;
  let barIndex = startBar;
  const tick = () => {
    if (!state.playing) return;
    if (barIndex >= endBar) {
      if (mode === "loop") barIndex = startBar;
      else { stop(); return; }
    }
    state.bar = barIndex; paintBars();
    scheduleBar(barIndex, ctx.currentTime + 0.02, stepDur);
    barIndex += 1;
    timer = setTimeout(tick, STEPS * stepDur * 1000);
  };
  tick();
}

function punch() {
  const g = state.groove, r = state.recipe;
  return `ReturnFour punch list\n${g.name} · ${g.bpm} BPM · ${g.key} · ${r.name}\n\nThe problem: after the bridge or solo the chorus slams back cold. Session players write four live bars of return so the song comes home earned.\nThe move: ${r.blurb}\n\nPrevious section (bars 1-4)\n${g.prev.map((b, i) => `  ${i + 1}. ${b.symbol}`).join("\n")}\n\nReturn (bars 5-8) — ${r.name}\n${g.ret.map((b, i) => `  ${i + 5}. ${b.symbol}`).join("\n")}\n\nChorus lands (bars 9-12)\n${g.chorus.map((b, i) => `  ${i + 9}. ${b.symbol}`).join("\n")}\n\nLive chairs only (FluidR3 piano, upright, nylon, trumpet, violin + kit). Distinct from PickupTwo, TagFour, HoldFour, DieTwice, ThinFour, PreEight, AfterHook, EndEight, LastHook, LiftTwo.\nDrop the WAV on bars 5-8. Do not hard-cut the bridge into the chorus.`;
}

function paintGrooves() {
  const el = document.getElementById("grooves"); el.innerHTML = "";
  grooves.forEach(g => {
    const b = document.createElement("button");
    b.className = "card" + (state.groove.id === g.id ? " on" : "");
    b.innerHTML = `<b>${g.name}</b><span>${g.bpm} BPM · ${g.key}</span>`;
    b.onclick = () => { state.groove = g; render(); };
    el.appendChild(b);
  });
}
function paintRecipes() {
  const el = document.getElementById("recipes"); el.innerHTML = "";
  recipes.forEach(r => {
    const b = document.createElement("button");
    b.className = "card" + (state.recipe.id === r.id ? " on" : "");
    b.innerHTML = `<b>${r.name}</b><span>${r.blurb}</span>`;
    b.onclick = () => { state.recipe = r; render(); };
    el.appendChild(b);
  });
}
function paintBars() {
  const el = document.getElementById("bars"); el.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const ch = chordAt(i); const z = zone(i);
    const d = document.createElement("div");
    d.className = "bar" + (z === "return" ? " ret" : "") + (z === "chorus" ? " chorus" : "") + (state.playing && state.bar === i ? " active" : "");
    const tag = z === "prev" ? "P" : z === "return" ? "R" : "C";
    d.innerHTML = `<div class="n">${i + 1} · ${tag}</div><div class="c">${ch.symbol}</div>`;
    el.appendChild(d);
  }
}
function render() {
  paintGrooves(); paintRecipes(); paintBars();
  document.getElementById("punch").textContent = punch();
}

document.getElementById("playA").onclick = () => play("loop");
document.getElementById("playB").onclick = () => play("cut");
document.getElementById("playR").onclick = () => play("return");
document.getElementById("stop").onclick = stop;
document.getElementById("copy").onclick = () => navigator.clipboard.writeText(punch());
render();
load();
