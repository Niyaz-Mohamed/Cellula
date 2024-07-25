import { canvas, ctx } from "./canvas.js";
import { cellSize, fillRadius } from "./controls/controls.js";
import { fillCircle, midpointCircle } from "./circle.js";
import { mouseX, mouseY, outlinePoints } from "./controls/mouse.js";

export class Automata {
  // Create an automata for a grid of dim [rows, cols]
  constructor() {
    let rows = Math.floor(canvas.height / cellSize);
    let cols = Math.floor(canvas.width / cellSize);
    this.grid = new Array(rows)
      .fill(null)
      .map(() =>
        new Array(cols).fill(null).map(() => (Math.random() < 0 ? 1 : 0))
      );
    // For automata needing to reference past
    this.prevGrid = this.grid.map((row) => row.slice());
    this.rows = rows;
    this.cols = cols;
    // Moore neighbourhood by default
    this.neighbourhood = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
  }

  drawGrid(m = 0) {
    // Canvas settings defined in canvas.js
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Update cell colors
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        ctx.fillStyle = this.grid[row][col] ? "white" : "black";
        ctx.strokeStyle = "black";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        // ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize); // Optional Stroke
      }
    }

    // Update outlinePoints if the fill radius has changed
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    if (outlinePoints[0] != [x + fillRadius + 1, y]) {
      // Draw outline of pen
      for (const [col, row] of midpointCircle(x, y, fillRadius + 1)) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    } else {
      for (const [col, row] of outlinePoints) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  // Calculates the next state for the grid
  updateGrid() {
    let newGrid = new Array(this.grid.length)
      .fill(null)
      .map(() => new Array(this.grid[0].length).fill(0));
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        newGrid[y][x] = this.getNextState([x, y]);
      }
    }
    // Update grid state and draw
    this.prevGrid = this.grid.map((row) => row.slice());
    this.grid = newGrid;
    this.drawGrid();
  }

  // TODO: Override for custom automata
  // Calculates the next state for a single cell in the grid (GoL by default)
  getNextState(position) {
    const [x, y] = position;
    // Count neighbors
    let neighbourCount = 0;
    for (let [dx, dy] of this.neighbourhood) {
      // Loop around grid
      if (y + dy >= this.rows) dy -= this.rows;
      else if (y + dy < 0) dy += this.rows;
      if (x + dx >= this.cols) dx -= this.cols;
      else if (x + dx < 0) dx += this.cols;
      neighbourCount += this.grid[y + dy][x + dx];
    }

    // Update cell state
    if (neighbourCount === 3 && this.grid[y][x] === 0) return 1; // Birth condition
    if ((neighbourCount === 2 || neighbourCount === 3) && this.grid[y][x] === 1)
      return 1; // Survival condition
    return 0;
  }

  // Handles updates of the grid when mouse is pressed
  drawLife() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      if (x >= 0 && x <= this.grid[0].length && y >= 0 && y <= this.grid.length)
        this.grid[y][x] = 1;
    }
    this.drawGrid();
  }
}
