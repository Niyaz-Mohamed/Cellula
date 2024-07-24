import { canvas, resizeCanvas } from "./canvas.js";
import { Automata } from "./automata.js";
import { CELLSIZE, FPS } from "./controls/controls.js";

export const automata = new Automata();
resizeCanvas();
automata.drawGrid();
setInterval(() => automata.updateGrid(), 1000 / FPS);
