/** Canvas renderer for the beach runner, hamster crew, weapons, and Siren arena. */
export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.width = 400;
    this.height = 650;
    this.pixelRatio = 1;
    this.images = {};
    const files = {
      flight: 'flight.png', siren: 'siren.png', win: 'siren-win.png', ocean: 'ocean.png',
      bowl: 'weapon-bowl.png', fork: 'weapon-pink-blue.png', stick: 'weapon-stick.png', sword: 'weapon-swords.png',
    };
    for (const [key, file] of Object.entries(files)) {
      const image = new Image();
      image.src = `./assets/game/${file}`;
      this.images[key] = image;
    }
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
    return this.height * 0.075 + Math.pow(z, 1.48) * this.height * 0.85;
  }

  roadHalf(y) {
    const t = Math.max(0, Math.min(1, (y - this.height * 0.07) / (this.height * 0.86)));
    return this.width * (0.13 + 0.38 * t);
  }

  projectX(lane, depth) {
    const y = this.projectY(depth);
    return this.width / 2 + (lane - 0.5) * this.roadHalf(y) * 2;
  }

  draw(game) {
    const ctx = this.context, { width: w, height: h } = this;
    ctx.clearRect(0, 0, w, h);
    if (game.boss) this.drawSirenSea(game.tick, game.boss.age);
    else this.drawBeach(game.tick);

    if (game.state === 'intro') {
      this.drawFlightIntro(game.introTick);
      return;
    }

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

  drawBeach(tick) {
    const ctx = this.context, w = this.width, h = this.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, '#a9e2f0'); sky.addColorStop(1, '#e9f5d9');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff6bd'; ctx.beginPath(); ctx.arc(w * 0.16, h * 0.13, w * 0.065, 0, Math.PI * 2); ctx.fill();
    this.drawCloud(w * 0.46, h * 0.14, 1.05); this.drawCloud(w * 0.86, h * 0.25, 0.72);
    ctx.fillStyle = '#6cc8d2'; ctx.fillRect(0, h * 0.36, w, h * 0.34);
    ctx.fillStyle = '#b5e7dc';
    for (let i = 0; i < 7; i++) {
      const x = ((i * 81 - tick * 0.12) % (w + 100) + w + 100) % (w + 100) - 30;
      ctx.globalAlpha = 0.28 + (i % 3) * 0.12; ctx.fillRect(x, h * (0.40 + (i % 4) * 0.055), 32 + (i % 3) * 17, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f5d696'; ctx.beginPath();
    ctx.moveTo(0, h * 0.61); ctx.quadraticCurveTo(w * 0.5, h * 0.53, w, h * 0.62); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f9e5b4'; ctx.beginPath(); ctx.moveTo(0, h * 0.72); ctx.quadraticCurveTo(w * 0.52, h * 0.62, w, h * 0.73); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    this.drawPalm(w * 0.04, h * 0.55, 0.72); this.drawPalm(w * 0.98, h * 0.52, 0.62);
    this.drawTrack(tick);
  }

  drawCloud(x, y, scale) {
    const ctx = this.context; ctx.fillStyle = '#ffffffc9';
    ctx.beginPath(); ctx.ellipse(x, y, 38 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 20 * scale, y + 1 * scale, 18 * scale, 12 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 15 * scale, y - 5 * scale, 22 * scale, 15 * scale, 0, 0, Math.PI * 2); ctx.fill();
  }

  drawPalm(x, y, scale) {
    const ctx = this.context;
    ctx.strokeStyle = '#a66f42'; ctx.lineWidth = 7 * scale; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x, y + 35 * scale); ctx.quadraticCurveTo(x + 5 * scale, y, x - 7 * scale, y - 22 * scale); ctx.stroke();
    ctx.strokeStyle = '#4c9b68'; ctx.lineWidth = 6 * scale;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.92 + i * Math.PI * 0.46;
      ctx.beginPath(); ctx.moveTo(x - 7 * scale, y - 22 * scale);
      ctx.quadraticCurveTo(x + Math.cos(a) * 27 * scale, y - 37 * scale, x + Math.cos(a) * 46 * scale, y + Math.sin(a) * 33 * scale); ctx.stroke();
    }
  }

  drawTrack(tick) {
    const ctx = this.context, w = this.width, h = this.height, top = h * 0.50;
    ctx.fillStyle = '#e8cc92'; ctx.beginPath(); ctx.moveTo(w * 0.43, top); ctx.lineTo(w * 0.57, top);
    ctx.lineTo(w * 0.96, h); ctx.lineTo(w * 0.04, h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f8e6bd'; ctx.beginPath(); ctx.moveTo(w * 0.445, top); ctx.lineTo(w * 0.555, top);
    ctx.lineTo(w * 0.92, h); ctx.lineTo(w * 0.08, h); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 10; i++) {
      const depth = ((i / 10 + tick * 0.002) % 1), y = this.projectY(depth), size = 1.2 + depth * 3;
      ctx.fillStyle = '#fffdf2aa'; ctx.fillRect(w / 2 - size / 2, y, size, 3 + depth * 10);
    }
  }

  drawSirenSea(tick, bossAge = 0) {
    const ctx = this.context, w = this.width, h = this.height;
    if (bossAge < 75) {
      const image = this.images.ocean;
      ctx.fillStyle = '#102b52'; ctx.fillRect(0, 0, w, h);
      if (image?.complete && image.naturalWidth) {
        const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
        const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
        ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
      }
      ctx.fillStyle = '#09213d42'; ctx.fillRect(0, 0, w, h);
    } else {
      // The painted ocean arrival gives way to a calm blue beach arena, like the seaside cover.
      const dusk = ctx.createLinearGradient(0, 0, 0, h);
      dusk.addColorStop(0, '#506d9b'); dusk.addColorStop(0.48, '#84c4d4'); dusk.addColorStop(0.49, '#318cab'); dusk.addColorStop(1, '#123f70');
      ctx.fillStyle = dusk; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b1e4e4aa'; ctx.beginPath(); ctx.ellipse(w * 0.51, h * 0.47, w * 0.36, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 15; i++) {
        const x = ((i * 61 - tick * 0.17) % (w + 70) + w + 70) % (w + 70) - 35;
        ctx.fillStyle = i % 2 ? '#b9edf466' : '#fff5d955';
        ctx.fillRect(x, h * (0.54 + (i % 5) * 0.052), 13 + i % 4 * 10, 2);
      }
      ctx.fillStyle = '#e9d6a5'; ctx.beginPath(); ctx.moveTo(0, h * 0.73); ctx.quadraticCurveTo(w * 0.5, h * 0.66, w, h * 0.75); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#09213d22'; ctx.fillRect(0, 0, w, h);
    this.drawTrack(tick);
  }

  drawFlightIntro(introTick) {
    const ctx = this.context, w = this.width, h = this.height, image = this.images.flight;
    const progress = Math.min(1, introTick / 150), eased = progress * progress * (3 - 2 * progress);
    const size = w * (0.50 + eased * 0.40), y = h * (0.20 + eased * 0.37);
    ctx.fillStyle = '#0b2e4d22'; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w * 0.5, y); ctx.rotate((1 - progress) * -0.08);
    if (image?.complete && image.naturalWidth) ctx.drawImage(image, -size / 2, -size * 0.58, size, size * 1.16);
    else this.drawHamster(w * 0.5, y, size * 0.35, 'chiikawa', introTick);
    ctx.restore();
    ctx.fillStyle = '#ffffffec'; ctx.textAlign = 'center'; ctx.font = `1000 ${Math.max(22, w * 0.075)}px system-ui`;
    ctx.shadowColor = '#17466b'; ctx.shadowBlur = 12; ctx.fillText(progress < 0.6 ? '치이카와 토벌대 출동!' : '세이렌 토벌 장소 도착!', w / 2, h * 0.16); ctx.shadowBlur = 0;
    ctx.fillStyle = '#09294777'; ctx.beginPath(); ctx.roundRect(w * 0.28, h * 0.84, w * 0.44, 6, 3); ctx.fill();
    ctx.fillStyle = '#fff5ce'; ctx.beginPath(); ctx.roundRect(w * 0.28, h * 0.84, w * 0.44 * progress, 6, 3); ctx.fill();
  }

  drawGate(gate) {
    const ctx = this.context, y = this.projectY(gate.depth), half = this.roadHalf(y) * 0.83;
    const scale = 0.38 + gate.depth * 0.65, gh = Math.max(25, scale * 46), center = this.width / 2;
    ctx.fillStyle = '#fff8e8dd'; ctx.beginPath(); ctx.roundRect(center - half * 0.72, y - gh, half * 1.44, gh, 12 * scale); ctx.fill();
    ctx.strokeStyle = gate.rewardType === 'multiplier' ? '#ae72d0' : '#e2aa43'; ctx.lineWidth = 3 * scale; ctx.stroke();
    const label = gate.rewardType === 'multiplier' ? `×${gate.value}` : `+${gate.value}`;
    ctx.fillStyle = '#513e31'; ctx.font = `1000 ${Math.max(16, scale * 29)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, center, y - gh * 0.48); ctx.textBaseline = 'alphabetic';
  }

  drawWeapon(pickup) {
    const ctx = this.context, y = this.projectY(pickup.depth), x = this.projectX(pickup.lane, pickup.depth), scale = 0.34 + pickup.depth * 0.85;
    const image = this.images[pickup.weaponKey], size = 43 * scale;
    ctx.fillStyle = '#fff9e9'; ctx.beginPath(); ctx.ellipse(x, y, size * 0.64, size * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    if (image?.complete && image.naturalWidth) {
      if (pickup.weaponKey === 'fork') {
        const sx = pickup.weaponVariant === 'pink' ? 0 : image.naturalWidth / 2;
        ctx.drawImage(image, sx, 0, image.naturalWidth / 2, image.naturalHeight, x - size * 0.42, y - size * 0.57, size * 0.84, size * 1.14);
      } else if (pickup.weaponKey === 'sword') {
        ctx.drawImage(image, image.naturalWidth * 0.34, 0, image.naturalWidth * 0.32, image.naturalHeight, x - size * 0.47, y - size * 0.34, size * 0.94, size * 0.68);
      } else ctx.drawImage(image, x - size * 0.43, y - size * 0.55, size * 0.86, size * 1.1);
    }
    ctx.fillStyle = '#423729'; ctx.font = `900 ${Math.max(10, 12 * scale)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText('+' + pickup.bonus, x, y - size * 0.74);
  }

  drawZombie(x, y, size) {
    const ctx = this.context;
    ctx.fillStyle = '#77886c'; ctx.beginPath(); ctx.ellipse(x, y + size * 0.34, size * 0.38, size * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff5d4'; ctx.beginPath(); ctx.arc(x - size * 0.12, y - size * 0.1, size * 0.055, 0, Math.PI * 2); ctx.arc(x + size * 0.12, y - size * 0.1, size * 0.055, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#576c56'; ctx.lineWidth = Math.max(1, size * 0.08); ctx.beginPath(); ctx.moveTo(x - size * 0.24, y + size * 0.4); ctx.lineTo(x - size * 0.36, y + size * 0.6); ctx.moveTo(x + size * 0.24, y + size * 0.4); ctx.lineTo(x + size * 0.36, y + size * 0.6); ctx.stroke();
  }

  drawHorde(horde) {
    if (horde.count <= 0) return;
    const y = this.projectY(horde.depth), scale = 0.34 + horde.depth * 0.85, size = 5 + scale * 12;
    for (let i = 0; i < horde.count; i++) {
      const row = Math.floor(i / 6), col = i % 6;
      this.drawZombie(this.projectX(horde.lane + (col - 2.5) * 0.055, horde.depth - row * 0.012), y - row * size * 0.62, size * 0.72);
    }
    const x = this.projectX(horde.lane, horde.depth), ctx = this.context;
    ctx.fillStyle = '#ffffffdb'; ctx.beginPath(); ctx.roundRect(x - 17 * scale, y - size * 1.3, 34 * scale, 16 * scale, 6); ctx.fill();
    ctx.fillStyle = '#553f33'; ctx.font = `900 ${Math.max(11, 13 * scale)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(String(horde.count), x, y - size * 0.67);
  }

  drawBoss(boss) {
    const ctx = this.context, h = this.height, w = this.width, image = this.images.siren;
    const entrance = Math.min(1, boss.age / 75), targetY = this.projectY(boss.depth);
    const y = h * (1.05 - entrance * 0.67) + (targetY - h * 0.38) * entrance;
    const size = Math.min(w * 0.68, h * 0.42) * (0.62 + entrance * 0.38), x = w / 2;
    ctx.save(); ctx.shadowColor = '#0a193e99'; ctx.shadowBlur = 20; ctx.fillStyle = '#fffdf4';
    ctx.beginPath(); ctx.roundRect(x - size * 0.44, y - size * 0.44, size * 0.88, size * 0.88, 25); ctx.fill(); ctx.restore();
    if (image?.complete && image.naturalWidth) ctx.drawImage(image, x - size * 0.42, y - size * 0.42, size * 0.84, size * 0.84);
    else this.drawHamster(x, y, size * 0.35, 'siren', 0);
    ctx.fillStyle = '#09223fdc'; ctx.beginPath(); ctx.roundRect(w * 0.12, 20, w * 0.76, 18, 8); ctx.fill();
    ctx.fillStyle = '#ff6f8e'; ctx.beginPath(); ctx.roundRect(w * 0.12, 20, w * 0.76 * Math.max(0, boss.health / boss.maxHealth), 18, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `1000 ${Math.max(12, w * 0.038)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText(`세이렌  ${Math.ceil(boss.health).toLocaleString()} / 99,999`, w / 2, 57);
    if (entrance < 1) {
      ctx.fillStyle = '#fff'; ctx.font = `1000 ${Math.max(22, w * 0.075)}px system-ui`; ctx.shadowColor = '#07294d'; ctx.shadowBlur = 9;
      ctx.fillText('세이렌 등장!', w / 2, h * 0.21); ctx.shadowBlur = 0;
    }
  }

  drawPlayer(player, tick) {
    const y = this.projectY(player.depth), x = this.projectX(player.lane, player.depth), scale = Math.max(0.7, Math.min(1.18, this.width / 390));
    const roster = ['chiikawa', 'hachiwore', 'usagi', 'rakkko', 'kurimanju'];
    player.crewOffsets.forEach((offset, index) => this.drawHamster(this.projectX(player.lane + offset, player.depth), y + 4 * scale, scale * 0.78, roster[index], tick));
    this.drawHamster(x, y, scale, 'white', tick);
    const ctx = this.context; ctx.fillStyle = '#fff9e7ee'; ctx.beginPath(); ctx.roundRect(x - 39 * scale, y - 74 * scale, 78 * scale, 23 * scale, 9); ctx.fill();
    const label = player.shotMultiplier > 1 ? `${player.power.toLocaleString()} ×${player.shotMultiplier}` : player.power.toLocaleString();
    ctx.fillStyle = '#44372e'; ctx.font = `1000 ${14 * scale}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(label, x, y - 58 * scale);
    this.drawHeldWeapon(player, x, y, scale);
  }

  drawHamster(x, y, scale, kind, tick) {
    const ctx = this.context, bob = Math.sin(tick * 0.19 + x) * 1.5 * scale;
    const palettes = {
      white: ['#fffef7', '#f5e8d8'], chiikawa: ['#fffef7', '#f4e7d4'], hachiwore: ['#f8f5e9', '#72b8df'],
      usagi: ['#fff5dc', '#f1d987'], rakkko: ['#f5eee0', '#385a76'], kurimanju: ['#d9c1a3', '#956c4d'], siren: ['#fffef7', '#dc4d63'],
    };
    const [fur, accent] = palettes[kind] || palettes.white;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(scale, scale);
    // Tiny paws and soft pear-shaped body.
    ctx.fillStyle = '#a47855'; ctx.beginPath(); ctx.ellipse(-7, -2, 3, 5, 0, 0, Math.PI * 2); ctx.ellipse(7, -2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fur; ctx.strokeStyle = '#6c5144'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(0, -15, 12, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-8, -26, 4, 5, 0, 0, Math.PI * 2); ctx.ellipse(8, -26, 4, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = accent;
    if (kind === 'usagi') {
      ctx.beginPath(); ctx.ellipse(-4, -42, 3.1, 10, -0.14, 0, Math.PI * 2); ctx.ellipse(4, -42, 3.1, 10, 0.14, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'hachiwore') {
      ctx.beginPath(); ctx.moveTo(-11, -31); ctx.lineTo(-9, -38); ctx.lineTo(-2, -32); ctx.lineTo(2, -38); ctx.lineTo(11, -31); ctx.closePath(); ctx.fill();
    } else if (kind === 'chiikawa') {
      ctx.fillStyle = '#6f9d63'; ctx.beginPath(); ctx.moveTo(-10, -11); ctx.quadraticCurveTo(0, -6, 10, -11); ctx.lineTo(9, -5); ctx.quadraticCurveTo(0, -2, -9, -5); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 5; i++) { const fx = -8 + i * 4; ctx.fillStyle = '#fff7d3'; ctx.beginPath(); ctx.arc(fx, -32 + Math.abs(2 - i) * 0.8, 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e88f8d'; ctx.beginPath(); ctx.arc(0, -32, 1.6, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'rakkko') {
      ctx.fillRect(-11, -12, 22, 10); ctx.beginPath(); ctx.moveTo(-11, -2); ctx.lineTo(-8, 3); ctx.lineTo(-5, -2); ctx.lineTo(-2, 3); ctx.lineTo(1, -2); ctx.lineTo(4, 3); ctx.lineTo(7, -2); ctx.lineTo(10, 3); ctx.lineTo(11, -2); ctx.fill();
    } else if (kind === 'kurimanju') {
      ctx.beginPath(); ctx.arc(0, -25, 10, Math.PI, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#3b302c'; ctx.beginPath(); ctx.ellipse(-4.3, -19, 1.2, 2.1, 0, 0, Math.PI * 2); ctx.ellipse(4.3, -19, 1.2, 2.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#edaaa1'; ctx.beginPath(); ctx.ellipse(-7.2, -14.5, 2.3, 1.4, 0, 0, Math.PI * 2); ctx.ellipse(7.2, -14.5, 2.3, 1.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4d3832'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-1.5, -14); ctx.quadraticCurveTo(0, -12, 1.5, -14); ctx.stroke();
    ctx.restore();
  }

  drawHeldWeapon(player, x, y, scale) {
    if (!player.weaponKey) return;
    const ctx = this.context, image = this.images[player.weaponKey], size = 30 * scale;
    if (!image?.complete || !image.naturalWidth) return;
    const px = x + 13 * scale, py = y - 35 * scale;
    if (player.weaponKey === 'fork') {
      const sx = player.weaponVariant === 'pink' ? 0 : image.naturalWidth / 2;
      ctx.drawImage(image, sx, 0, image.naturalWidth / 2, image.naturalHeight, px - size * 0.3, py - size * 0.7, size * 0.6, size * 1.4);
    } else if (player.weaponKey === 'sword') {
      ctx.drawImage(image, image.naturalWidth * 0.34, 0, image.naturalWidth * 0.32, image.naturalHeight, px - size * 0.65, py - size * 0.35, size * 1.3, size * 0.7);
    } else ctx.drawImage(image, px - size * 0.35, py - size * 0.7, size * 0.7, size * 1.4);
  }

  drawProjectile(projectile) {
    const ctx = this.context, y = this.projectY(projectile.depth), x = this.projectX(projectile.lane, projectile.depth);
    ctx.fillStyle = '#fff2a5'; ctx.shadowColor = '#ffe38a'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.ellipse(x, y, 3 + projectile.depth * 2, 7 + projectile.depth * 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }

  drawPopup(popup) {
    const ctx = this.context; ctx.globalAlpha = Math.min(1, popup.life / 25); ctx.fillStyle = popup.color;
    ctx.font = '1000 17px system-ui'; ctx.textAlign = 'center'; ctx.fillText(popup.text, popup.x, popup.y); ctx.globalAlpha = 1;
  }
}
