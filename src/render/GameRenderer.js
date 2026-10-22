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
      flight: 'flight-cutout.png', siren: 'siren-cutout.png', win: 'siren-win.png', ocean: 'ocean.png',
      bowl: 'weapon-bowl-cutout.png', forkPink: 'weapon-fork-pink.svg', forkBlue: 'weapon-fork-blue.svg',
      stick: 'weapon-stick-cutout.png', sword: 'weapon-sword.svg', enemyGreen: 'enemy-green.png', enemyPink: 'enemy-pink.png',
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
    return this.width * (0.165 + 0.335 * t);
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
    this.drawNaturalCoast(tick, false);
    this.drawTrack(tick);
  }

  // Soft scenic layers and seeded organic details keep the play area legible without a hard-edged road.
  drawNaturalCoast(tick, dusk) {
    const ctx = this.context, w = this.width, h = this.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, dusk ? '#405b84' : '#a8ddec'); sky.addColorStop(0.72, dusk ? '#b6d4d0' : '#fff0ce'); sky.addColorStop(1, dusk ? '#88bac0' : '#c8e9d4');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.79, h * 0.17, 1, w * 0.79, h * 0.17, w * 0.16);
    sun.addColorStop(0, dusk ? '#ffe3ba66' : '#fff8d9dd'); sun.addColorStop(1, '#fff8d900');
    ctx.fillStyle = sun; ctx.fillRect(w * 0.58, 0, w * 0.42, h * 0.38);
    this.drawCloud(w * 0.32, h * 0.16, 0.8); this.drawCloud(w * 0.68, h * 0.24, 0.55);
    // Distant island ridges.
    ctx.fillStyle = dusk ? '#557e83' : '#8ab8a0'; ctx.beginPath(); ctx.moveTo(0, h * .39);
    ctx.bezierCurveTo(w * .16, h * .31, w * .2, h * .36, w * .36, h * .34);
    ctx.bezierCurveTo(w * .53, h * .3, w * .62, h * .39, w * .77, h * .33);
    ctx.bezierCurveTo(w * .88, h * .29, w * .93, h * .34, w, h * .32); ctx.lineTo(w, h * .52); ctx.lineTo(0, h * .52); ctx.fill();
    ctx.fillStyle = dusk ? '#386f80' : '#63bdc4'; ctx.fillRect(0, h * .38, w, h * .3);
    for (let row = 0; row < 7; row++) {
      const yy = h * (.405 + row * .035), phase = tick * (.009 + row * .001);
      ctx.beginPath();
      for (let x = -8; x <= w + 8; x += 8) {
        const y = yy + Math.sin(x * .035 + phase + row) * (1.3 + row * .35) + Math.sin(x * .012 - phase) * 1.2;
        if (x === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = dusk ? `rgba(199,235,224,${.12 + row * .018})` : `rgba(224,255,238,${.16 + row * .018})`;
      ctx.lineWidth = 1 + row * .18; ctx.stroke();
    }
    // Meandering foam line and a softly blended shore.
    const shore = h * .625;
    ctx.fillStyle = dusk ? '#d0d4bc' : '#f0d99f'; ctx.beginPath(); ctx.moveTo(0, shore);
    ctx.bezierCurveTo(w * .2, shore - 26, w * .34, shore + 18, w * .53, shore - 5);
    ctx.bezierCurveTo(w * .73, shore - 31, w * .85, shore + 15, w, shore - 7); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dusk ? '#e3eee0aa' : '#fff8dfcc'; ctx.lineWidth = Math.max(4, w * .022); ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(-10, shore - 3); ctx.bezierCurveTo(w * .18, shore - 28, w * .35, shore + 15, w * .53, shore - 7);
    ctx.bezierCurveTo(w * .74, shore - 30, w * .86, shore + 12, w + 10, shore - 9); ctx.stroke();
    ctx.strokeStyle = '#fffdf277'; ctx.lineWidth = 1.3; ctx.stroke();
    // A thin wet-sand wash.
    ctx.fillStyle = dusk ? '#b4c5aa88' : '#fff1cb99'; ctx.beginPath();
    ctx.moveTo(0, shore + 18); ctx.quadraticCurveTo(w * .25, shore - 2, w * .48, shore + 20);
    ctx.quadraticCurveTo(w * .75, shore + 38, w, shore + 10); ctx.lineTo(w, shore + 67); ctx.quadraticCurveTo(w * .54, shore + 82, 0, shore + 58); ctx.fill();
    // Stable irregular shells, pebbles and grass tufts; no frame-to-frame flicker.
    for (let i = 0; i < 92; i++) {
      const seed = (i * 73.17 + 19.3) % 997, x = (seed * 37.7) % w;
      const y = h * .69 + ((seed * 13.9) % (h * .28));
      const radius = .7 + (i % 5) * .38;
      ctx.globalAlpha = .12 + (i % 4) * .035; ctx.fillStyle = i % 3 ? '#916f51' : '#fff8dc';
      ctx.beginPath(); ctx.ellipse(x, y, radius * 1.5, radius, (i % 7) * .22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const x = side < 0 ? w * (.03 + i * .035) : w * (.97 - i * .035), y = h * (.68 + (i % 2) * .13);
        ctx.strokeStyle = dusk ? '#597c57aa' : '#62986a99'; ctx.lineWidth = 1.4;
        for (let blade = -1; blade <= 1; blade++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + blade * 8, y - 11, x + blade * 13, y - 19 - (i % 3) * 3); ctx.stroke(); }
      }
    }
    const vignette = ctx.createRadialGradient(w * .5, h * .5, h * .2, w * .5, h * .5, h * .85);
    vignette.addColorStop(0, '#ffffff00'); vignette.addColorStop(1, dusk ? '#09284c22' : '#3a674322'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
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
    const ctx = this.context, w = this.width, h = this.height, start = .58;
    // Keep the runner path aligned with the wider projection and split it into three curved lanes.
    ctx.fillStyle = '#f6e7c044'; ctx.beginPath();
    for (let step = 0; step <= 24; step++) {
      const depth = start + (1 - start) * step / 24, x = this.projectX(0, depth), y = this.projectY(depth);
      if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let step = 24; step >= 0; step--) {
      const depth = start + (1 - start) * step / 24, x = this.projectX(1, depth), y = this.projectY(depth);
      ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9f855b42'; ctx.lineWidth = Math.max(1, w * .004); ctx.lineCap = 'round';
    for (const lane of [1 / 3, 2 / 3]) {
      ctx.beginPath();
      for (let step = 0; step <= 24; step++) {
        const depth = start + (1 - start) * step / 24, x = this.projectX(lane, depth), y = this.projectY(depth);
        if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  drawSirenSea(tick, bossAge = 0) {
    const ctx = this.context, w = this.width, h = this.height;
    if (bossAge < 180) {
      const image = this.images.ocean;
      ctx.fillStyle = '#102b52'; ctx.fillRect(0, 0, w, h);
      if (image?.complete && image.naturalWidth) {
        const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
        const iw = image.naturalWidth * scale, ih = image.naturalHeight * scale;
        ctx.drawImage(image, (w - iw) / 2, (h - ih) / 2, iw, ih);
      }
      ctx.fillStyle = '#09213d42'; ctx.fillRect(0, 0, w, h);
    } else this.drawNaturalCoast(tick, true);
    if (bossAge < 180) this.drawTrack(tick);
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
    const ctx = this.context, y = this.projectY(gate.depth), x = this.projectX(gate.lane, gate.depth);
    const scale = 0.45 + gate.depth * 0.48, gw = 48 * scale, gh = 27 * scale;
    const color = gate.rewardType === 'multiplier' ? '#9c61df99' : gate.value < 0 ? '#e84d56b3' : '#368be5a6';
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x - gw / 2, y - gh, gw, gh, gh / 2); ctx.fill();
    ctx.strokeStyle = gate.rewardType === 'multiplier' ? '#8441c9cc' : gate.value < 0 ? '#d53c46cc' : '#2774c8cc'; ctx.lineWidth = 1.5; ctx.stroke();
    const label = gate.rewardType === 'multiplier' ? `\u00d7${gate.value}` : `${gate.value < 0 ? '-' : '+'}${Math.abs(gate.value)}`;
    ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(10, 12 * scale)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - gh * 0.5); ctx.textBaseline = 'alphabetic';
  }

  drawWeapon(pickup) {
    const ctx = this.context, y = this.projectY(pickup.depth), x = this.projectX(pickup.lane, pickup.depth), scale = 0.34 + pickup.depth * 0.85;
    const image = pickup.weaponKey === 'fork' ? this.images[pickup.weaponVariant === 'pink' ? 'forkPink' : 'forkBlue'] : this.images[pickup.weaponKey], size = 43 * scale;
    if (image?.complete && image.naturalWidth) {
      const bounds = {
        bowl: [0.43, 0.55], fork: [0.86, 1.1], stick: [0.43, 1.05], sword: [0.95, 0.42],
      }[pickup.weaponKey] || [0.86, 1.1];
      ctx.drawImage(image, x - size * bounds[0] / 2, y - size * bounds[1] / 2, size * bounds[0], size * bounds[1]);
    }
    ctx.fillStyle = '#423729'; ctx.font = `900 ${Math.max(10, 12 * scale)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText('+' + pickup.bonus, x, y - size * 0.74);
  }

  drawHorde(horde) {
    if (horde.count <= 0) return;
    for (let i = 0; i < horde.count; i++) {
      const row = Math.floor(i / 3), col = i % 3, depth = Math.max(0.08, horde.depth - row * 0.032);
      const x = this.projectX(0.5 + (col - 1) * 0.14, depth), y = this.projectY(depth);
      const size = (23 + depth * 28) * Math.min(1.15, this.width / 390);
      const image = this.images[horde.variants[i] === 'green' ? 'enemyGreen' : 'enemyPink'];
      const ctx = this.context;
      ctx.fillStyle = '#55453530'; ctx.beginPath(); ctx.ellipse(x, y - 1, size * .36, size * .09, 0, 0, Math.PI * 2); ctx.fill();
      if (image?.complete && image.naturalWidth) ctx.drawImage(image, x - size * .46, y - size * .98, size * .92, size * .96);
    }
  }

  drawBoss(boss) {
    const ctx = this.context, h = this.height, w = this.width, image = this.images.siren;
    const entrance = Math.min(1, boss.age / 180), targetY = this.projectY(boss.depth);
    const y = h * (1.05 - entrance * 0.67) + (targetY - h * 0.38) * entrance;
    const size = Math.min(w * 0.68, h * 0.42) * (0.62 + entrance * 0.38), x = w / 2;
    if (image?.complete && image.naturalWidth) {
      ctx.save(); ctx.shadowColor = '#0a193e77'; ctx.shadowBlur = 12;
      ctx.drawImage(image, x - size * 0.42, y - size * 0.42, size * 0.84, size * 0.84); ctx.restore();
    }
    else this.drawHamster(x, y, size * 0.35, 'siren', 0);
    ctx.fillStyle = '#09223fdc'; ctx.beginPath(); ctx.roundRect(w * 0.12, 20, w * 0.76, 18, 8); ctx.fill();
    ctx.fillStyle = '#ff6f8e'; ctx.beginPath(); ctx.roundRect(w * 0.12, 20, w * 0.76 * Math.max(0, boss.health / boss.maxHealth), 18, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `1000 ${Math.max(12, w * 0.038)}px system-ui`; ctx.textAlign = 'center';
    ctx.fillText(`SIREN ${Math.ceil(boss.health).toLocaleString()} / ${boss.maxHealth.toLocaleString()}`, w / 2, 57);
    if (entrance < 1) {
      ctx.fillStyle = '#fff'; ctx.font = `1000 ${Math.max(22, w * 0.075)}px system-ui`; ctx.shadowColor = '#07294d'; ctx.shadowBlur = 9;
      ctx.fillText('세이렌 등장!', w / 2, h * 0.21); ctx.shadowBlur = 0;
    }
  }

  drawPlayer(player, tick) {
    const y = this.projectY(player.depth), x = this.projectX(player.lane, player.depth), scale = Math.max(0.7, Math.min(1.18, this.width / 390));
    const roster = ['hachiwore', 'usagi', 'rakkko', 'kurimanju'];
    player.crewOffsets.forEach((offset, index) => this.drawHamster(this.projectX(player.lane + offset, player.depth), y + 4 * scale, scale * 0.78, roster[index], tick));
    this.drawHamster(x, y, scale, 'chiikawa', tick);
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
    // Soft layered shading and a fuller silhouette bring the crew closer to the supplied 2D art.
    const body = ctx.createRadialGradient(-5, -29, 2, 0, -18, 23);
    body.addColorStop(0, '#ffffff'); body.addColorStop(0.58, fur); body.addColorStop(1, kind === 'kurimanju' ? '#a77d60' : '#ddcec0');
    ctx.fillStyle = '#a47855'; ctx.beginPath(); ctx.ellipse(-8, -1, 3.5, 5, 0, 0, Math.PI * 2); ctx.ellipse(8, -1, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body; ctx.strokeStyle = '#4b3834'; ctx.lineWidth = 1.35;
    ctx.beginPath(); ctx.ellipse(0, -17, 14.5, 18.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-9, -29, 4.4, 5.2, -0.12, 0, Math.PI * 2); ctx.ellipse(9, -29, 4.4, 5.2, 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-10, -33, 1.6, 2.1, 0, 0, Math.PI * 2); ctx.ellipse(8, -33, 1.6, 2.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent;
    if (kind === 'usagi') {
      ctx.beginPath(); ctx.ellipse(-5, -43, 3.4, 11, -0.14, 0, Math.PI * 2); ctx.ellipse(5, -43, 3.4, 11, 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efb3b3'; ctx.beginPath(); ctx.ellipse(-5, -43, 1.3, 7, -0.14, 0, Math.PI * 2); ctx.ellipse(5, -43, 1.3, 7, 0.14, 0, Math.PI * 2); ctx.fill();
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
    ctx.fillStyle = '#edaaa188'; ctx.beginPath(); ctx.ellipse(-8.5, -15, 3.5, 2.3, 0, 0, Math.PI * 2); ctx.ellipse(8.5, -15, 3.5, 2.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b302c'; ctx.beginPath(); ctx.ellipse(-4.4, -21, 1.55, 2.5, 0, 0, Math.PI * 2); ctx.ellipse(4.4, -21, 1.55, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4.7, -22, 0.65, 0, Math.PI * 2); ctx.arc(4.1, -22, 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3b302c'; ctx.beginPath(); ctx.arc(0, -17, 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4d3832'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-2, -16); ctx.quadraticCurveTo(0, -13, 2, -16); ctx.stroke();
    ctx.strokeStyle = '#805d50'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-10.5, -18); ctx.lineTo(-14, -19); ctx.moveTo(10.5, -18); ctx.lineTo(14, -19); ctx.stroke();
    ctx.restore();
  }

  drawHeldWeapon(player, x, y, scale) {
    if (!player.weaponKey) return;
    const ctx = this.context, image = player.weaponKey === 'fork' ? this.images[player.weaponVariant === 'pink' ? 'forkPink' : 'forkBlue'] : this.images[player.weaponKey], size = 30 * scale;
    if (!image?.complete || !image.naturalWidth) return;
    const px = x + 13 * scale, py = y - 35 * scale;
    if (player.weaponKey === 'sword') ctx.drawImage(image, px - size * .48, py - size * .2, size * .96, size * .4);
    else {
      const width = player.weaponKey === 'bowl' || player.weaponKey === 'stick' ? 0.28 : 0.56;
      const height = player.weaponKey === 'bowl' ? 0.82 : 1.64;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-0.32); ctx.drawImage(image, -size * width / 2, -size * height / 2, size * width, size * height); ctx.restore();
    }
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
