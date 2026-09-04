// Fase 4: Audio & Juiciness - Web Audio oscillator (no asset needed, offline)

let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep(freq, duration=0.15, type='sine', gain=0.2) {
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    g.gain.value = gain;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
    o.stop(c.currentTime + duration);
  } catch(e) {}
}

export const SFX = {
  correct() { beep(880,0.18,'sine',0.25); setTimeout(()=>beep(1100,0.2,'sine',0.2),120); },
  wrong() { beep(180,0.3,'square',0.2); setTimeout(()=>beep(120,0.4,'square',0.15),150); },
  tick() { beep(1200,0.07,'square',0.08); },
  tickFast() { beep(1500,0.05,'square',0.12); },
  attack() { beep(300,0.12,'sawtooth',0.25); setTimeout(()=>beep(150,0.15,'square',0.2),80); },
  heal() { beep(523,0.15,'sine',0.2); setTimeout(()=>beep(659,0.15,'sine',0.2),100); setTimeout(()=>beep(784,0.2,'sine',0.2),200); },
  coin() { beep(1000,0.1,'sine',0.2); setTimeout(()=>beep(1300,0.15,'sine',0.15),80); },
  levelup() { [523,659,784,1046].forEach((f,i)=> setTimeout(()=>beep(f,0.18,'sine',0.18), i*120)); }
};

// BGM simple loop (optional)
let bgmInterval = null;
export function startBGM() {
  stopBGM();
  // very subtle ambient not auto-play annoying; keep disabled by default
}
export function stopBGM() { if(bgmInterval) clearInterval(bgmInterval); bgmInterval=null; }
