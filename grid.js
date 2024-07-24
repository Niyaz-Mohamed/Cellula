// Fetch canvas
const canvas = document.getElementById("cellGrid");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// Define grid and initial cell size
let cellSize = 7;
let grid = [];
const cols = Math.floor(window.innerWidth / cellSize);
const rows = Math.floor(window.innerHeight / cellSize);
console.log(`Grid size: [${cols},${rows}]`);
// Fill grid with live cells having a 50% probability
grid = new Array(rows)
  .fill(null)
  .map((_) =>
    new Array(cols).fill(null).map((_) => (Math.random() < 1 / 2 ? 1 : 0))
  );

// Track mouse position
let mouseX = 0;
let mouseY = 0;

// Update mouse position
function updateMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  drawGrid();
}
canvas.addEventListener("mousemove", updateMousePosition);

// Called whenever window is resized
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawGrid();
}
// Add event listener to resize the canvas when the window is resized
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

// Draw the grid
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // For drawing ring around mouse position
  const ringCells = midpointCircle(
    Math.floor(mouseX / cellSize),
    Math.floor(mouseY / cellSize),
    10
  );

  // Draw each square
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Update ring
      if (JSON.stringify(ringCells).indexOf(JSON.stringify([col, row])) != -1) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)"; // Color for highlighting
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      } else {
        ctx.fillStyle = grid[row][col] ? "white" : "black";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
}

function updateGrid() {
  let newGrid = new Array(grid.length)
    .fill(null)
    .map((_) => new Array(grid[0].length).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Generate neighbourhood
      const nb = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];
      let count = 0;
      for (var [dx, dy] of nb) {
        // Loop values around edges
        if (y + dy >= rows) {
          dy -= rows;
        } else if (y + dy < 0) {
          dy += rows;
        } else if (x + dx >= cols) {
          dx -= cols;
        } else if (x + dx < 0) {
          dx += cols;
        }
        // Update count
        count += grid[y + dy][x + dx];
      }
      // Update cell value based on count
      if (count === 3 && grid[y][x] == 0) {
        newGrid[y][x] = 1;
      } else if ((count == 2 || count == 3) && grid[y][x] == 1) {
        newGrid[y][x] = 1;
      } else {
        newGrid[y][x] = 0;
      }
    }
  }
  grid = newGrid;

  drawGrid();
}

function unique2DArr(arr) {
  var unique = [];
  var elementsFound = {};
  for (var i = 0; i < arr.length; i++) {
    var stringified = JSON.stringify(arr[i]);
    if (elementsFound[stringified]) {
      continue;
    }
    unique.push(arr[i]);
    elementsFound[stringified] = true;
  }
  return unique;
}

// Midpoint circle algorithm
function midpointCircle(x, y, r) {
  let points = [];
  let dx = r;
  let dy = 0;
  let p = 1 - r; // Initial decision parameter

  // Draw the circle
  while (dx >= dy) {
    // Push points in all 8 octants
    points.push(
      [x + dx, y + dy],
      [x - dx, y + dy],
      [x + dx, y - dy],
      [x - dx, y - dy],
      [x + dy, y + dx],
      [x - dy, y + dx],
      [x + dy, y - dx],
      [x - dy, y - dx]
    );

    dy++;
    if (p <= 0) {
      p = p + 2 * dy + 1;
    } else {
      dx--;
      p = p + 2 * dy - 2 * dx + 1;
    }
  }

  // Reduce to unique points
  return unique2DArr(points);
}

function fillCircle(x, y, r) {
  let points = [];
  for (let i = 0; i <= r; i++) {
    points.push(...midpointCircle(x, y, i));
  }
  return unique2DArr(points);
}

function drawLife(event) {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  let x = Math.floor(mouseX / cellSize);
  let y = Math.floor(mouseY / cellSize);
  let points = fillCircle(x, y, 9);

  for (const [x, y] of points) {
    grid[y][x] = 1;
  }
  drawGrid();
}
window.addEventListener("mousedown", drawLife);

drawGrid();
setInterval(updateGrid, 1000 / 5);
