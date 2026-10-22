import { WorldEntity } from './WorldEntity.js';

/** The Siren enters from below the sea during its opening animation. */
export class Boss extends WorldEntity {
  constructor(health) {
    super({ lane: 0.5, depth: 0.4, speed: 0.00035 });
    this.type = 'boss';
    this.name = '세이렌';
    this.health = health;
    this.maxHealth = health;
    this.finalBoss = true;
    this.age = 0;
  }

  update() { this.age++; super.update(); }
  takeDamage(damage) { this.health = Math.max(0, this.health - damage); return this.health === 0; }
}
