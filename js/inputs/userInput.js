import { automata, ctx } from "../automata.js";
import { midpointCircle, setConsoleText } from "../utils.js";
import {
  cellSize,
  paused,
  changePaused,
  fillRadius,
  setFillRadius,
  setCellSize,
} from "./config.js";

export let mouseX = 0;
export let mouseY = 0;
export var outlinePoints = [];

//! MOUSE FUNCTIONS

// Update mouse coordinate whenever mouse moves
export function updateMousePosition(event) {
  const rect = ctx.canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  outlinePoints = midpointCircle(
    Math.floor(mouseX / cellSize),
    Math.floor(mouseY / cellSize),
    fillRadius
  );
  automata.drawCursor();
}

// Draw using requestAnimationFrame
let isDrawing = false;

function drawLoop() {
  if (isDrawing) {
    automata.draw();
    requestAnimationFrame(drawLoop);
  }
}

export function registerCanvasCallbacks(ctx) {
  ctx.canvas.addEventListener("mousemove", updateMousePosition);
  ctx.canvas.addEventListener("mousedown", () => {
    isDrawing = true;
    requestAnimationFrame(drawLoop);
  });
  ctx.canvas.addEventListener("mouseup", () => {
    isDrawing = false;
  });
  ctx.canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
  });
}

//! DRAGGEABLE WINDOWS
// Trigger window dragging for all draggable windows
document.querySelectorAll(".window").forEach((element) => {
  triggerDragElement(element);
  // Shift positions of windows randomly
  element.style.top =
    element.offsetTop +
    Math.floor(
      Math.random() * window.innerHeight * 0.5 + 0.1 * window.innerHeight
    ) +
    "px";
  element.style.left =
    element.offsetLeft +
    Math.floor(Math.random() * window.innerWidth * 0.6) +
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

//! ACTIONS FOR KEY OR SETTING BUTTON INPUTS
function handleAction(action) {
  switch (action) {
    // Controls for stepping through
    case ".":
    case "Step":
      if (paused) changePaused(); // Unpause the sim to trigger a single update
      if (!paused) changePaused(); // Pause the sim
      setConsoleText("Stepped forward by 1 evolution");
      break;

    // Controls for fillRadius changes
    case "+":
    case "=":
    case "ArrowUp":
    case "Higher Fill Amt":
      setFillRadius(fillRadius + 1);
      break;
    case "-":
    case "ArrowDown":
    case "Lower Fill Amt":
      setFillRadius(fillRadius - 1 < -1 ? -1 : fillRadius - 1);
      break;

    // Controls for cellsize changes
    case "e":
    case "Higher Cell Size":
      setCellSize(cellSize + 1);
      break;
    case "q":
    case "Lower Cell Size":
      setCellSize(cellSize - 1 < 1 ? 1 : cellSize - 1);
      break;

    // Controls for pausing
    case " ":
    case "p":
    case "Pause/Unpause":
      changePaused();
      break;

    // Controls for grid randomization
    case "Tab":
    case "r":
    case "Randomize Grid":
      automata.randomize();
      setConsoleText("Randomized Grid");
      break;

    // Controls for grid clearing
    case "Backspace":
    case "Clear Grid":
      automata.grid = new Array(automata.rows)
        .fill(null)
        .map((_) =>
          new Array(automata.cols).fill(
            automata.baseState ? automata.baseState : 0
          )
        );
      automata.drawGrid();
      setConsoleText("Cleared Grid");
      break;

    // Controls for swapping pen fill
    case "Shift":
    case "Change Pen Fill":
      automata.cycleDraw();
      break;

    // Controls for toggling toolbar existence
    case "Escape":
    case "Toggle Toolbar":
      const toolbar = document.getElementById("toolbar");
      if (toolbar.style.display == "block" || !toolbar.style.display)
        toolbar.style.display = "none";
      else toolbar.style.display = "block";

    // Controls for saving & loading grids
    case "Save":
      automata.saveData();
      setConsoleText("Saved automata data");
      break;
    case "Load":
      document.getElementById("load").style.display = "block";
      break;

    default:
      break;
  }
}

//! KEY INPUTS
window.addEventListener("keydown", (e) => {
  handleAction(e.key);
});

//! SETTINGS BUTTON PRESSED
document.querySelectorAll(".dropdown-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.querySelector(".option-name").innerHTML;
    handleAction(action);
  });
});
