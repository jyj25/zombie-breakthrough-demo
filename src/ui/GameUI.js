import { GAME_STATE } from '../config.js';

export class GameUI {
  constructor(onStart) {
    this.power = document.querySelector('#power');
    this.wave = document.querySelector('#wave');
    this.kills = document.querySelector('#kills');
    this.overlay = document.querySelector('#game-overlay');
    this.title = document.querySelector('#dialog-title');
    this.message = document.querySelector('#dialog-message');
    this.startButton = document.querySelector('#start-button');
    // Bind directly to the real button once; start and restart share this handler.
    this.startButton.addEventListener('click', onStart);
    this.startButton.addEventListener('pointerup', event => event.stopPropagation());
  }

  show(state, stats = {}) {
    const power = (stats.power ?? 1).toLocaleString();
    this.power.textContent = stats.multiplier > 1 ? `${power} ×${stats.multiplier}` : power;
    this.wave.textContent = `${Math.min(stats.wave ?? 1, 6)} / 6`;
    this.kills.textContent = String(stats.kills ?? 0);
    if (state === GAME_STATE.PLAYING) { this.overlay.hidden = true; return; }
    this.overlay.hidden = false;
    if (state === GAME_STATE.READY) {
      this.title.textContent = '좀비 돌파';
      this.message.innerHTML = '통로를 달리며 좀비 무리를 물리치고<br>단일 게이트를 통과해 공격력을 키우세요.<br>×2·×3 게이트는 한 번에 여러 발을 발사합니다.<br><strong>최종 보스는 공격력 9,999에서 등장</strong>';
      this.startButton.textContent = '게임 시작';
    } else if (state === GAME_STATE.GAME_OVER) {
      this.title.textContent = '게임 오버';
      this.message.innerHTML = `좀비가 플레이어와 부딪혔어요.<br>처치 <b>${stats.kills}</b> · 공격력 <b>${stats.power.toLocaleString()}</b>`;
      this.startButton.textContent = '다시 시작';
    } else if (state === GAME_STATE.WON) {
      this.title.textContent = '최종 보스 격파!';
      this.message.innerHTML = `99,999 체력의 최종 보스를 물리쳤습니다!<br>최종 공격력 <b>${stats.power.toLocaleString()}</b>`;
      this.startButton.textContent = '다시 플레이';
    }
  }
}
