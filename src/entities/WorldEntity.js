export class WorldEntity {
  constructor({ lane = 0.5, depth = 0.1, speed = 0.0015 } = {}) {
    this.lane = lane;
    this.depth = depth;
    this.speed = speed;
    this.active = true;
  }

  update() { this.depth += this.speed; }
}
