import './style.css'
import { generateQuestion, balancingReport } from './modules/questionGenerator.js'
import { createInitialPlayer, refreshPlayerStats, addExpAndGold, createEnemy, expToNext, WEAPONS, ARMORS } from './modules/rpgSystem.js'
import { saveGame, loadGame } from './modules/saveSystem.js'
import { SFX } from './modules/audio.js'

// State
let player = loadGame() || createInitialPlayer();
refreshPlayerStats(player);
let enemy = createEnemy(player.level, player.stage);
let currentQ = null;
let timer = 10.0;
let timerId = null;
let questionActive = true;
let timeBoosted = false;

// DOM
const el = {
  hudLevel: document.getElementById('hud-level'),
  expFill: document.getElementById('exp-fill'),
  hudExp: document.getElementById('hud-exp'),
  hudGold: document.getElementById('hud-gold'),
  hudStage: document.getElementById('hud-stage'),
  playerSprite: document.getElementById('player-sprite'),
  enemySprite: document.getElementById('enemy-sprite'),
  playerName: document.getElementById('player-name'),
  enemyName: document.getElementById('enemy-name'),
  playerHpFill: document.getElementById('player-hp-fill'),
  enemyHpFill: document.getElementById('enemy-hp-fill'),
  playerHpText: document.getElementById('player-hp-text'),
  enemyHpText: document.getElementById('enemy-hp-text'),
  playerAtk: document.getElementById('player-atk'),
  enemyAtk: document.getElementById('enemy-atk'),
  timerFill: document.getElementById('timer-fill'),
  timerText: document.getElementById('timer-text'),
  qText: document.getElementById('question-text'),
  qLevel: document.getElementById('question-level'),
  ansBtns: [0,1,2].map(i=>document.getElementById('ans'+i)),
  log: document.getElementById('battle-log'),
  potion: document.getElementById('count-potion'),
  time: document.getElementById('count-time'),
  fifty: document.getElementById('count-5050'),
  eqWeapon: document.getElementById('eq-weapon'),
  eqArmor: document.getElementById('eq-armor'),
};

function updateHUD() {
  el.hudLevel.textContent = `Lv.${player.level}`;
  const need = expToNext(player.level);
  el.expFill.style.width = `${Math.min(100, (player.exp/need)*100)}%`;
  el.hudExp.textContent = `${player.exp}/${need} EXP`;
  el.hudGold.textContent = `💰 ${player.gold} Gold`;
  el.hudStage.textContent = `Stage ${player.stage}`;
  el.playerName.textContent = `Pahlawan Lv.${player.level}`;
  el.enemyName.textContent = enemy.name;
  el.enemySprite.textContent = enemy.emoji;
  el.playerHpFill.style.width = `${(player.hp/player.maxHp)*100}%`;
  el.enemyHpFill.style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
  el.playerHpText.textContent = `${player.hp}/${player.maxHp}`;
  el.enemyHpText.textContent = `${enemy.hp}/${enemy.maxHp}`;
  el.playerAtk.textContent = `ATK ${player.atk}`;
  el.enemyAtk.textContent = `ATK ${enemy.atk}`;
  el.potion.textContent = player.inventory.potion;
  el.time.textContent = player.inventory.time;
  el.fifty.textContent = player.inventory.fifty;
  const w = WEAPONS.find(x=>x.id===player.weaponId);
  const a = ARMORS.find(x=>x.id===player.armorId);
  el.eqWeapon.textContent = `${w.name} (+${w.bonusAtk})`;
  el.eqArmor.textContent = `${a.name} (+${a.bonusHp})`;
  // tools enable
  document.getElementById('tool-potion').disabled = player.inventory.potion<=0 || player.hp>=player.maxHp;
  document.getElementById('tool-time').disabled = player.inventory.time<=0 || !questionActive;
  document.getElementById('tool-5050').disabled = player.inventory.fifty<=0 || !questionActive;
}

