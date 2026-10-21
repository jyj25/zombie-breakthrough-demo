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
    background.addColorStop(0, '#786d61'); background.addColorStop(0.32, '#8e806c');
    background.addColorStop(0.321, '#61745c'); background.addColorStop(1, '#334c41');
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#54685d'; ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.16, hy); ctx.lineTo(w / 2 + w * 0.16, hy);
    ctx.lineTo(w / 2 + w * 0.53, h); ctx.lineTo(w / 2 - w * 0.53, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#bac1bd'; ctx.beginPath();
    ctx.moveTo(w / 2 - w * 0.14, hy); ctx.lineTo(w / 2 + w * 0.14, hy);
    ctx.lineTo(w / 2 + w * 0.45, h); ctx.lineTo(w / 2 - w * 0.45, h); ctx.closePath(); ctx.fill();
    for (const side of [-1, 1]) {
      ctx.strokeStyle = '#737d7d'; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.15, hy); ctx.lineTo(w / 2 + side * w * 0.48, h); ctx.stroke();
      ctx.strokeStyle = '#d4d8d3'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(w / 2 + side * w * 0.137, hy); ctx.lineTo(w / 2 + side * w * 0.455, h); ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const depth = ((i / 9 + tick * 0.003) % 1), y = this.projectY(depth), size = 1 + depth * 3;
      ctx.fillStyle = '#f4f2df'; ctx.fillRect(w / 2 - size, y, size * 2, 5 + depth * 14);
    }
    for (let i = 0; i < 12; i++) {
      const depth = ((i * 0.137 + tick * 0.00055) % 1), y = this.projectY(depth), size = 4 + depth * 12;
      const x = w / 2 + (i % 2 ? 1 : -1) * (this.roadHalf(y) + size * 1.8);
      ctx.fillStyle = ['#68745c', '#8b8877', '#566958'][i % 3]; ctx.beginPath();
      ctx.moveTo(x - size, y); ctx.lineTo(x - size * 0.4, y - size); ctx.lineTo(x + size * 0.65, y - size * 0.55);
      ctx.lineTo(x + size, y + size * 0.3); ctx.lineTo(x - size * 0.3, y + size * 0.55); ctx.fill();
    }
  }

  drawGate(gate) {
    const ctx = this.context, y = this.projectY(gate.depth), half = this.roadHalf(y) * 0.94;
    const scale = 0.34 + gate.depth * 0.8, bar = Math.max(7, scale * 12), center = this.width / 2;
    ctx.fillStyle = '#76878d'; ctx.fillRect(center - half, y - bar * 0.65, bar * 0.45, bar * 1.8);
    ctx.fillRect(center + half - bar * 0.45, y - bar * 0.65, bar * 0.45, bar * 1.8);
    ctx.fillStyle = '#252d34'; ctx.fillRect(center - half, y - bar * 0.55, half * 2, bar * 0.5);
    for (const [x, value, color] of [[center - half * 0.5, gate.leftBonus, '#e4a83d'], [center + half * 0.5, gate.rightBonus, '#38a5d5']]) {
      ctx.fillStyle = color; ctx.globalAlpha = 0.9; ctx.fillRect(x - half * 0.47, y - bar * 0.05, half * 0.94, bar * 0.75);
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(12, scale * 21)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+' + value, x, y + bar * 0.3);
    }
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
    ctx.fillStyle = '#611f25'; ctx.beginPath(); ctx.ellipse(x, y + size * 0.38, size * 0.48, size * 0.19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c85554'; ctx.fillRect(x - size * 0.32, y - size * 0.12, size * 0.64, size * 0.52);
    ctx.fillStyle = '#8fbd86'; ctx.beginPath(); ctx.arc(x, y - size * 0.2, size * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff49c'; ctx.fillRect(x - size * 0.16, y - size * 0.24, size * 0.09, size * 0.08); ctx.fillRect(x + size * 0.08, y - size * 0.24, size * 0.09, size * 0.08);
    ctx.fillStyle = '#423b38'; ctx.fillRect(x - size * 0.22, y + size * 0.35, size * 0.16, size * 0.3); ctx.fillRect(x + size * 0.06, y + size * 0.35, size * 0.16, size * 0.3);
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
    ctx.fillStyle = '#fff'; ctx.font = `900 ${14 * scale}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(player.power.toLocaleString(), x, y - 52 * scale);
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
