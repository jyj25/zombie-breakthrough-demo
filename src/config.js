export const GAME_CONFIG = Object.freeze({
  maxPower: 9999,
  maxShotMultiplier: 3,
  playerDepth: 0.88,
  gateValues: [2, 3, 5, 10, 25, 50, 99],
  crewThresholds: [10, 100, 1000, 2000, 4000],
  multiplierGateChance: 0.22,
  spawnInterval: 86,
  shotInterval: 12,
  shotSpeed: 0.035,
  sirenHealth: 99999,
  sirenSpawnPower: 9999,
});

export const GAME_STATE = Object.freeze({ READY: 'ready', INTRO: 'intro', PLAYING: 'playing', GAME_OVER: 'gameover', WON: 'won' });
