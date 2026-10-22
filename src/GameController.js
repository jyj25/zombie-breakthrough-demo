import { GAME_CONFIG, GAME_STATE } from './config.js';
import { Boss } from './entities/Boss.js';
import { Player } from './entities/Player.js';
import { PowerGate } from './entities/PowerGate.js';
import { Projectile } from './entities/Projectile.js';
import { WeaponPickup } from './entities/WeaponPickup.js';
import { ZombieHorde } from './entities/ZombieHorde.js';
import { PointerController } from './input/PointerController.js';
import { GameRenderer } from './render/GameRenderer.js';

/** Owns the game loop, rules, collision checks, and entity lifecycle. */
export class GameController {
  constructor(canvas, ui) {
    this.ui = ui;
    this.renderer = new GameRenderer(canvas);
    this.player = new Player();
    this.state = GAME_STATE.READY;
    this.tick = 0;
    this.spawnTimer = 0;
    this.shotTimer = 0;
    this.wave = 1;
    this.kills = 0;
    this.bossIndex = 0;
    this.finalBossSpawned = false;
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
    this.state = GAME_STATE.PLAYING;
    this.tick = this.spawnTimer = this.shotTimer = this.wave = this.kills = this.bossIndex = 0;
    this.finalBossSpawned = false;
    this.wave = 1;
    this.boss = null;
    this.entities = [];
    this.projectiles = [];
    this.popups = [];
    this.publishState();
    this.loop();
  }

  loop() {
    if (this.state !== GAME_STATE.PLAYING) return;
    this.update();
    this.render();
    this.publishState();
    this.animationFrame = requestAnimationFrame(() => this.loop());
  }

  update() {
    this.tick++;
    this.player.update();
    if (++this.spawnTimer >= GAME_CONFIG.spawnInterval) { this.spawnEntity(); this.spawnTimer = 0; }
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
    if (this.spawnFinalBossIfReady()) return;
    const finalBossIndex = GAME_CONFIG.bossHealth.length - 1;
    if (!this.boss && this.player.power >= 100 && this.bossIndex < finalBossIndex && this.kills >= GAME_CONFIG.bossKillThresholds[this.bossIndex]) {
      this.startBoss(this.bossIndex);
      return;
    }
    if (this.bossIndex >= 2 && Math.random() < 0.22) {
      const bonus = this.bossIndex >= 4 ? 800 : this.bossIndex >= 3 ? 400 : 200;
      this.entities.push(new WeaponPickup(bonus));
      return;
    }
    if (Math.random() < 0.45) {
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

  startBoss(index) {
    if (index === GAME_CONFIG.bossHealth.length - 1) this.finalBossSpawned = true;
    this.bossIndex = index + 1;
    this.boss = new Boss(GAME_CONFIG.bossNames[index], this.rollBossHealth(GAME_CONFIG.bossHealth[index]), index === GAME_CONFIG.bossHealth.length - 1);
    this.wave = this.bossIndex + 1;
    this.addPopup(this.renderer.width / 2, this.renderer.height * 0.28, `⚠ ${this.boss.name}`, '#ffe16a');
  }

  spawnFinalBossIfReady() {
    const finalBossIndex = GAME_CONFIG.bossHealth.length - 1;
    if (this.boss || this.finalBossSpawned || this.player.power < GAME_CONFIG.maxPower) return false;
    this.startBoss(finalBossIndex);
    return true;
  }

  rollBossHealth(setting) {
    if (typeof setting === 'number') return setting;
    return setting.min + Math.floor(Math.random() * (setting.max - setting.min + 1));
  }

  fire() {
    // Each member of a burst deals the player's attack power; x2/x3 gates raise shots per burst.
    const count = this.player.shotMultiplier;
    for (let index = 0; index < count; index++) {
      const laneOffset = count === 1 ? 0 : (index - (count - 1) / 2) * 0.045;
      this.projectiles.push(new Projectile(this.player.lane + laneOffset, this.player.depth - 0.045, this.player.power));
    }
  }

  resolveProjectileHits() {
    for (const projectile of this.projectiles) {
      if (!projectile.active) continue;
      if (this.boss && this.isProjectileNear(projectile, this.boss, 0.08, this.renderer.width * 0.22)) {
        projectile.active = false;
        if (this.boss.takeDamage(projectile.damage)) this.defeatBoss();
        continue;
      }
      for (const horde of this.entities) {
        if (!horde.active || horde.type !== 'horde') continue;
        if (this.isProjectileNear(projectile, horde, 0.035, this.renderer.width * (0.035 + horde.depth * 0.04))) {
          const defeated = horde.takeDamage(projectile.damage);
          this.kills += defeated;
          if (!horde.active) this.addPopup(this.renderer.projectX(horde.lane, horde.depth), this.renderer.projectY(horde.depth), '처치!', '#dcffb2');
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
      if (!entity.active) continue;
      if (entity.type === 'gate' && entity.depth >= this.player.depth - 0.025) {
        entity.active = false;
        if (entity.rewardType === 'multiplier') {
          const multiplier = this.player.setShotMultiplier(entity.value);
          this.addPopup(this.renderer.projectX(this.player.lane, this.player.depth), this.renderer.projectY(this.player.depth) - 48, `×${multiplier} 발사`, '#d8b5ff');
        } else {
          const increase = this.player.addPower(entity.value);
          this.addPopup(this.renderer.projectX(this.player.lane, this.player.depth), this.renderer.projectY(this.player.depth) - 48, `+${increase}`, '#9cffbb');
          this.spawnFinalBossIfReady();
        }
      } else if (entity.type === 'weapon' && entity.depth >= this.player.depth - 0.025) {
        entity.active = false;
        if (Math.abs(this.player.lane - entity.lane) < 0.22) {
          const increase = this.player.addPower(entity.bonus);
          this.addPopup(this.renderer.projectX(entity.lane, entity.depth), this.renderer.projectY(this.player.depth) - 48, `무기 +${increase}`, '#9de1ff');
          this.spawnFinalBossIfReady();
        }
      } else if (entity.type === 'horde' && entity.depth >= this.player.depth - 0.015) {
        if (this.overlapsPlayer(entity)) { this.finish(GAME_STATE.GAME_OVER); return; }
        entity.active = false;
      }
    }
    if (this.boss) {
      this.boss.update();
      if (this.boss.depth >= this.player.depth - 0.015) {
        if (this.overlapsPlayer(this.boss)) this.finish(GAME_STATE.GAME_OVER);
        else this.boss = null;
      }
    }
  }

  overlapsPlayer(entity) {
    const yGap = Math.abs(this.renderer.projectY(entity.depth) - this.renderer.projectY(this.player.depth));
    const xGap = Math.abs(this.renderer.projectX(entity.lane, entity.depth) - this.renderer.projectX(this.player.lane, this.player.depth));
    const isBoss = entity.type === 'boss';
    const scale = Math.max(0.8, this.renderer.width / 390);
    return yGap < (isBoss ? 36 : 22) * scale && xGap < (isBoss ? this.renderer.width * 0.2 : 24 * scale);
  }

  defeatBoss() {
    const defeated = this.boss;
    this.boss = null;
    this.kills += 4;
    this.addPopup(this.renderer.width / 2, this.renderer.height * 0.35, `${defeated.name} 격파!`, '#ffe16a');
    if (defeated.finalBoss) this.finish(GAME_STATE.WON);
    else this.spawnFinalBossIfReady();
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
