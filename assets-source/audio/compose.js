// Original music and ambience for Eco City, rendered offline with Web Audio.
// Run through scripts/render-audio.mjs (headless Chromium); output is encoded
// to MP3 in public/assets/audio. Everything here is synthesized: no samples.
const midiHz = m => 440 * 2 ** ((m - 69) / 12);
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

function reverb(ctx, seconds, decay, seed = 7) {
  const rand = rng(seed), len = Math.floor(ctx.sampleRate * seconds), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (rand() * 2 - 1) * (1 - i / len) ** decay; }
  const node = ctx.createConvolver(); node.buffer = ir; return node;
}
function noiseBuffer(ctx, seconds, seed = 3) {
  const rand = rng(seed), b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1; return b;
}
function brownBuffer(ctx, seconds, seed = 11) {
  const rand = rng(seed), b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate), d = b.getChannelData(0); let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + .02 * (rand() * 2 - 1)) / 1.02; d[i] = last * 3.5; } return b;
}
function panner(ctx, pan, dest) { const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(dest); return p; }

function instruments(ctx, out, wet) {
  const noise = noiseBuffer(ctx, 2);
  const send = (node, amount) => { const g = ctx.createGain(); g.gain.value = amount; node.connect(g); g.connect(wet); };
  return {
    marimba(t, m, vel = .5, pan = 0, dest = out) {
      const f = midiHz(m), g = ctx.createGain(), p = panner(ctx, pan, dest); g.connect(p); send(g, .35);
      for (const [ratio, amp, decay] of [[1, 1, .55], [3.93, .18, .09], [9.2, .05, .03]]) {
        const o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.value = f * ratio;
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel * amp, t + .004); e.gain.exponentialRampToValueAtTime(.0001, t + decay * (m < 70 ? 1.4 : 1));
        o.connect(e); e.connect(g); o.start(t); o.stop(t + 1.2);
      }
    },
    kalimba(t, m, vel = .45, pan = 0) {
      const f = midiHz(m), car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), e = ctx.createGain(), p = panner(ctx, pan, out);
      car.frequency.value = f; mod.frequency.value = f * 5.02; mg.gain.setValueAtTime(f * 1.6, t); mg.gain.exponentialRampToValueAtTime(f * .02, t + .25);
      mod.connect(mg); mg.connect(car.frequency); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel, t + .006); e.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
      car.connect(e); e.connect(p); send(e, .55); car.start(t); mod.start(t); car.stop(t + 1.7); mod.stop(t + 1.7);
    },
    flute(t, m, dur, vel = .22, pan = .1) {
      const f = midiHz(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), e = ctx.createGain(), lp = ctx.createBiquadFilter(), p = panner(ctx, pan, out);
      o.frequency.value = f; o2.frequency.value = f * 2; o2.type = 'triangle'; const o2g = ctx.createGain(); o2g.gain.value = .12;
      vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .006, t + Math.min(dur, .6));
      vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency); lp.frequency.value = 3200;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel, t + .08); e.gain.setValueAtTime(vel * .85, t + Math.max(.09, dur - .12)); e.gain.linearRampToValueAtTime(0, t + dur + .15);
      const br = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), bg = ctx.createGain(); br.buffer = noise; bf.type = 'bandpass'; bf.frequency.value = f * 2; bf.Q.value = 2; bg.gain.value = .25;
      br.connect(bf); bf.connect(bg); bg.connect(e);
      o.connect(lp); o2.connect(o2g); o2g.connect(lp); lp.connect(e); e.connect(p); send(e, .6);
      for (const n of [o, o2, vib, br]) { n.start(t); n.stop(t + dur + .2); }
    },
    pad(t, notes, dur, vel = .06) {
      const lp = ctx.createBiquadFilter(), e = ctx.createGain(); lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1500, t + dur * .6); lp.Q.value = .4;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel, t + .9); e.gain.setValueAtTime(vel, t + dur - .2); e.gain.linearRampToValueAtTime(0, t + dur + 1.2);
      lp.connect(e); e.connect(out); send(e, .9);
      notes.forEach((m, i) => { for (const [det, pan] of [[-7, -.5], [6, .5]]) {
        const o = ctx.createOscillator(), p = ctx.createStereoPanner(); o.type = 'sawtooth'; o.frequency.value = midiHz(m); o.detune.value = det + i; p.pan.value = pan;
        o.connect(p); p.connect(lp); o.start(t); o.stop(t + dur + 1.3); } });
    },
    bass(t, m, dur, vel = .32) {
      const f = midiHz(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), e = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.frequency.value = f; o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = ctx.createGain(); g2.gain.value = .35; lp.frequency.value = 900;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel, t + .012); e.gain.exponentialRampToValueAtTime(vel * .45, t + .35); e.gain.setValueAtTime(vel * .45, t + dur - .05); e.gain.linearRampToValueAtTime(0, t + dur + .08);
      o.connect(e); o2.connect(g2); g2.connect(e); e.connect(lp); lp.connect(out); o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1);
    },
    kick(t, vel = .55) {
      const o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(48, t + .12);
      e.gain.setValueAtTime(vel, t); e.gain.exponentialRampToValueAtTime(.0001, t + .35); o.connect(e); e.connect(out); o.start(t); o.stop(t + .4);
    },
    rim(t, vel = .16, pan = -.15) {
      const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), e = ctx.createGain(), p = panner(ctx, pan, out); s.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 1.2;
      e.gain.setValueAtTime(vel, t); e.gain.exponentialRampToValueAtTime(.0001, t + .13); s.connect(bp); bp.connect(e); e.connect(p); send(e, .4); s.start(t, Math.random()); s.stop(t + .15);
      const o = ctx.createOscillator(), oe = ctx.createGain(); o.frequency.value = 820; oe.gain.setValueAtTime(vel * .5, t); oe.gain.exponentialRampToValueAtTime(.0001, t + .04); o.connect(oe); oe.connect(p); o.start(t); o.stop(t + .05);
    },
    shaker(t, vel = .05, pan = .3) {
      const s = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), e = ctx.createGain(), p = panner(ctx, pan, out); s.buffer = noise; hp.type = 'highpass'; hp.frequency.value = 6500;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel, t + .012); e.gain.exponentialRampToValueAtTime(.0001, t + .07); s.connect(hp); hp.connect(e); e.connect(p); s.start(t, (t * 7.3) % 1.5); s.stop(t + .09);
    },
    bell(t, m, vel = .12, pan = 0) {
      const f = midiHz(m), p = panner(ctx, pan, out);
      for (const [r, a, d] of [[1, 1, 1.8], [2.76, .35, .7], [5.4, .12, .3]]) { const o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.value = f * r;
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(vel * a, t + .003); e.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(e); e.connect(p); send(e, .8); o.start(t); o.stop(t + d + .05); }
    },
  };
}
function mixBus(ctx) {
  const master = ctx.createGain(), comp = ctx.createDynamicsCompressor(), wet = ctx.createGain(), rv = reverb(ctx, 2.8, 2.6);
  comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  master.gain.value = .8; wet.gain.value = .32; wet.connect(rv); rv.connect(comp); master.connect(comp); comp.connect(ctx.destination);
  return { out: master, wet };
}

