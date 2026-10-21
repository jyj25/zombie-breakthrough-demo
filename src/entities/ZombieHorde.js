import { WorldEntity } from './WorldEntity.js';

export class ZombieHorde extends WorldEntity {
  constructor(lane, count, speed) {
    super({ lane, depth: 0.16, speed });
    this.type = 'horde';
    this.count = count;
    this.maxCount = count;
  }

  takeDamage(damage) {
    const defeated = Math.min(this.count, damage);
    this.count -= defeated;
    if (this.count <= 0) this.active = false;
    return defeated;
  }
}
