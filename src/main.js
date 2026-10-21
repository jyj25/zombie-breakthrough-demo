import { GameController } from './GameController.js';
import { GameUI } from './ui/GameUI.js';

const canvas = document.querySelector('#game-canvas');
let game;
const ui = new GameUI(() => game.start());
game = new GameController(canvas, ui);
