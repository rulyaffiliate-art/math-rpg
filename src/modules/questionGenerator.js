// Fase 1: Pra-Produksi & Logika Soal
// Rancangan Skala Kesulitan + Algoritma Jawaban Palsu

/**
 * Skala kesulitan:
 * Lv 1-5  : Penjumlahan/Pengurangan 1-2 digit (1..99)
 * Lv 6-10 : Perkalian (2..12 x 2..12) + penjumlahan 2 digit
 * Lv 11+  : Pembagian habis + campuran (termasuk perkalian besar)
 */
export function getDifficultyConfig(playerLevel) {
  if (playerLevel <= 5) return { ops: ['+', '-'], min: 1, max: 50 + playerLevel * 10, label: 'Penjumlahan/Pengurangan' };
  if (playerLevel <= 10) return { ops: ['+', '-', '*'], min: 2, max: 12, label: 'Perkalian Menengah' };
  return { ops: ['+', '-', '*', '/'], min: 2, max: 20, label: 'Campuran & Pembagian' };
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

export function generateQuestion(playerLevel) {
  const cfg = getDifficultyConfig(playerLevel);
  const op = pick(cfg.ops);
  let a, b, answer, text;

  if (op === '+') {
    if (playerLevel <= 5) { a = randInt(cfg.min, cfg.max); b = randInt(1, cfg.max); }
    else { a = randInt(10, 50); b = randInt(10, 50); }
    answer = a + b; text = `${a} + ${b} = ?`;
  } else if (op === '-') {
    if (playerLevel <= 5) { a = randInt(cfg.min, cfg.max); b = randInt(1, a); }
    else { a = randInt(20, 80); b = randInt(5, a); }
    answer = a - b; text = `${a} - ${b} = ?`;
  } else if (op === '*') {
    a = randInt(cfg.min, cfg.max); b = randInt(cfg.min, cfg.max);
    // scale max for high levels
    if (playerLevel > 10) { a = randInt(6, 20); b = randInt(6, 20); }
    answer = a * b; text = `${a} × ${b} = ?`;
  } else if (op === '/') {
    b = randInt(2, 12);
    answer = randInt(2, 20);
    a = b * answer;
    text = `${a} ÷ ${b} = ?`;
  }

  const choices = generateChoices(answer);
  return { text, answer, choices, op, levelLabel: cfg.label, difficulty: playerLevel };
}

/**
 * Algoritma Jawaban Palsu:
 * 1 benar + 2 jebakan mendekati jawaban benar
 * Offset dinamis: ±1..10, atau ±10% untuk angka besar
 */
export function generateChoices(correct) {
  const set = new Set([correct]);
  let attempts = 0;
  while (set.size < 3 && attempts < 50) {
    attempts++;
    let offset;
    if (Math.abs(correct) < 20) offset = randInt(1, 5) * (Math.random() < 0.5 ? -1 : 1);
    else if (Math.abs(correct) < 100) offset = randInt(1, 10) * (Math.random() < 0.5 ? -1 : 1);
    else offset = randInt(1, Math.max(5, Math.floor(correct * 0.15))) * (Math.random() < 0.5 ? -1 : 1);

    // variasi: kadang +1 digit salah operasi (misal * jadi +)
    if (Math.random() < 0.15) offset = randInt(1, 3) * (Math.random() < 0.5 ? -1 : 1);

    let fake = correct + offset;
    if (fake < 0) fake = Math.abs(fake) + randInt(1,5);
    if (fake === correct) continue;
    // hindari duplikat & terlalu jauh
    if (!set.has(fake)) set.add(fake);
  }
  // fallback jika masih kurang
  while (set.size < 3) set.add(correct + randInt(1,10));
  const arr = Array.from(set);
  // shuffle
  for (let i = arr.length - 1; i > 0; i--) { const j = randInt(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr.map(v => ({ value: v, isCorrect: v === correct }));
}

// Balancing test helper
export function balancingReport() {
  const report = [];
  for (let lv of [1,3,5,7,10,15]) {
    const cfg = getDifficultyConfig(lv);
    const sample = generateQuestion(lv);
    report.push({ lv, ops: cfg.ops.join(','), sample: sample.text + ' => ' + sample.answer });
  }
  return report;
}