function nextQuestion() {
  if (!document.getElementById('lose-modal').classList.contains('hidden')) return;
  currentQ = generateQuestion(player.level);
  el.qText.textContent = currentQ.text;
  el.qLevel.textContent = `Level ${player.level} • ${currentQ.levelLabel}`;
  currentQ.choices.forEach((c,i)=>{
    const btn = el.ansBtns[i];
    btn.textContent = c.value;
    btn.disabled = false;
    btn.className = 'answer-btn';
    btn.dataset.correct = c.isCorrect;
  });
  // reset timer
  timer = 10.0;
  timeBoosted = false;
  questionActive = true;
  updateHUD();
  startTimer();
}

function startTimer() {
  clearInterval(timerId);
  const tick = () => {
    timer -= 0.1;
    if (timer <= 0) {
      timer = 0;
      clearInterval(timerId);
      onTimeout();
    }
    renderTimer();
    // tick SFX: makin cepat saat <3s
    if (timer <= 3 && timer > 0) {
      if (Math.floor(timer*10)%5===0) SFX.tickFast();
    } else if (timer <= 5 && timer > 3) {
      if (Math.floor(timer*10)%10===0) SFX.tick();
    }
  };
  renderTimer();
  timerId = setInterval(tick, 100);
}

function renderTimer() {
  const pct = (timer/10)*100;
  el.timerFill.style.width = pct + '%';
  el.timerText.textContent = timer.toFixed(1)+'s';
  if (timer <= 3) el.timerFill.classList.add('low');
  else el.timerFill.classList.remove('low');
}

function logMsg(msg) { el.log.textContent = msg; }

function animateAttack(attacker) {
  const sprite = attacker==='player' ? el.playerSprite : el.enemySprite;
  sprite.classList.add('attack');
  SFX.attack();
  setTimeout(()=> sprite.classList.remove('attack'), 300);
}
function animateHit(target) {
  const sprite = target==='player' ? el.playerSprite : el.enemySprite;
  sprite.classList.add('hit');
  setTimeout(()=> sprite.classList.remove('hit'), 300);
}

function handleAnswer(index) {
  if (!questionActive) return;
  questionActive = false;
  clearInterval(timerId);
  const chosen = currentQ.choices[index];
  const isCorrect = chosen.isCorrect;
  // highlight
  el.ansBtns.forEach((b,i)=>{
    const c = currentQ.choices[i];
    if (c.isCorrect) b.classList.add('correct');
    else if (i===index && !isCorrect) b.classList.add('wrong');
    b.disabled = true;
  });

  if (isCorrect) {
    SFX.correct();
    const dmg = player.atk + Math.floor(Math.random()*4);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    logMsg(`✅ Benar! Kamu menyerang ${dmg} damage!`);
    animateAttack('player');
    setTimeout(()=> animateHit('enemy'), 180);
    updateHUD();
    if (enemy.hp <= 0) {
      setTimeout(()=> onEnemyDefeated(), 600);
    } else {
      setTimeout(()=> nextQuestion(), 900);
    }
  } else {
    SFX.wrong();
    const dmg = enemy.atk + Math.floor(Math.random()*3);
    player.hp = Math.max(0, player.hp - dmg);
    logMsg(`❌ Salah! Musuh menyerang balik ${dmg} damage!`);
    animateAttack('enemy');
    setTimeout(()=> animateHit('player'), 180);
    updateHUD();
    if (player.hp <= 0) {
      setTimeout(()=> onPlayerDefeated(), 700);
    } else {
      setTimeout(()=> nextQuestion(), 900);
    }
  }
}

function onTimeout() {
  if (!questionActive) return;
  questionActive = false;
  el.ansBtns.forEach(b=> b.disabled = true);
  // show correct
  el.ansBtns.forEach((b,i)=>{ if(currentQ.choices[i].isCorrect) b.classList.add('correct'); });
  SFX.wrong();
  const dmg = enemy.atk + Math.floor(Math.random()*3);
  player.hp = Math.max(0, player.hp - dmg);
  logMsg(`⏰ Waktu habis! Musuh menyerang ${dmg} damage!`);
  animateAttack('enemy');
  setTimeout(()=> animateHit('player'), 180);
  updateHUD();
  if (player.hp <= 0) setTimeout(()=> onPlayerDefeated(), 700);
  else setTimeout(()=> nextQuestion(), 900);
}

