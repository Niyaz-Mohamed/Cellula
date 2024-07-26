import { canvas } from "../canvas.js";
import { automata } from "../main.js";
import { midpointCircle } from "../utils.js";
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
    intervalId = setInterval(
      () => automata.draw(),
      1000 / (fps > 10 ? fps : 10)
    );
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