const chords = { F: { root: 41, pad: [57, 60, 64, 67], arp: [65, 69, 72, 76, 79] }, Dm: { root: 38, pad: [57, 60, 62, 65], arp: [62, 65, 69, 72, 74] },
  Bb: { root: 34, pad: [57, 58, 62, 65], arp: [62, 65, 69, 70, 74] }, C: { root: 36, pad: [55, 60, 62, 67], arp: [60, 64, 67, 72, 74] },
  Csus: { root: 36, pad: [55, 58, 60, 65], arp: [60, 65, 67, 70, 72] }, Am: { root: 33, pad: [55, 60, 64, 67], arp: [64, 67, 69, 72, 76] },
  Gm: { root: 31, pad: [55, 58, 62, 65], arp: [62, 65, 67, 70, 74] } };
const A = ['F', 'Dm', 'Bb', 'Csus', 'F', 'Am', 'Bb', 'C'], B = ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C', 'F', 'F'];
// [beat, midi, beats] over two-bar phrases.
const melodyA = [
  [[0, 72, 1], [1, 69, .5], [1.5, 72, .5], [2, 74, 1.5], [3.5, 72, .5], [4, 69, 2], [6, 67, 1], [7, 65, 1]],
  [[0, 65, .5], [.5, 67, .5], [1, 69, 1], [2, 72, 1], [3, 74, 1], [4, 76, 1.5], [5.5, 74, .5], [6, 72, 2]],
  [[0, 72, 1], [1, 69, .5], [1.5, 72, .5], [2, 77, 1.5], [3.5, 76, .5], [4, 72, 2], [6, 69, 1], [7, 67, 1]],
  [[0, 69, .5], [.5, 70, .5], [1, 72, 1], [2, 74, 1], [3, 67, 1], [4, 72, 3]]];
