import { WorldEntity } from './WorldEntity.js';

export class WeaponPickup extends WorldEntity {
  constructor(bonus) { super({ lane: 0.18, depth: 0.1, speed: 0.00145 }); this.type = 'weapon'; this.bonus = bonus; }
}
