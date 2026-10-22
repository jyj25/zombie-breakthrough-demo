import { GAME_CONFIG, GAME_STATE } from './config.js';
import { Boss } from './entities/Boss.js';
import { Player } from './entities/Player.js';
import { PowerGate } from './entities/PowerGate.js';
import { Projectile } from './entities/Projectile.js';
import { WeaponPickup } from './entities/WeaponPickup.js';
import { ZombieHorde } from './entities/ZombieHorde.js';
import { PointerController } from './input/PointerController.js';
import { GameRenderer } from './render/GameRenderer.js';

/** Coordinates game state and delegates drawing, input, and entity behavior. */
export class GameController {
  constructor(canvas, ui) {
    this.ui = ui;
    this.renderer = new GameRenderer(canvas);
    this.player = new Player();
    this.state = GAME_STATE.READY;
    this.tick = 0;
    this.introTick = 0;
    this.spawnTimer = 0;
    this.shotTimer = 0;
    this.wave = 1;
    this.kills = 0;
    this.sirenSpawned = false;
    this.boss = null;
    this.entities = [];
    this.projectiles = [];
    this.popups = [];
    this.animationFrame = 0;
    this.input = new PointerController(canvas, lane => {
      if (this.state === GAME_STATE.PLAYING) this.player.moveTo(lane);
    });
    this.render();
    this.publishState();
  }

