import { GAME_CONFIG } from '../config.js';

/** Player progression, crew roster, and equipped weapon state. */
export class Player {
  constructor() { this.reset(); }

  reset() {
    this.depth = GAME_CONFIG.playerDepth;
    this.lane = 0.5;
    this.targetLane = 0.5;
    this.power = 1;
    this.shotMultiplier = 1;
    this.crewOffsets = [];
    this.weaponBonus = 0;
    this.weaponKey = '';
    this.weaponVariant = 'pink';
    this.updateCrew();
  }

  update() { this.lane += (this.targetLane - this.lane) * 0.18; }
  moveTo(lane) { this.targetLane = lane; }

  addPower(amount) {
    const previous = this.power;
    this.power = Math.max(1, Math.min(GAME_CONFIG.maxPower, this.power + amount));
    this.updateCrew();
    return this.power - previous;
  }

  setShotMultiplier(value) {
    this.shotMultiplier = Math.max(this.shotMultiplier, Math.min(GAME_CONFIG.maxShotMultiplier, value));
    return this.shotMultiplier;
  }

  equipWeapon(bonus, key, variant = 'pink') {
    this.weaponBonus = bonus;
    this.weaponKey = key;
    this.weaponVariant = variant;
  }

  updateCrew() {
    // Chiikawa starts as member 1; four friends can join for a five-character maximum.
    const count = GAME_CONFIG.crewThresholds.filter(threshold => this.power >= threshold).length;
    const formation = [-0.18, 0.18, -0.36, 0.36];
    this.crewOffsets = formation.slice(0, count);
  }
}
