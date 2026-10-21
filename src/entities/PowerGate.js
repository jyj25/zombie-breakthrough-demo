import { WorldEntity } from './WorldEntity.js';

export class PowerGate extends WorldEntity {
  constructor(leftBonus, rightBonus) {
    super({ depth: 0.1, speed: 0.00145 });
    this.type = 'gate';
    this.leftBonus = leftBonus;
    this.rightBonus = rightBonus;
  }

  bonusForLane(lane) { return lane < 0.5 ? this.leftBonus : this.rightBonus; }
}
