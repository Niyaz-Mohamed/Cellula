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

//! MOBILE COMPATIBILITY EVENTS
const moveEvents = ["mousemove", "touchmove"];
const downEvents = ["mousedown", "touchstart"];
const upEvents = ["mouseup", "touchend"];
const leaveEvents = ["mouseleave", "touchcancel"];

function registerEvents(element, events, callback) {
  events.forEach((event) => element.addEventListener(event, callback));
}

//! MOUSE FUNCTIONS

// Update mouse coordinate whenever mouse moves
function updateMousePosition(event) {
  const rect = ctx.canvas.getBoundingClientRect();

  // Handle touch and mouse event
  if (event.touches && event.touches.length > 0) {
    mouseX = event.touches[0].clientX - rect.left;
    mouseY = event.touches[0].clientY - rect.top;
  } else {
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  }
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
  registerEvents(ctx.canvas, moveEvents, updateMousePosition);
  registerEvents(ctx.canvas, downEvents, () => {
    isDrawing = true;
    requestAnimationFrame(drawLoop);
  });
  registerEvents(ctx.canvas, upEvents.concat(leaveEvents), () => {
    isDrawing = false;
  });
}

//! DRAGGEABLE WINDOWS
// Trigger window dragging for all draggable windows
document.querySelectorAll(".window").forEach((element) => {
  triggerDragElement(element);
  // Shift positions of windows randomly
  const mobileTopOffset =
    window.innerWidth < 420
      ? 30 * 4 + Math.floor(Math.random() * window.innerHeight * 0.3)
      : null; // Shift windows by different amounts if on mobile
  const topOffset = Math.floor(
    Math.random() * window.innerHeight * 0.5 + 0.1 * window.innerHeight
  );
  const leftOffset = Math.floor(Math.random() * window.innerWidth * 0.6);

  // Set the offsets
  element.style.top = (mobileTopOffset ? mobileTopOffset : topOffset) + "px";
  element.style.left = leftOffset + "px";

  // Make startup visible
  if (element.id == "startup") {
    element.style.display = "block";
  }
});

function triggerDragElement(element) {
  let xPos = 0,
    yPos = 0,
    changeOfX = 0,
    changeOfY = 0;
  // Clamping y position of the windows
  const minTop = window.innerWidth < 420 ? 30 * 4 : window.innerHeight * 0.05;

  // Check for presence of a header
  if (document.getElementById(element.id + "-header")) {
    const header = document.getElementById(element.id + "-header");
    header.onmousedown = dragMouseDown;
    header.ontouchstart = dragMouseDown;
  } else {
    element.onmousedown = dragMouseDown;
    element.ontouchstart = dragMouseDown;
  }

  function dragMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    // Get starting mouse position
    xPos = e.clientX;
    yPos = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    document.ontouchend = closeDragElement;
    document.ontouchmove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    // Get current position of touch/mouse
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate drag distance in x and y directions
    changeOfX = xPos - clientX;
    xPos = clientX;
    changeOfY = yPos > minTop ? yPos - clientY : minTop;
    yPos = clientY;

    // Set new position
    let newTop = element.offsetTop - changeOfY;
    element.style.top = (newTop < minTop ? minTop : newTop) + "px";
    element.style.left = element.offsetLeft - changeOfX + "px";
  }

  function closeDragElement() {
    // Stop moving when mouse stops
    document.onmouseup = null;
    document.onmousemove = null;
    document.ontouchend = null;
    document.ontouchmove = null;
  }
}

// Hide window when X is pressed
document.querySelectorAll(".window-delete").forEach((btn) => {
  registerEvents(btn, ["click", "touchstart"], () => {
    btn.closest(".window").style.display = "none";
  });
});

// Trigger a window to open
document.querySelectorAll(".triggerbtn").forEach((btn) => {
  registerEvents(btn, ["click", "touchstart"], () => {
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
      automata.resetAnimationRequests();
      setConsoleText("Randomized Grid");
      break;

    // Controls for grid clearing
    case "\\":
    case "Clear Grid":
      automata.grid = new Array(automata.rows)
        .fill(null)
        .map((_) =>
          new Array(automata.cols).fill(
            automata.baseState ? automata.baseState : 0
          )
        );
      if (automata.ants) {
        automata.ants = [];
      }
      automata.resetAnimationRequests();
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
