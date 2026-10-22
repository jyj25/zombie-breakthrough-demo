import { WorldEntity } from './WorldEntity.js';

const WEAPONS = [
  { bonus: 50, key: 'bowl' },
  { bonus: 100, key: 'fork' },
  { bonus: 500, key: 'stick' },
  { bonus: 1000, key: 'sword' },
];

export class WeaponPickup extends WorldEntity {
  constructor(weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)]) {
    const side = Math.random() < 0.5 ? 0 : 1;
    const lane = side ? 0.72 + Math.random() * 0.23 : 0.05 + Math.random() * 0.23;
    super({ lane, depth: 0.62, speed: 0.00125 });
    this.type = 'weapon';
    this.bonus = weapon.bonus;
    this.weaponKey = weapon.key;
    this.weaponVariant = weapon.key === 'fork' ? (Math.random() < 0.5 ? 'pink' : 'blue') : '';
  }
}
