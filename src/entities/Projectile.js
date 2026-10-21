export class Projectile {
  constructor(lane, depth, damage) { this.lane = lane; this.depth = depth; this.damage = damage; this.active = true; }
  update(speed) { this.depth -= speed; if (this.depth < -0.2) this.active = false; }
}