function onEnemyDefeated() {
  const res = addExpAndGold(player, enemy.level);
  logMsg(`🎉 Menang! +${res.expGain} EXP, +${res.goldGain} Gold!`);
  SFX.coin();
  if (res.leveled) { SFX.levelup(); logMsg(`🆙 LEVEL UP! Sekarang Lv.${player.level} • HP & ATK meningkat!`); }
  saveGame(player);
  // next stage
  player.stage++;
  // heal sedikit tiap menang
  player.hp = Math.min(player.maxHp, player.hp + 15);
  enemy = createEnemy(player.level, player.stage);
  updateHUD();
  setTimeout(()=> nextQuestion(), 1100);
}

function showLoseModal(reason) {
  document.getElementById('lose-reason').textContent = reason;
  document.getElementById('lose-stage').textContent = player.stage;
  document.getElementById('lose-answer').textContent = currentQ ? `Jawaban: ${currentQ.choices.find(c=>c.isCorrect).value}` : '';
  document.getElementById('lose-modal').classList.remove('hidden');
}
function hideLoseModal() {
  document.getElementById('lose-modal').classList.add('hidden');
}
function onPlayerDefeated() {
  // RALAT: Waktu habis -> darah berkurang, baru jika darah habis -> KALAH + Restart
  showLoseModal(`Darah Habis! HP 0 di Stage ${player.stage}`);
  SFX.wrong();
}

document.getElementById('btn-restart').addEventListener('click', ()=>{
  hideLoseModal();
  player.hp = player.maxHp;
  enemy = createEnemy(player.level, player.stage);
  logMsg(`🔄 Restart! HP pulih, coba lagi Stage ${player.stage}`);
  saveGame(player);
  updateHUD();
  nextQuestion();
});
document.getElementById('lose-modal').addEventListener('click', e=>{
  if(e.target.id==='lose-modal') hideLoseModal();
});

// Tools
document.getElementById('tool-potion').addEventListener('click', ()=>{
  if (player.inventory.potion<=0 || player.hp>=player.maxHp) return;
  player.inventory.potion--;
  player.hp = Math.min(player.maxHp, player.hp + 50);
  SFX.heal();
  logMsg(`🧪 Potion! +50 HP`);
  saveGame(player);
  updateHUD();
});
document.getElementById('tool-time').addEventListener('click', ()=>{
  if (player.inventory.time<=0 || !questionActive || timeBoosted) return;
  player.inventory.time--;
  timer = Math.min(15, timer + 5);
  timeBoosted = true;
  SFX.tick();
  logMsg(`⏱️ Time Booster! +5 detik`);
  saveGame(player);
  updateHUD(); renderTimer();
});
document.getElementById('tool-5050').addEventListener('click', ()=>{
  if (player.inventory.fifty<=0 || !questionActive) return;
  player.inventory.fifty--;
  // hapus 1 jawaban salah acak
  const wrongIdx = currentQ.choices.map((c,i)=> c.isCorrect? -1 : i).filter(i=>i!==-1);
  if (wrongIdx.length>0) {
    const toDisable = wrongIdx[Math.floor(Math.random()*wrongIdx.length)];
    el.ansBtns[toDisable].disabled = true;
    el.ansBtns[toDisable].style.opacity = '0.25';
    el.ansBtns[toDisable].textContent = '✕';
  }
  logMsg(`🔮 50:50! 1 pilihan salah dihapus`);
  saveGame(player);
  updateHUD();
});

// Answers
el.ansBtns.forEach((btn,i)=> btn.addEventListener('click', ()=> handleAnswer(i)));

