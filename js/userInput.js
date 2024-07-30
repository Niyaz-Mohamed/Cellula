import { ctx } from "./canvas.js";
import { automata } from "./main.js";
import { midpointCircle, setConsoleText } from "./utils.js";
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
window.addEventListener("keydown", (e) => {
  e.preventDefault();
  switch (e.key) {
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
      setConsoleText("Randomizing Grid");
      automata.randomize();

    case "Shift":
      automata.cycleDraw();

    default:
      break;
  }
});

// Trigger window dragging for all draggable windows
// dragElement(document.getElementById("mydiv"));

function triggerDragElement(element) {
  let xPos = 0,
    yPos = 0,
    changeOfX = 0,
    changeOfY = 0;

  // Check for presence of a header
  if (document.getElementById(element.id + "header")) {
    document.getElementById(element.id + "header").onmousedown = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e.preventDefault();
    // Get starting mouse position
    xPos = e.clientX;
    yPos = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    changeOfX = pos3 - e.clientX;
    changeOfY = pos4 - e.clientY;
    xPos = e.clientX;
    yPos = e.clientY;
    // Set new position
    element.style.top = element.offsetTop - pos2 + "px";
    element.style.left = element.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