const melodyB = [
  [[0, 74, 1.5], [1.5, 77, .5], [2, 76, 1], [3, 74, 1], [4, 76, 1.5], [5.5, 79, .5], [6, 77, 1], [7, 76, 1]],
  [[0, 72, 1.5], [1.5, 76, .5], [2, 74, 1], [3, 72, 1], [4, 69, 1.5], [5.5, 72, .5], [6, 74, 2]],
  [[0, 70, 1], [1, 74, 1], [2, 77, 1.5], [3.5, 76, .5], [4, 74, 1], [5, 72, 1], [6, 70, 1], [7, 67, 1]],
  [[0, 69, 1], [1, 72, 1], [2, 77, 3]]];

export async function renderTheme() {
  const bpm = 96, beat = 60 / bpm, bar = beat * 4, bars = 32, length = bars * bar, tail = 4, sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil((length + tail) * sr), sr), { out, wet } = mixBus(ctx), I = instruments(ctx, out, wet);
  const form = [...A.slice(0, 4), ...A, ...B, ...A, ...['Bb', 'C', 'F', 'F']];
  const rand = rng(42);
  form.forEach((name, b) => {
    const c = chords[name], t = b * bar, intro = b < 4, outro = b >= 28, section = intro ? 'intro' : outro ? 'outro' : b < 12 ? 'A' : b < 20 ? 'B' : 'A2';
    I.pad(t, c.pad, bar, intro || outro ? .05 : .04);
    const pattern = [0, 2, 1, 3, 2, 4, 3, 1];
    pattern.forEach((idx, i) => { if ((intro || outro) && i % 2) return; I.marimba(t + i * beat / 2, c.arp[idx] - (section === 'B' ? 0 : 12), (i % 4 ? .18 : .26) * (outro ? 1 - (b - 28) / 5 : 1), i % 2 ? .35 : -.35); });
    if (!intro) { const bl = outro ? bar : beat * 2.5; I.bass(t, c.root + 12, bl - .05); if (!outro) I.bass(t + beat * 2.5, c.root + (b % 2 ? 19 : 12), beat * 1.4); }
    for (let s = 0; s < 16; s++) { const swing = s % 2 ? beat * .06 : 0; I.shaker(t + s * beat / 4 + swing, (s % 4 === 2 ? .035 : .02) * (intro ? .7 : 1)); }
    if (!intro && !outro) { I.kick(t); I.kick(t + beat * 2, .45); if (b % 4 === 3) I.kick(t + beat * 3.5, .3); I.rim(t + beat, .12); I.rim(t + beat * 3, .14); }
    if (section === 'B' && b % 2 === 0) I.bell(t + beat * 3.5, c.arp[4] + 12, .05, .4);
    if (b === 3 || b === 27) for (let i = 0; i < 6; i++) I.bell(t + beat * 2 + i * beat / 3, [72, 74, 77, 79, 81, 84][i], .045, -.4 + i * .16);
  });
  const phrase = (notes, start, voice) => notes.forEach(([at, m, len]) => {
    const t = start + at * beat;
    if (voice === 'kalimba') I.kalimba(t, m, .36, -.1);
    else if (voice === 'flute') I.flute(t, m, len * beat, .16);
    else { I.marimba(t, m + 12, .22, .2); if (len >= 1) I.kalimba(t, m, .16, -.2); }
  });
  melodyA.forEach((p, i) => phrase(p, (4 + i * 2) * bar, 'kalimba'));
  melodyB.forEach((p, i) => phrase(p, (12 + i * 2) * bar, 'flute'));
  melodyA.forEach((p, i) => phrase(p, (20 + i * 2) * bar, 'lead'));
  // Soft counter-melody answering in the last A.
  for (let b = 20; b < 28; b++) if (b % 2) I.kalimba(b * bar + beat * 2.5 + rand() * .01, chords[form[b]].arp[3], .12, .5);
  return { buffer: await ctx.startRendering(), loop: length };
}

