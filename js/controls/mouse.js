import { canvas } from "../canvas.js";
import { automata } from "../main.js";
import { midpointCircle } from "../circle.js";
import { cellSize, fillRadius, fps } from "./controls.js";

export let mouseX = 0;
export let mouseY = 0;
export var outlinePoints = [];

function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  outlinePoints = midpointCircle(
    Math.floor(mouseX / cellSize),
    Math.floor(mouseY / cellSize),
    fillRadius + 1
  );
  automata.drawGrid();
}

canvas.addEventListener("mousemove", updateMousePosition);

let intervalId = null;

function startDrawing() {
  if (!intervalId) {
    intervalId = setInterval(() => automata.drawLife(), 1000 / (1.1 * fps));
  }
}

function stopDrawing() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);
