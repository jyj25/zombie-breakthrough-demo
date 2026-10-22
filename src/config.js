export const GAME_CONFIG = Object.freeze({
  maxPower: 9999,
  maxShotMultiplier: 5,
  playerDepth: 0.88,
  gateMin: 1,
  gateMax: 99,
  crewThresholds: [10, 100, 1000, 2000],
  multiplierGateChance: 0.22,
  spawnInterval: 42,
  shotInterval: 12,
  shotSpeed: 0.035,
  sirenHealth: 999999,
  sirenSpawnEffectivePower: 12000,
});

export const GAME_STATE = Object.freeze({ READY: 'ready', INTRO: 'intro', PLAYING: 'playing', GAME_OVER: 'gameover', WON: 'won' });
