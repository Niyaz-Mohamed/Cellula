// Call drawGrid to update when changes occur, register drawGrid in main
import { automata } from "../automata.js";
import { setConsoleText } from "../utils.js";

// Main settings to control behavior of automata
export let cellSize = 3;
export let fillRadius = 3;
export let paused = false;
export let backgroundColor = [21, 25, 31]; // #15191f (rich black)

// Maps to be used for html modifications
export const nameMap = {
  "Langton's Ant": "Ants",
  "Brian's Brain": "BB",
  "Rock, Paper, Scissors": "RPS",
}; //! Used for setting automata name in top left

export const infoMap = {
  Life: "life-info",
  "Langton's Ant": "ant-info",
  "Brian's Brain": "brain-info",
  Wireworld: "wire-info",
  "Rock, Paper, Scissors": "rps-info",
}; //! Maps each automata name to the id of its info content

export const settingsMap = {
  Life: "life-settings",
  "Langton's Ant": "ant-settings",
  "Brian's Brain": "brain-settings",
  Wireworld: "wire-settings",
  "Rock, Paper, Scissors": "rps-settings",
}; //! This maps each automata name to the id of its info content

// Setter functions
export function setCellSize(size) {
  cellSize = size;
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
