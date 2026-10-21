import { WorldEntity } from './WorldEntity.js';

export class Boss extends WorldEntity {
  constructor(name, health, finalBoss = false) {
    super({ lane: 0.5, depth: 0.3, speed: 0.00112 });
    this.type = 'boss';
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.finalBoss = finalBoss;
  }

  takeDamage(damage) { this.health = Math.max(0, this.health - damage); return this.health === 0; }
}