// Shop
const shopModal = document.getElementById('shop-modal');
const shopItemsEl = document.getElementById('shop-items');
function renderShop() {
  shopItemsEl.innerHTML = '';
  const items = [
    ...WEAPONS.filter(w=> !player.ownedWeapons.includes(w.id)).map(w=> ({ type:'weapon', data:w, name:`⚔️ ${w.name}`, desc:`+${w.bonusAtk} ATK`, price:w.price })),
    ...ARMORS.filter(a=> !player.ownedArmors.includes(a.id)).map(a=> ({ type:'armor', data:a, name:`🛡️ ${a.name}`, desc:`+${a.bonusHp} HP`, price:a.price })),
    { type:'potion', name:'🧪 Health Potion', desc:'Heal 50 HP (usable)', price:30 },
    { type:'time', name:'⏱️ Time Booster', desc:'+5 detik timer', price:30 },
    { type:'fifty', name:'🔮 50:50', desc:'Hapus 1 jawaban salah', price:40 },
  ];
  if (items.length===0) shopItemsEl.innerHTML = '<p style="color:#aaa;text-align:center">Semua item sudah dibeli!</p>';
  items.forEach(it=>{
    const div = document.createElement('div');
    div.className = 'shop-item';
    const canBuy = player.gold >= it.price;
    div.innerHTML = `<div class="shop-item-info"><b>${it.name}</b><small>${it.desc} • ${it.price} Gold</small></div>`;
    const btn = document.createElement('button');
    btn.textContent = canBuy ? 'Beli' : 'Gold kurang';
    btn.disabled = !canBuy;
    btn.addEventListener('click', ()=>{
      if (player.gold < it.price) return;
      player.gold -= it.price;
      if (it.type==='weapon') { player.ownedWeapons.push(it.data.id); player.weaponId = it.data.id; }
      else if (it.type==='armor') { player.ownedArmors.push(it.data.id); player.armorId = it.data.id; }
      else if (it.type==='potion') player.inventory.potion++;
      else if (it.type==='time') player.inventory.time++;
      else if (it.type==='fifty') player.inventory.fifty++;
      refreshPlayerStats(player);
      SFX.coin();
      saveGame(player);
      updateHUD();
      renderShop();
      logMsg(`🛒 Membeli ${it.name}!`);
    });
    div.appendChild(btn);
    shopItemsEl.appendChild(div);
  });
  // Equip switcher for owned
  if (player.ownedWeapons.length>1 || player.ownedArmors.length>1) {
    const eqDiv = document.createElement('div');
    eqDiv.style.marginTop='10px';
    eqDiv.innerHTML = `<b>Ganti Equipment:</b>`;
    const wSel = document.createElement('select');
    wSel.style.cssText='width:100%;margin:6px 0;padding:8px;border-radius:8px';
    player.ownedWeapons.forEach(id=>{
      const w=WEAPONS.find(x=>x.id===id);
      const o=document.createElement('option'); o.value=id; o.textContent=`⚔️ ${w.name} (+${w.bonusAtk})`; if(player.weaponId===id)o.selected=true; wSel.appendChild(o);
    });
    wSel.addEventListener('change', e=>{ player.weaponId=e.target.value; refreshPlayerStats(player); saveGame(player); updateHUD(); SFX.coin(); });
    const aSel = document.createElement('select');
    aSel.style.cssText='width:100%;margin:6px 0;padding:8px;border-radius:8px';
    player.ownedArmors.forEach(id=>{
      const a=ARMORS.find(x=>x.id===id);
      const o=document.createElement('option'); o.value=id; o.textContent=`🛡️ ${a.name} (+${a.bonusHp})`; if(player.armorId===id)o.selected=true; aSel.appendChild(o);
    });
    aSel.addEventListener('change', e=>{ player.armorId=e.target.value; refreshPlayerStats(player); saveGame(player); updateHUD(); SFX.coin(); });
    eqDiv.appendChild(wSel); eqDiv.appendChild(aSel);
    shopItemsEl.appendChild(eqDiv);
  }
}
document.getElementById('btn-shop').addEventListener('click', ()=>{ renderShop(); shopModal.classList.remove('hidden'); });
document.getElementById('shop-close').addEventListener('click', ()=> shopModal.classList.add('hidden'));
shopModal.addEventListener('click', e=>{ if(e.target===shopModal) shopModal.classList.add('hidden'); });

document.getElementById('btn-save').addEventListener('click', ()=>{
  const ok = saveGame(player);
  logMsg(ok ? '💾 Game disimpan (Offline JSON)' : '❌ Gagal simpan');
  SFX.coin();
});

// Balancing test log
console.log('=== Balancing Report ===', balancingReport());

// Offline check
window.addEventListener('offline', ()=> logMsg('📴 Offline mode aktif - game tetap berjalan!'));
window.addEventListener('online', ()=> logMsg('🌐 Kembali online'));

// Init
updateHUD();
nextQuestion();

// Register PWA offline (simple)
if ('serviceWorker' in navigator) {
  // optional, will be created on build
}
