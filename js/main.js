import "./controls/keys.js";
import { resizeCanvas } from "./canvas.js";
import { LifeLikeAutomata } from "./automata.js";
import { fps, setDrawGrid } from "./controls/controls.js";

// Set the drawGrid funcxxtion
export const automata = new LifeLikeAutomata("B3/S23"); // Conway's Gol
setDrawGrid(() => automata.drawGrid()); // Stop loss of context
resizeCanvas();

automata.drawGrid();
setInterval(() => {
  automata.updateGrid(), 1000 / fps;
});
