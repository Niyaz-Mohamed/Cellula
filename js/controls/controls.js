import { canvas } from "../canvas.js";
import { automata } from "../main.js";

// Call drawGrid to update when changes occur, register drawGrid in main
export let drawGrid;

export function setDrawGrid(drawFunc) {
  drawGrid = drawFunc;
}

// Main settings to control behavior of automata
export let cellSize = 10;
export let fps = 30;
export let fillRadius = 5;

export function setCellSize(size) {
  cellSize = size;
}

export function setFps(frames) {
  fps = frames;
  console.log(`FPS set to: ${frames}`);
}

export function setFillRadius(radius) {
  fillRadius = radius;
  console.log(`Fill Radius set to: ${radius}`);
  automata.drawGrid(1);
}
