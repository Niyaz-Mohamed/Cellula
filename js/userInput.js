import { ctx } from "./canvas.js";
import { automata } from "./main.js";
import { midpointCircle } from "./utils.js";
import {
  cellSize,
  changePaused,
  fillRadius,
  setFillRadius,
  waitTime,
  setWaitTime,
} from "./controls.js";

export let mouseX = 0;
export let mouseY = 0;
export var outlinePoints = [];

// Update mouse coordinate whenever mouse moves
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

// Key inputs
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    // Controls for fillRadius increase
    case "ArrowUp":
      setFillRadius(fillRadius + 1);
      break;
    case "ArrowDown":
      setFillRadius(fillRadius - 1 < 0 ? 0 : fillRadius - 1);
      break;

    // Controls for FPS throttling
    case "=":
    case "+":
      setWaitTime(waitTime + 50);
      break;
    case "-":
      setWaitTime(waitTime - 50 < 0 ? 0 : waitTime - 50);
      break;

    // Controls for pausing on space
    case "p":
    case " ":
      changePaused();
      break;

    // Grid randomization
    case "Tab":
    case "r":
      automata.randomize();

    default:
      break;
  }
});
