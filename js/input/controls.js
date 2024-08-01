// Call drawGrid to update when changes occur, register drawGrid in main
import { automata } from "../automata.js";
import { setConsoleText } from "../utils.js";

// Main settings to control behavior of automata
export let cellSize = 3;
export let waitTime = 0;
export let fillRadius = 3;
export let paused = false;
export let backgroundColor = [21, 25, 31]; // #15191f (rich black)

// Setter functions
export function setCellSize(size) {
  cellSize = size;
}

export function setWaitTime(time) {
  waitTime = time;
  setConsoleText(`Minimum time between frames set to: ${waitTime}ms`);
  automata.updateGrid();
}

export function setFillRadius(radius) {
  fillRadius = radius;
  setConsoleText(`Fill Radius set to: ${radius}`);
  automata.drawGrid();
}

export function changePaused() {
  paused = !paused;
  setConsoleText(paused ? "Simulation paused" : "Simulation continued");
  automata.updateGrid();
}
