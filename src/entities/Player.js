import { GAME_CONFIG } from '../config.js';

export class Player {
  constructor() { this.reset(); }

  reset() {
    this.depth = GAME_CONFIG.playerDepth;
    this.lane = 0.5;
    this.targetLane = 0.5;
    this.power = 1;
    this.crewOffsets = [];
  }

  update() { this.lane += (this.targetLane - this.lane) * 0.18; }
  moveTo(lane) { this.targetLane = lane; }

  addPower(amount) {
    const previous = this.power;
    this.power = Math.min(GAME_CONFIG.maxPower, this.power + amount);
    this.updateCrew();
    return this.power - previous;
  }

  updateCrew() {
    if (this.power >= 1000) this.crewOffsets = [-0.18, -0.09, 0.09, 0.18];
    else if (this.power >= 100) this.crewOffsets = [-0.12, 0.12];
    else if (this.power >= 10) this.crewOffsets = [-0.1];
    else this.crewOffsets = [];
  }
}
