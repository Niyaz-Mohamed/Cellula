import "./controls/keys.js";
import { resizeCanvas } from "./canvas.js";
import { LifeLikeAutomata } from "./automata.js";
import { fps, setDrawGrid, onFpsChange } from "./controls/controls.js";

// Set the drawGrid function
export const automata = new LifeLikeAutomata("B4678/S35678"); // Automata Definition
setDrawGrid(() => automata.drawGrid()); // Register callback for drawing grid
resizeCanvas();

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
