export const GAME_CONFIG = Object.freeze({
  maxPower: 9999,
  playerDepth: 0.88,
  gateValues: [2, 3, 5, 10, 25, 50, 99],
  bossHealth: [300, { min: 600, max: 700 }, { min: 900, max: 1200 }, 2000, { min: 3000, max: 4000 }, 99999],
  bossNames: ['폐허의 덩치', '갑옷 좀비', '변이 좀비', '좀비 기사', '거대 좀비', '최종 보스'],
  bossKillThresholds: [8, 20, 35, 52, 70],
  multiplierGateChance: 0.22,
  spawnInterval: 104,
  shotInterval: 18,
  shotSpeed: 0.035,
});

export const GAME_STATE = Object.freeze({ READY: 'ready', PLAYING: 'playing', GAME_OVER: 'gameover', WON: 'won' });
