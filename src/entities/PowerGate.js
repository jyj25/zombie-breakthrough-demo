import { WorldEntity } from './WorldEntity.js';

export class PowerGate extends WorldEntity {
  constructor(rewardType, value, lane) {
    super({ lane, depth: 0.62, speed: 0.00145 });
    this.type = 'gate';
    this.rewardType = rewardType;
    this.value = value;
  }
}
