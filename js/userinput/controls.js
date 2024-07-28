// Call drawGrid to update when changes occur, register drawGrid in main
import { automata } from "../main.js";

// Main settings to control behavior of automata
export let cellSize = 3;
export let waitTime = 0;
export let fillRadius = 3;
export let paused = false;
export let backgroundColor = [21, 25, 31]; // #15191f

// Setter functions
export function setCellSize(size) {
  cellSize = size;
}

export function setWaitTime(time) {
  waitTime = time;
  console.log(`Minimum time between frames set to: ${waitTime}ms`);
  automata.updateGrid();
}

export function setFillRadius(radius) {
  fillRadius = radius;
  console.log(`Fill Radius set to: ${radius}`);
  automata.updateGrid();
}

export function changePaused() {
  paused = !paused;
  console.log(paused ? "Simulation paused" : "Simulation continued");
  automata.updateGrid();
}
