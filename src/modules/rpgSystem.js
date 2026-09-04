// Fase 3: Sistem RPG & Ekonomi Lokal

export const WEAPONS = [
  { id:'w0', name:'Kayu', bonusAtk:0, price:0 },
  { id:'w1', name:'Besi', bonusAtk:5, price:80 },
  { id:'w2', name:'Baja', bonusAtk:12, price:250 },
  { id:'w3', name:'Excalibur', bonusAtk:25, price:700 },
];
export const ARMORS = [
  { id:'a0', name:'Kain', bonusHp:0, price:0 },
  { id:'a1', name:'Kulit', bonusHp:20, price:80 },
  { id:'a2', name:'Besi', bonusHp:50, price:250 },
  { id:'a3', name:'Diamond', bonusHp:100, price:700 },
];

export function calcStats(level, weaponId='w0', armorId='a0') {
  const w = WEAPONS.find(x=>x.id===weaponId) || WEAPONS[0];
  const a = ARMORS.find(x=>x.id===armorId) || ARMORS[0];
  const baseHp = 100 + level * 15;
  const baseAtk = 15 + level * 5;
  return {
    maxHp: baseHp + a.bonusHp,
    atk: baseAtk + w.bonusAtk,
    weapon: w,
    armor: a,
  };
}

export function expToNext(level) { return Math.floor(100 * Math.pow(level, 1.15)); }

export function createInitialPlayer() {
  const stats = calcStats(1);
  return {
    level: 1,
    exp: 0,
    gold: 100,
    stage: 1,
    weaponId: 'w0',
    armorId: 'a0',
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    atk: stats.atk,
    inventory: { potion:2, time:2, fifty:2 },
    ownedWeapons: ['w0'],
    ownedArmors: ['a0'],
  };
}

export function refreshPlayerStats(player) {
  const s = calcStats(player.level, player.weaponId, player.armorId);
  player.maxHp = s.maxHp;
  player.atk = s.atk;
  // clamp hp
  if (player.hp > player.maxHp) player.hp = player.maxHp;
  return s;
}

export function addExpAndGold(player, enemyLevel) {
  const expGain = 15 + enemyLevel * 8 + Math.floor(Math.random()*6);
  const goldGain = 20 + enemyLevel * 10 + Math.floor(Math.random()*10);
  player.exp += expGain;
  player.gold += goldGain;
  let leveled = false;
  while (player.exp >= expToNext(player.level)) {
    player.exp -= expToNext(player.level);
    player.level++;
    leveled = true;
    refreshPlayerStats(player);
    player.hp = player.maxHp; // heal on level up
  }
  if (leveled) refreshPlayerStats(player);
  return { expGain, goldGain, leveled };
}

export function createEnemy(playerLevel, stage) {
  const lvl = Math.max(1, playerLevel + Math.floor((stage-1)/3) + (Math.random()<0.2?1:0));
  const s = calcStats(lvl, 'w0','a0');
  // enemy slightly weaker hp
  const hp = Math.floor(s.maxHp * 0.55 + 10 + stage*4);
  const atk = Math.max(5, s.atk - 5 + Math.floor(stage/2));
  const names = ['Slime','Goblin','Skeleton','Orc','Wolf','Bat','Mage','Golem'];
  const name = names[(stage-1) % names.length] + ' Lv.' + lvl;
  const emoji = ['👾','👹','💀','👺','🐺','🦇','🧙','🗿'][(stage-1)%8];
  return { level:lvl, maxHp: hp, hp, atk, name, emoji };
}
