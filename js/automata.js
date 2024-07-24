import { canvas, ctx } from "./canvas.js";
import { CELLSIZE, FILLRADIUS } from "./controls/controls.js";
import { fillCircle } from "./circle.js";
import { mouseX, mouseY, outlinePoints } from "./controls/mouse.js";

export class Automata {
  // Create an automata for a grid of dim [rows, cols]
  constructor() {
    const rows = Math.floor(canvas.height / CELLSIZE);
    const cols = Math.floor(canvas.width / CELLSIZE);
    this.grid = new Array(rows)
      .fill(null)
      .map(() =>
        new Array(cols).fill(null).map(() => (Math.random() < 0 ? 1 : 0))
      );
    console.log(this.grid[0].length, this.grid.length);
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

  drawGrid() {
    // Canvas settings defined in canvas.js
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Update cell colors
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        ctx.fillStyle = this.grid[row][col] ? "white" : "black";
        ctx.strokeStyle = "black";
        ctx.fillRect(col * CELLSIZE, row * CELLSIZE, CELLSIZE, CELLSIZE);
        // ctx.strokeRect(col * CELLSIZE, row * CELLSIZE, CELLSIZE, CELLSIZE); // Optional Stroke
      }
    }

    // Draw outline of pen
    for (const [col, row] of outlinePoints) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
      ctx.fillRect(col * CELLSIZE, row * CELLSIZE, CELLSIZE, CELLSIZE);
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
    let x = Math.floor(mouseX / CELLSIZE);
    let y = Math.floor(mouseY / CELLSIZE);
    let points = fillCircle(x, y, FILLRADIUS);

    for (const [px, py] of points) {
      this.grid[py][px] = 1;
    }
    this.drawGrid();
  }
}
