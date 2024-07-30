import { ctx } from "./canvas.js";
import { automata } from "./main.js";
import { midpointCircle, setConsoleText } from "./utils.js";
import {
  cellSize,
  paused,
  changePaused,
  fillRadius,
  setFillRadius,
  waitTime,
  setWaitTime,
} from "./controls.js";

export let mouseX = 0;
export let mouseY = 0;
export var outlinePoints = [];

//! MOUSE FUNCTIONS

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

//! DRAGGEABLE WINDOW FUNCTIONS

// Trigger window dragging for all draggable windows
document.querySelectorAll(".window").forEach((element) => {
  triggerDragElement(element);
  // Shift positions of windows randomly
  element.style.top =
    element.offsetTop +
    Math.floor(Math.random() * window.innerHeight * 0.85) +
    "px";
  element.style.left =
    element.offsetLeft +
    Math.floor(Math.random() * window.innerWidth * 0.85) +
    "px";
});

function triggerDragElement(element) {
  let xPos = 0,
    yPos = 0,
    changeOfX = 0,
    changeOfY = 0;
  const minTop = window.innerHeight * 0.05; // 5vh, for clamping y position

  // Check for presence of a header
  if (document.getElementById(element.id + "-header")) {
    document.getElementById(element.id + "-header").onmousedown = dragMouseDown;
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
    changeOfX = xPos - e.clientX;
    changeOfY = yPos - e.clientY;
    xPos = e.clientX;
    yPos = e.clientY < minTop ? yPos : e.clientY; // Clamp mouse y position

    // Set new position
    let newTop = element.offsetTop - changeOfY;
    element.style.top = (newTop < minTop ? minTop : newTop) + "px";
    element.style.left = element.offsetLeft - changeOfX + "px";
  }

  function closeDragElement() {
    // Stop moving when mouse stops
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// Hide window when X is pressed
document.querySelectorAll(".window-delete").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".window").style.display = "none";
  });
});

// Trigger a window to open
document.querySelectorAll(".triggerbtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.id.slice(0, -4)).style.display = "block";
  });
});

// Prevent any button from being focused and pressed on space
document.querySelectorAll("button").forEach(function (item) {
  item.addEventListener("focus", function () {
    this.blur();
  });
});

//! KEY INPUTS
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    // Controls for stepping through
    case ".":
      if (paused) changePaused(); // Unpause the sim to update
      //automata.updateGrid();
      if (!paused) changePaused(); // Pause the sim

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

//! SETTINGS BUTTON PRESSED
document.querySelectorAll(".dropdown-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.querySelector(".option-name").innerHTML;
    switch (action) {
      // Controls for stepping through
      case "Step":
        if (paused) changePaused(); // Unpause the sim to update
        automata.updateGrid();
        changePaused(); // Pause the sim

      // Controls for fillRadius increase
      case "Higher Fill Amt":
        setFillRadius(fillRadius + 1);
        break;
      case "Lower Fill Amt":
        setFillRadius(fillRadius - 1 < 0 ? 0 : fillRadius - 1);
        break;

      // Controls for FPS throttling
      case "Higher Delay":
        setWaitTime(waitTime + 50);
        break;
      case "Lower Delay":
        setWaitTime(waitTime - 50 < 0 ? 0 : waitTime - 50);
        break;

      // Controls for pausing on space
      case "Pause/Unpause":
        changePaused();
        break;

      // Grid randomization
      case "Randomize Grid":
        setConsoleText("Randomizing Grid");
        automata.randomize();

      case "Change Pen Fill":
        automata.cycleDraw();

      default:
        break;
    }
  });
});
