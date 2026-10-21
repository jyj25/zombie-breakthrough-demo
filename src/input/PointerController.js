/** Converts mouse and touch pointer positions into a normalized lane value. */
export class PointerController {
  constructor(canvas, onMove) {
    this.canvas = canvas;
    this.onMove = onMove;
    this.handleMove = this.handleMove.bind(this);
    this.handleDown = this.handleDown.bind(this);
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointermove', this.handleMove);
  }

  handleDown(event) {
    if (event.pointerType === 'touch') this.canvas.setPointerCapture(event.pointerId);
    this.handleMove(event);
  }

  handleMove(event) {
    const bounds = this.canvas.getBoundingClientRect();
    const lane = (event.clientX - bounds.left) / bounds.width;
    this.onMove(Math.max(0.04, Math.min(0.96, lane)));
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.handleDown);
    this.canvas.removeEventListener('pointermove', this.handleMove);
  }
}
