import { WorldEntity } from './WorldEntity.js';

const WEAPONS = [
  { bonus: 50, key: 'bowl' },
  { bonus: 100, key: 'fork' },
  { bonus: 500, key: 'stick' },
  { bonus: 1000, key: 'sword' },
];

export class WeaponPickup extends WorldEntity {
  constructor(weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)]) {
    super({ lane: 0.12 + Math.random() * 0.76, depth: 0.1, speed: 0.00125 });
    this.type = 'weapon';
    this.bonus = weapon.bonus;
    this.weaponKey = weapon.key;
    this.weaponVariant = weapon.key === 'fork' ? (Math.random() < 0.5 ? 'pink' : 'blue') : '';
  }
}
