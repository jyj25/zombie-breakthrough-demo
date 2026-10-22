/** Draws the pseudo-3D running track and the game entities on one canvas. */
export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = 400;
    this.height = 650;
    this.pixelRatio = 1;
    this.resize = this.resize.bind(this);
    if ('ResizeObserver' in window) new ResizeObserver(this.resize).observe(canvas);
    else window.addEventListener('resize', this.resize);
    this.resize();
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = bounds.width || 400;
    this.height = bounds.height || 650;
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  projectY(depth) {
    const z = Math.max(0, Math.min(1, depth));
    return this.height * 0.055 + Math.pow(z, 1.48) * this.height * 0.91;
  }

  roadHalf(y) {
    const t = Math.max(0, Math.min(1, (y - this.height * 0.055) / (this.height * 0.94 - this.height * 0.055)));
    return this.width * (0.13 + 0.39 * t);
  }

  projectX(lane, depth) {
    const y = this.projectY(depth);
    return this.width / 2 + (lane - 0.5) * this.roadHalf(y) * 2;
  }

  draw(game) {
    const ctx = this.context;
    const { width: w, height: h } = this;
    ctx.clearRect(0, 0, w, h);
    this.drawRoad(game.tick);
    for (const entity of [...game.entities].filter(item => item.active).sort((a, b) => a.depth - b.depth)) {
      if (entity.type === 'gate') this.drawGate(entity);
      else if (entity.type === 'weapon') this.drawWeapon(entity);
      else if (entity.type === 'horde') this.drawHorde(entity);
    }
    if (game.boss) this.drawBoss(game.boss);
    for (const shot of game.projectiles) this.drawProjectile(shot);
    this.drawPlayer(game.player, game.tick);
    for (const popup of game.popups) this.drawPopup(popup);
  }

  drawRoad(tick) {
    const ctx = this.context, w = this.width, h = this.height, hy = h * 0.055;
    const background = ctx.createLinearGradient(0, 0, 0, h);
    background.addColorStop(0, '#70a8b4'); background.addColorStop(0.24, '#9ac6b1');
    background.addColorStop(0.241, '#648d67'); background.addColorStop(1, '#285746');
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    this.drawScenery(tick, hy);
    ctx.fillStyle = '#39434a'; ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.16, hy); ctx.lineTo(w / 2 + w * 0.16, hy);
    ctx.lineTo(w / 2 + w * 0.53, h); ctx.lineTo(w / 2 - w * 0.53, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#69747b'; ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.145, hy); ctx.lineTo(w / 2 + w * 0.145, hy);
    ctx.lineTo(w / 2 + w * 0.46, h); ctx.lineTo(w / 2 - w * 0.46, h); ctx.closePath(); ctx.fill();
    const roadShade = ctx.createLinearGradient(0, hy, 0, h);
    roadShade.addColorStop(0, '#78848a'); roadShade.addColorStop(1, '#505e68');
    ctx.fillStyle = roadShade; ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.133, hy); ctx.lineTo(w / 2 + w * 0.133, hy);
    ctx.lineTo(w / 2 + w * 0.438, h); ctx.lineTo(w / 2 - w * 0.438, h); ctx.closePath(); ctx.fill();
    // Light concrete shoulders and red bridge rails echo the reference runner.
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#d4d4c8'; ctx.lineWidth = Math.max(3, w * 0.018); ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.145, hy); ctx.lineTo(w / 2 + side * w * 0.465, h); ctx.stroke();
      ctx.strokeStyle = '#e34846'; ctx.lineWidth = Math.max(2, w * 0.012); ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.158, hy); ctx.lineTo(w / 2 + side * w * 0.51, h); ctx.stroke();
    }
    // Dashed center stripe follows perspective and scrolls toward the runner.
    for (let i = 0; i < 11; i++) {
      const depth = ((i / 11 + tick * 0.0024) % 1), y = this.projectY(depth), size = 1.2 + depth * 2.5;
      ctx.fillStyle = '#f5edcd'; ctx.globalAlpha = 0.48 + depth * 0.5;
      ctx.fillRect(w / 2 - size * 0.5, y, size, 3 + depth * 14); ctx.globalAlpha = 1;
    }
    this.drawBridge(tick, hy);
  }

  drawScenery(tick, hy) {
    const ctx = this.context, w = this.width, h = this.height;
    // Low polygon hills, water glints, and planted verge add depth without hiding play.
    ctx.fillStyle = '#83b59a'; ctx.beginPath(); ctx.moveTo(0, hy * 2.4);
    ctx.lineTo(w * 0.15, hy * 1.25); ctx.lineTo(w * 0.31, hy * 2.6); ctx.lineTo(w * 0.48, hy * 1.4);
    ctx.lineTo(w * 0.64, hy * 2.5); ctx.lineTo(w * 0.82, hy * 1.3); ctx.lineTo(w, hy * 2.2); ctx.lineTo(w, hy * 5); ctx.lineTo(0, hy * 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b9e80'; ctx.fillRect(0, hy * 4, w, h * 0.72);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const depth = ((i / 8 + tick * 0.0011) % 1), y = this.projectY(depth);
        const size = 3 + depth * 12, x = w / 2 + side * (this.roadHalf(y) + size * 2.7);
        // Rounded low-poly shrubs sit beyond the bridge shoulder.
        ctx.fillStyle = i % 2 ? '#397b51' : '#4d8954'; ctx.beginPath();
        ctx.arc(x, y - size * 0.18, size * 0.72, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8a754e'; ctx.fillRect(x - size * 0.12, y + size * 0.3, size * 0.24, size * 0.62);
      }
    }
  }

  drawBridge(tick, hy) {
    const ctx = this.context, w = this.width, h = this.height;
    // Repeating suspension frames create a clear forward perspective.
    for (let i = 0; i < 5; i++) {
      const depth = ((i / 5 + tick * 0.0015) % 1), y = this.projectY(depth);
      const half = this.roadHalf(y) * 1.08, postH = 10 + depth * 50;
      ctx.fillStyle = '#a83235';
      ctx.fillRect(w / 2 - half - 3, y - postH, Math.max(3, depth * 7), postH);
      ctx.fillRect(w / 2 + half - 2, y - postH, Math.max(3, depth * 7), postH);
      ctx.fillStyle = '#f27668'; ctx.fillRect(w / 2 - half - 3, y - postH, Math.max(2, depth * 3), postH);
      ctx.fillRect(w / 2 + half - 2, y - postH, Math.max(2, depth * 3), postH);
      ctx.strokeStyle = '#e6675b'; ctx.lineWidth = 0.6 + depth * 1.8;
      ctx.beginPath(); ctx.moveTo(w / 2 - half, y - postH); ctx.lineTo(w / 2 - this.roadHalf(hy) * 1.08, hy * 1.8);
      ctx.moveTo(w / 2 + half, y - postH); ctx.lineTo(w / 2 + this.roadHalf(hy) * 1.08, hy * 1.8); ctx.stroke();
    }
  }

  drawGate(gate) {
    const ctx = this.context, y = this.projectY(gate.depth), half = this.roadHalf(y) * 0.92;
    const scale = 0.34 + gate.depth * 0.8, bar = Math.max(12, scale * 28), center = this.width / 2;
    ctx.fillStyle = '#29343a'; ctx.fillRect(center - half, y - bar * 0.7, half * 2, bar * 1.35);
    const gw = half * 0.95, gh = bar * 0.9;
    const label = gate.rewardType === 'multiplier' ? `×${gate.value}` : `+${gate.value}`;
    const color = gate.rewardType === 'multiplier' ? '#9b59c7' : '#18a987';
    ctx.fillStyle = '#111b25'; ctx.beginPath(); ctx.roundRect(center - gw * 0.5 - 2, y - gh * 0.58 - 2, gw + 4, gh + 4, 6 * scale); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(center - gw * 0.5, y - gh * 0.58, gw, gh, 5 * scale); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `1000 ${Math.max(14, scale * 30)}px system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = '#17212a'; ctx.shadowBlur = 5;
    ctx.fillText(label, center, y - gh * 0.1); ctx.shadowBlur = 0;
    ctx.textBaseline = 'alphabetic';
  }

  drawWeapon(pickup) {
    const ctx = this.context, y = this.projectY(pickup.depth), x = this.projectX(pickup.lane, pickup.depth), s = 0.4 + pickup.depth * 0.85;
    const width = 31 * s, height = 41 * s;
    ctx.fillStyle = '#10375c'; ctx.beginPath(); ctx.ellipse(x, y + height * 0.26, width * 0.58, height * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#168ded'; ctx.fillRect(x - width * 0.55, y - height * 0.4, width * 1.1, height * 0.68);
    ctx.fillStyle = '#61caff'; ctx.beginPath(); ctx.ellipse(x, y - height * 0.4, width * 0.55, height * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9f8ff'; ctx.font = `900 ${Math.max(10, 12 * s)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText('무기 +' + pickup.bonus, x, y - height * 0.7);
  }

  drawZombie(x, y, size) {
    const ctx = this.context;
    ctx.fillStyle = '#25312c'; ctx.beginPath(); ctx.ellipse(x, y + size * 0.48, size * 0.48, size * 0.17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#343e42'; ctx.fillRect(x - size * 0.11, y + size * 0.23, size * 0.18, size * 0.3);
    ctx.fillRect(x + size * 0.04, y + size * 0.23, size * 0.18, size * 0.3);
    ctx.fillStyle = '#bd514d'; ctx.beginPath(); ctx.roundRect(x - size * 0.34, y - size * 0.12, size * 0.68, size * 0.47, size * 0.12); ctx.fill();
    ctx.strokeStyle = '#91bd81'; ctx.lineWidth = Math.max(1, size * 0.12); ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - size * 0.25, y - size * 0.02); ctx.lineTo(x - size * 0.48, y + size * 0.12);
    ctx.moveTo(x + size * 0.25, y - size * 0.02); ctx.lineTo(x + size * 0.46, y - size * 0.16); ctx.stroke();
    ctx.fillStyle = '#9bbd80'; ctx.beginPath(); ctx.arc(x, y - size * 0.25, size * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4dc8c'; ctx.beginPath(); ctx.arc(x - size * 0.12, y - size * 0.27, size * 0.045, 0, Math.PI * 2); ctx.arc(x + size * 0.12, y - size * 0.27, size * 0.045, 0, Math.PI * 2); ctx.fill();
  }

  drawHorde(horde) {
    if (horde.count <= 0) return;
    const y = this.projectY(horde.depth), scale = 0.34 + horde.depth * 0.85, size = 5 + scale * 12;
    for (let i = 0; i < horde.count; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      this.drawZombie(this.projectX(horde.lane + (col - 2.5) * 0.055, horde.depth - row * 0.012), y - row * size * 0.62, size * 0.72);
    }
    const x = this.projectX(horde.lane, horde.depth), ctx = this.context;
    ctx.fillStyle = '#161c25cc'; ctx.fillRect(x - 15 * scale, y - size * 1.3, 30 * scale, 15 * scale);
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(11, 13 * scale)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(String(horde.count), x, y - size * 0.67);
  }

  drawBoss(boss) {
    const ctx = this.context, y = this.projectY(boss.depth), scale = 0.45 + boss.depth * 0.85;
    const x = this.projectX(boss.lane, boss.depth), width = this.width * 0.26 * scale, height = 66 * scale;
    ctx.fillStyle = '#3b2029'; ctx.beginPath(); ctx.ellipse(x, y + height * 0.46, width * 0.78, height * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = boss.finalBoss ? '#683d72' : '#985253'; ctx.fillRect(x - width * 0.47, y - height * 0.12, width * 0.94, height * 0.68);
    ctx.fillStyle = '#b6a38d'; ctx.beginPath(); ctx.arc(x, y - height * 0.12, width * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe998'; ctx.fillRect(x - width * 0.2, y - height * 0.16, 6 * scale, 4 * scale); ctx.fillRect(x + width * 0.1, y - height * 0.16, 6 * scale, 4 * scale);
    ctx.fillStyle = '#101820cc'; ctx.fillRect(this.width * 0.12, 17, this.width * 0.76, 12);
    ctx.fillStyle = '#ef5361'; ctx.fillRect(this.width * 0.12, 17, this.width * 0.76 * Math.max(0, boss.health / boss.maxHealth), 12);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(`${boss.name}  ${Math.ceil(boss.health).toLocaleString()}`, this.width / 2, 14);
  }

  drawPlayer(player, tick) {
    const y = this.projectY(player.depth), x = this.projectX(player.lane, player.depth), scale = Math.max(0.7, Math.min(1.2, this.width / 390));
    for (const offset of player.crewOffsets) this.drawHuman(this.projectX(player.lane + offset, player.depth), y + 5 * scale, scale * 0.68, tick, '#2580c8', false);
    this.drawHuman(x, y, scale, tick, '#168ded', true);
    const ctx = this.context; ctx.fillStyle = '#102036dd'; ctx.fillRect(x - 32 * scale, y - 67 * scale, 64 * scale, 21 * scale);
    const label = player.shotMultiplier > 1 ? `${player.power.toLocaleString()} ×${player.shotMultiplier}` : player.power.toLocaleString();
    ctx.fillStyle = '#fff'; ctx.font = `900 ${14 * scale}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 52 * scale);
  }

  /** Clear human silhouette with a forward-pointing weapon; the player owns the attack. */
  drawHuman(x, y, scale, tick, shirtColor, hasWeapon) {
    const ctx = this.context, stride = Math.sin(tick * 0.35) * 3 * scale;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = '#172b42'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(-3, -1); ctx.lineTo(-7 + stride, -13); ctx.lineTo(-9 - stride, -23);
    ctx.moveTo(4, -1); ctx.lineTo(8 - stride, -13); ctx.lineTo(9 + stride, -22); ctx.stroke();
    ctx.fillStyle = '#192b37'; ctx.beginPath(); ctx.ellipse(0, 2, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shirtColor; ctx.fillRect(-8, -36, 16, 23);
    ctx.fillStyle = '#f1c69f'; ctx.beginPath(); ctx.arc(0, -43, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22384d'; ctx.fillRect(-4, -45, 2, 2); ctx.fillRect(3, -45, 2, 2);
    ctx.fillStyle = '#168ded'; ctx.fillRect(-8, -49, 16, 5); ctx.fillRect(-5, -53, 10, 5);
    ctx.strokeStyle = '#f1c69f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-7, -31); ctx.lineTo(-2, -22); ctx.moveTo(7, -31); ctx.lineTo(11, -26); ctx.stroke();
    if (hasWeapon) {
      // Held blaster points up the track. Projectile origin uses this same hand position.
      ctx.fillStyle = '#263847'; ctx.fillRect(7, -31, 6, 15); ctx.fillStyle = '#9de1ff'; ctx.fillRect(9, -39, 3, 12);
      ctx.fillStyle = '#f1c69f'; ctx.fillRect(7, -28, 6, 4);
    }
    ctx.restore();
  }

  drawProjectile(projectile) {
    const ctx = this.context, y = this.projectY(projectile.depth), x = this.projectX(projectile.lane, projectile.depth);
    ctx.fillStyle = '#49b9ff'; ctx.beginPath(); ctx.ellipse(x, y, 3 + projectile.depth * 2, 7 + projectile.depth * 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawPopup(popup) {
    const ctx = this.context; ctx.globalAlpha = Math.min(1, popup.life / 25); ctx.fillStyle = popup.color;
    ctx.font = '900 17px system-ui'; ctx.textAlign = 'center'; ctx.fillText(popup.text, popup.x, popup.y); ctx.globalAlpha = 1;
  }
}
