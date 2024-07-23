const canvas = document.getElementById("cellGrid");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// Define grid and initial cell size
let cellSize = 5;
let grid = [];
const cols = Math.floor(window.innerWidth / cellSize);
const rows = Math.floor(window.innerHeight / cellSize);
console.log(`Grid size: [${cols},${rows}]`);
// Fill grid with live cells having a 20% probability
grid = new Array(rows)
  .fill(null)
  .map((_) =>
    new Array(cols).fill(null).map((_) => (Math.random() < 1 / 10 ? 1 : 0))
  );

// Called whenever window is resized
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawGrid();
}
// Add event listener to resize the canvas when the window is resized
window.addEventListener("resize", resizeCanvas);

// Draw the grid
function drawGrid() {
  const rows = grid.length;
  const cols = grid[0].length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.rect(col * cellSize, row * cellSize, cellSize, cellSize);
      //TODO: Update colors used here if required
      ctx.fillStyle = grid[row][col] ? "white" : "black";
      ctx.fill();
    }
  }
}

function updateGrid() {
  newGrid = new Array(grid.length)
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
      // TODO: Fix edge cases here
      for (let [dx, dy] of nb) {
        // Loop values around edges
        if (dy + y > rows) {
          dy -= rows;
        } else if (dy + y < rows) {
          dy += rows;
        } else if (dx + x > rows) {
          dx -= cols;
        } else if (dy + y < rows) {
          dx += cols;
        }
        // Add to count
        count += grid[y + dy][x + dx];
      }
      // Update cell value based on count
      if (count === 3 && grid[y][x] == 0) {
        newGrid[y][x] == 1;
      } else if ((count == 2 || count == 3) && grid[y][x] == 1) {
        newGrid[y][x] == 1;
      } else {
        newGrid[y][x] == 0;
      }
    }
  }
  grid = newGrid;
  drawGrid();
}

drawGrid();
setInterval(updateGrid, 1000 / 5); // 5FPS
