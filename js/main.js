import "./controls/keys.js";
import { resizeCanvas } from "./canvas.js";
import { Automata } from "./automata.js";
import { fps, setDrawGrid } from "./controls/controls.js";

// Set the drawGrid function
export const automata = new Automata();
setDrawGrid(() => automata.drawGrid()); // Stop loss of context
resizeCanvas();

automata.drawGrid();
setInterval(() => automata.updateGrid(), 1000 / fps);