  start() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.player.reset();
    this.state = GAME_STATE.INTRO;
    this.tick = this.spawnTimer = this.shotTimer = this.wave = this.kills = this.introTick = 0;
    this.sirenSpawned = false;
    this.wave = 1;
    this.boss = null;
    this.entities = [];
    this.projectiles = [];
    this.popups = [];
    this.publishState();
    this.loop();
  }

  loop() {
    if (![GAME_STATE.INTRO, GAME_STATE.PLAYING].includes(this.state)) return;
    this.update();
    this.render();
    this.publishState();
    if ([GAME_STATE.INTRO, GAME_STATE.PLAYING].includes(this.state)) this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  update() {
    if (this.state === GAME_STATE.INTRO) {
      this.introTick++;
      if (this.introTick >= 150) this.state = GAME_STATE.PLAYING;
      return;
    }
    this.tick++;
    this.player.update();
    if (!this.boss && ++this.spawnTimer >= GAME_CONFIG.spawnInterval) { this.spawnEntity(); this.spawnTimer = 0; }
    if (++this.shotTimer >= GAME_CONFIG.shotInterval) { this.fire(); this.shotTimer = 0; }

    for (const entity of this.entities) if (entity.active) entity.update();
    for (const projectile of this.projectiles) projectile.update(GAME_CONFIG.shotSpeed);
    this.resolveProjectileHits();
    if (this.state !== GAME_STATE.PLAYING) return;
    this.resolveEncounters();
    if (this.state !== GAME_STATE.PLAYING) return;
    for (const popup of this.popups) { popup.y -= 0.55; popup.life--; }
    this.entities = this.entities.filter(entity => entity.active && entity.depth < 1.04);
    this.projectiles = this.projectiles.filter(projectile => projectile.active);
    this.popups = this.popups.filter(popup => popup.life > 0);
  }

  spawnEntity() {
    if (this.trySpawnSiren()) return;
    if (Math.random() < 0.18) {
      this.entities.push(new WeaponPickup());
      return;
    }
    if (Math.random() < 0.42) {
      if (Math.random() < GAME_CONFIG.multiplierGateChance) {
        this.entities.push(new PowerGate('multiplier', Math.random() < 0.55 ? 2 : 3));
      } else {
        this.entities.push(new PowerGate('power', this.randomValue(GAME_CONFIG.gateValues)));
      }
      return;
    }
    const count = 20 + Math.floor(Math.random() * 12);
    const lane = [0.22, 0.5, 0.78][Math.floor(Math.random() * 3)];
    this.entities.push(new ZombieHorde(lane, count, 0.00135 + this.wave * 0.00004));
  }

  randomValue(values) { return values[Math.floor(Math.random() * values.length)]; }

  trySpawnSiren() {
    if (this.boss || this.sirenSpawned || this.player.power < GAME_CONFIG.sirenSpawnPower) return false;
    this.sirenSpawned = true;
    this.boss = new Boss(GAME_CONFIG.sirenHealth);
    this.entities = [];
    this.projectiles = [];
    this.wave = 6;
    this.addPopup(this.renderer.width / 2, this.renderer.height * 0.28, '세이렌 등장!', '#ffeaa6');
    return true;
  }

  fire() {
    // x2 and x3 are bursts of up to three bullets; each bullet is capped at 9,999 damage.
    for (let index = 0; index < this.player.shotMultiplier; index++) {
      const laneOffset = this.player.shotMultiplier === 1 ? 0 : (index - (this.player.shotMultiplier - 1) / 2) * 0.045;
      this.projectiles.push(new Projectile(this.player.lane + laneOffset, this.player.depth - 0.045, this.player.power));
    }
  }

  resolveProjectileHits() {
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      if (this.boss && this.isProjectileNear(projectile, this.boss, 0.12, this.renderer.width * 0.28)) {
        projectile.active = false;
        if (this.boss.takeDamage(projectile.damage)) this.defeatSiren();
        continue;
      }
      for (const horde of this.entities) {
        if (!horde.active || horde.type !== 'horde') continue;
        if (this.isProjectileNear(projectile, horde, 0.035, this.renderer.width * (0.035 + horde.depth * 0.04))) {
          const defeated = horde.takeDamage(projectile.damage);
          this.kills += defeated;
          this.wave = Math.min(6, 1 + Math.floor(this.kills / 30));
          if (!horde.active) this.addPopup(this.renderer.projectX(horde.lane, horde.depth), this.renderer.projectY(horde.depth), '물리쳤다!', '#fff2cf');
          projectile.active = false;
          break;
        }
      }
    }
  }

  isProjectileNear(projectile, target, depthTolerance, xTolerance) {
    const depthClose = Math.abs(projectile.depth - target.depth) < depthTolerance;
    const xClose = Math.abs(this.renderer.projectX(projectile.lane, projectile.depth) - this.renderer.projectX(target.lane, target.depth)) < xTolerance;
    return depthClose && xClose;
  }

  resolveEncounters() {
    for (const entity of this.entities) {
      if (this.boss) break;
      if (!entity.active) continue;
      if (entity.type === 'gate' && entity.depth >= this.player.depth - 0.025) {
        entity.active = false;
        if (entity.rewardType === 'multiplier') {
          const multiplier = this.player.setShotMultiplier(entity.value);
          this.addPopup(this.renderer.projectX(this.player.lane, this.player.depth), this.renderer.projectY(this.player.depth) - 48, `×${multiplier} 발사`, '#e3c8ff');
        } else {
          const increase = this.player.addPower(entity.value);
          this.addPopup(this.renderer.projectX(this.player.lane, this.player.depth), this.renderer.projectY(this.player.depth) - 48, `공격력 +${increase}`, '#fff0a8');
          this.trySpawnSiren();
        }
      } else if (entity.type === 'weapon' && entity.depth >= this.player.depth - 0.025) {
        entity.active = false;
        if (Math.abs(this.player.lane - entity.lane) < 0.2) {
          const increase = this.player.addPower(entity.bonus);
          this.player.equipWeapon(entity.bonus, entity.weaponKey, entity.weaponVariant);
          this.addPopup(this.renderer.projectX(entity.lane, entity.depth), this.renderer.projectY(this.player.depth) - 48, `무기 +${increase}`, '#c5f2ff');
          this.trySpawnSiren();
        }
      } else if (entity.type === 'horde' && entity.depth >= this.player.depth - 0.015) {
        if (this.overlapsPlayer(entity)) { this.finish(GAME_STATE.GAME_OVER); return; }
        entity.active = false;
      }
    }
    if (this.boss) {
      this.boss.update();
      if (this.boss.depth >= this.player.depth - 0.015) {
        this.finish(GAME_STATE.GAME_OVER);
      }
    }
  }

  overlapsPlayer(entity) {
    const yGap = Math.abs(this.renderer.projectY(entity.depth) - this.renderer.projectY(this.player.depth));
    const xGap = Math.abs(this.renderer.projectX(entity.lane, entity.depth) - this.renderer.projectX(this.player.lane, this.player.depth));
    const isBoss = entity.type === 'boss';
    const scale = Math.max(0.8, this.renderer.width / 390);
    return yGap < (isBoss ? 45 : 22) * scale && xGap < (isBoss ? this.renderer.width * 0.22 : 24 * scale);
  }

  defeatSiren() {
    this.boss = null;
    this.kills += 1;
    this.finish(GAME_STATE.WON);
  }

  addPopup(x, y, text, color) { this.popups.push({ x, y, text, color, life: 70 }); }

  finish(state) {
    this.state = state;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.publishState();
  }

  publishState() { this.ui.show(this.state, { power: this.player.power, multiplier: this.player.shotMultiplier, wave: this.wave, kills: this.kills }); }
  render() { this.renderer.draw(this); }
}
