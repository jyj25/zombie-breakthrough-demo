import { WorldEntity } from './WorldEntity.js';

export class PowerGate extends WorldEntity {
  constructor(rewardType, value) {
    super({ depth: 0.1, speed: 0.00145 });
    this.type = 'gate';
    this.rewardType = rewardType;
    this.value = value;
  }
}
