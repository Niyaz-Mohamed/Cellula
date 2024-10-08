// Call drawGrid to update when changes occur, register drawGrid in main
import { automata } from "../automata.js";
import { reshape2DArray, setConsoleText } from "../utils.js";

// Main settings to control behavior of automata
export let cellSize = 3;
export let fillRadius = 3;
export let paused = false;
export let backgroundColor = [21, 25, 31]; // #15191f (rich black)

// TODO: Add any new automata here and also in automata select sidenav, info, and settings
// Maps to be used for html modifications
export const nameMap = {
  "Langton's Ant": "Ants",
  "Brian's Brain": "BB",
  "Rock, Paper, Scissors": "RPS",
  Elementary: "Elem",
}; //! Used for setting automata name in top left

export const infoMap = {
  Life: "life-info",
  "Langton's Ant": "ant-info",
  Elementary: "elementary-info",
  "Brian's Brain": "brain-info",
  Wireworld: "wire-info",
  "Rock, Paper, Scissors": "rps-info",
  Neural: "neural-info",
  Huegene: "huegene-info",
}; //! Maps each automata name to the id of its info content

export const settingsMap = {
  Life: "life-settings",
  "Langton's Ant": "ant-settings",
  Elementary: "elementary-settings",
  "Brian's Brain": "brain-settings",
  Wireworld: "wire-settings",
  "Rock, Paper, Scissors": "rps-settings",
  Neural: "neural-settings",
  Huegene: "huegene-settings",
}; //! This maps each automata name to the id of its info content

// Setter functions
export function setCellSize(size) {
  cellSize = size;
  // Reshape the grid
  const newRows = Math.floor(window.innerHeight / cellSize);
  const newCols = Math.floor(window.innerWidth / cellSize);
  automata.grid = reshape2DArray(
    automata.grid,
    newRows > 0 ? newRows : 1,
    newCols > 0 ? newCols : 1,
    automata.baseState ? automata.baseState : 0
  );
  automata.rows = newRows;
  automata.cols = newCols;
  setConsoleText(`Cell Size set to: ${cellSize}`);
  automata.drawTimes = automata.drawTimes.slice(-5);
  automata.drawGrid();
  automata.drawCursor();
}

export function setFillRadius(radius) {
  fillRadius = radius;
  setConsoleText(`Fill Radius set to: ${radius}`);
  automata.drawCursor();
}

export function changePaused() {
  paused = !paused;
  setConsoleText(paused ? "Simulation paused" : "Simulation continued");
  automata.updateGrid();
}
