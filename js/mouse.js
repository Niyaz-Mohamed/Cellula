import { ctx } from "./canvas.js";
import { automata } from "./main.js";
import { midpointCircle } from "./utils.js";
import { cellSize, fillRadius } from "./controls.js";

export let mouseX = 0;
export let mouseY = 0;
export var outlinePoints = [];

function updateMousePosition(event) {
  const rect = ctx.canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  outlinePoints = midpointCircle(
    Math.floor(mouseX / cellSize),
    Math.floor(mouseY / cellSize),
    fillRadius + 1
  );
  automata.drawGrid();
}

ctx.canvas.addEventListener("mousemove", updateMousePosition);

// Draw using requestAnimationFrame
let isDrawing = false;

function startDrawing() {
  isDrawing = true;
  requestAnimationFrame(drawLoop);
}

function stopDrawing() {
  isDrawing = false;
}

function drawLoop() {
  if (isDrawing) {
    automata.draw();
    requestAnimationFrame(drawLoop);
  }
}

ctx.canvas.addEventListener("mousedown", startDrawing);
ctx.canvas.addEventListener("mouseup", stopDrawing);
ctx.canvas.addEventListener("mouseleave", stopDrawing);
