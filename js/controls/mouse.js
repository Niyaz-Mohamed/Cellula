import { canvas } from "../canvas.js";
import { automata } from "../main.js";
import { midpointCircle } from "../circle.js";
import { CELLSIZE, FILLRADIUS } from "./controls.js";

export let mouseX = 0;
export let mouseY = 0;
export let outlinePoints = [];

function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  outlinePoints = midpointCircle(
    Math.floor(mouseX / CELLSIZE),
    Math.floor(mouseY / CELLSIZE),
    FILLRADIUS + 1
  );
  automata.drawGrid();
}

canvas.addEventListener("mousemove", updateMousePosition);

let intervalId = null;

function startDrawing() {
  if (!intervalId) {
    intervalId = setInterval(() => automata.drawLife(), 1000 / 30);
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