export async function renderJingle() {
  const sr = 44100, ctx = new OfflineAudioContext(2, sr * 4, sr), { out, wet } = mixBus(ctx), I = instruments(ctx, out, wet);
  I.pad(0, [57, 60, 64, 67], 1.6, .07);
  [65, 69, 72, 77, 81].forEach((m, i) => { I.marimba(.02 + i * .11, m, .42, -.4 + i * .2); });
  I.kalimba(.62, 84, .35); I.bell(.62, 89, .08, .3); I.bell(.8, 93, .05, -.3); I.bass(.02, 41, .9, .3); I.kick(.02, .4);
  return { buffer: await ctx.startRendering(), loop: 0 };
}

export async function renderAmbience() {
  const sr = 44100, length = 48, tail = 3, ctx = new OfflineAudioContext(2, (length + tail) * sr, sr), rand = rng(5);
  const bus = ctx.createGain(); bus.gain.value = .9; bus.connect(ctx.destination);
  const wet = ctx.createGain(), rv = reverb(ctx, 2.2, 3, 19); wet.gain.value = .5; wet.connect(rv); rv.connect(bus);
  // Distant city hum: brown noise, band-limited, slowly breathing.
  const hum = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), hg = ctx.createGain(); hum.buffer = brownBuffer(ctx, length + tail); lp.frequency.value = 380; hg.gain.value = .35;
  for (let t = 0; t < length + tail; t += 4) hg.gain.linearRampToValueAtTime(.26 + rand() * .16, t + 4);
  hum.connect(lp); lp.connect(hg); hg.connect(bus); hum.start(0);
  // Leaves and breeze.
  const air = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ag = ctx.createGain(); air.buffer = noiseBuffer(ctx, length + tail, 23); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .5; ag.gain.value = .0;
  for (let t = 0; t < length + tail; t += 3) { ag.gain.linearRampToValueAtTime(.006 + rand() * .018, t + 3); bp.frequency.linearRampToValueAtTime(1200 + rand() * 1600, t + 3); }
  const ap = panner(ctx, .2, bus); air.connect(bp); bp.connect(ag); ag.connect(ap); air.start(0);
  // Passing cars: filtered noise swells panning across.
  const cars = noiseBuffer(ctx, 6, 31);
  for (let t = 1.5; t < length; t += 5 + rand() * 6) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner(), d = 3.5 + rand() * 2, dir = rand() > .5 ? 1 : -1;
    s.buffer = cars; f.type = 'lowpass'; f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(900, t + d / 2); f.frequency.linearRampToValueAtTime(300, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 + rand() * .05, t + d / 2); g.gain.linearRampToValueAtTime(0, t + d);
    p.pan.setValueAtTime(-.8 * dir, t); p.pan.linearRampToValueAtTime(.8 * dir, t + d); s.connect(f); f.connect(g); g.connect(p); p.connect(bus); s.start(t); s.stop(t + d);
  }
  // Birds: short frequency-modulated chirps in small groups.
  for (let t = .8; t < length; t += 2.5 + rand() * 5) {
    const pan = rand() * 1.6 - .8, base = 2600 + rand() * 1800, notes = 2 + Math.floor(rand() * 4), p = panner(ctx, pan, bus);
    for (let n = 0; n < notes; n++) {
      const at = t + n * (.09 + rand() * .07), o = ctx.createOscillator(), e = ctx.createGain(), len = .05 + rand() * .06, hi = base * (1 + rand() * .35);
      o.frequency.setValueAtTime(hi, at); o.frequency.exponentialRampToValueAtTime(base * (.75 + rand() * .2), at + len);
      e.gain.setValueAtTime(0, at); e.gain.linearRampToValueAtTime(.022 + rand() * .02, at + .01); e.gain.exponentialRampToValueAtTime(.0001, at + len);
      o.connect(e); e.connect(p); const s = ctx.createGain(); s.gain.value = .5; e.connect(s); s.connect(wet); o.start(at); o.stop(at + len + .02);
    }
  }
  // An occasional far-off bicycle bell.
  for (const t of [14.2, 37.6]) for (const k of [0, .16]) { const o = ctx.createOscillator(), e = ctx.createGain(), p = panner(ctx, -.5, bus); o.frequency.value = 3150;
    e.gain.setValueAtTime(.018, t + k); e.gain.exponentialRampToValueAtTime(.0001, t + k + .5); o.connect(e); e.connect(p); e.connect(wet); o.start(t + k); o.stop(t + k + .55); }
  return { buffer: await ctx.startRendering(), loop: length };
}
