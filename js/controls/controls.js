// Call drawGrid to update when changes occur, register drawGrid in main
import { automata } from "../main.js";
export let drawGrid;

export function setDrawGrid(drawFunc) {
  drawGrid = drawFunc;
}

// Main settings to control behavior of automata
export let cellSize = 8;
export let fps = 40;
export let fillRadius = 3;
export let paused = false;
export let stroke = false;

export function setCellSize(size) {
  cellSize = size;
}

// Function to reregister updateGrid
let fpsChangeCallback = () => {};
export function setFps(frames) {
  fps = frames;
  fpsChangeCallback();
  console.log(`FPS set to: ${frames}`);
}
export function onFpsChange(callback) {
  fpsChangeCallback = callback;
}

export function setFillRadius(radius) {
  fillRadius = radius;
  console.log(`Fill Radius set to: ${radius}`);
  automata.drawGrid(1);
}

export function changePaused() {
  paused = !paused;
  console.log(paused ? "Simulation paused" : "Simulation continued");
}

export function changeStroke() {
  stroke = !stroke;
  console.log(stroke ? "Added gridlines" : "Removed gridlines");
}
