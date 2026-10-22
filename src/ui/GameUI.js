import { GAME_STATE } from '../config.js';

export class GameUI {
  constructor(onStart) {
    this.power = document.querySelector('#power');
    this.wave = document.querySelector('#wave');
    this.kills = document.querySelector('#kills');
    this.overlay = document.querySelector('#game-overlay');
    this.title = document.querySelector('#dialog-title');
    this.message = document.querySelector('#dialog-message');
    this.image = document.querySelector('#dialog-image');
    this.startButton = document.querySelector('#start-button');
    this.startButton.addEventListener('click', onStart);
    this.startButton.addEventListener('pointerup', event => event.stopPropagation());
  }

  show(state, stats = {}) {
    const power = (stats.power ?? 1).toLocaleString();
    this.power.textContent = stats.multiplier > 1 ? `${power} ×${stats.multiplier}` : power;
    this.wave.textContent = `${Math.min(stats.wave ?? 1, 6)} / 6`;
    this.kills.textContent = String(stats.kills ?? 0);
    if (state === GAME_STATE.INTRO || state === GAME_STATE.PLAYING) { this.overlay.hidden = true; return; }
    this.overlay.hidden = false;
    if (state === GAME_STATE.READY) {
      this.title.textContent = '세이렌 토벌';
      this.message.innerHTML = '가운데의 적을 공격하고 좌우에서 무기와 공격력 보너스를 모으세요.<br>빨간 − 게이트는 피하세요. 공격력 × 발사 배수가 9,999를 넘으면 세이렌이 나타납니다.<br><strong>세이렌 체력 99,999 · 최대 발사 ×3</strong>';
      this.image.src = './assets/game/flight-cutout.png';
      this.image.alt = '토벌 장소로 날아가는 치이카와 토벌대';
      this.image.hidden = false;
      this.startButton.textContent = '토벌 시작';
    } else if (state === GAME_STATE.GAME_OVER) {
      this.title.textContent = '토벌 실패';
      this.message.innerHTML = `세이렌 또는 몬스터에게 붙잡혔어요.<br>처치 <b>${stats.kills}</b> · 공격력 <b>${stats.power.toLocaleString()}</b>`;
      this.image.src = './assets/game/siren.png';
      this.image.alt = '세이렌';
      this.image.hidden = false;
      this.startButton.textContent = '다시 도전';
    } else if (state === GAME_STATE.WON) {
      this.title.textContent = '토벌 성공!';
      this.message.innerHTML = `체력 99,999의 세이렌을 물리쳤어요!<br>최종 공격력 <b>${stats.power.toLocaleString()} ×${stats.multiplier}</b>`;
      this.image.src = './assets/game/siren-win.png';
      this.image.alt = '세이렌 토벌 성공 기념 이미지';
      this.image.hidden = false;
      this.startButton.textContent = '다시 토벌하기';
    }
  }
}
