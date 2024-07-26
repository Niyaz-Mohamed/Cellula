import "./controls/keys.js";
import { resizeCanvas } from "./canvas.js";
import { LifeLikeAutomata } from "./automata.js";
import { fps, setDrawGrid, onFpsChange } from "./controls/controls.js";

// Set the drawGrid function
export const automata = new LifeLikeAutomata("B1/S0123456789"); // Conway's Gol
setDrawGrid(() => automata.drawGrid()); // Stop loss of context
resizeCanvas();
automata.drawGrid();

// Update interval when fps changes
let intervalId;

function updateInterval() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  intervalId = setInterval(() => {
    automata.updateGrid();
  }, 1000 / fps);
}

// Begin listening for updates
updateInterval();
onFpsChange(() => {
  updateInterval();
});
