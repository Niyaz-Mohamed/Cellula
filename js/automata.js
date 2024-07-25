import { canvas, ctx } from "./canvas.js";
import { cellSize, fillRadius, paused, stroke } from "./controls/controls.js";
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
    // Cell state that pen draws
    this.penState = 1;
  }

  drawGrid() {
    // Canvas settings defined in canvas.js
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Update cell colors
    let drawRect;
    if (stroke) {
      drawRect = (x, y, width, height) => {
        let strokeWidth = 1;
        ctx.fillRect(
          x + strokeWidth,
          y + strokeWidth,
          width - 2 * strokeWidth,
          height - 2 * strokeWidth
        );
      };
    } else {
      drawRect = (x, y, width, height) => {
        ctx.fillRect(x, y, width, height);
      };
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        ctx.fillStyle = this.stateColor(this.grid[row][col]);
        ctx.strokeStyle = "black";
        drawRect(col * cellSize, row * cellSize, cellSize, cellSize);
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
    if (!paused) {
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

  // Calculate color required by a specific state (in hex, rgb, or word)
  stateColor(state) {
    return state ? "white" : "black";
  }

  // Handles updates of the grid when mouse is pressed
  draw() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length)
        this.grid[y][x] = this.penState;
    }
    this.drawGrid();
  }
}

export class LifeLikeAutomata extends Automata {
  constructor(ruleString, neighbourhood = null, lifeColor = "white") {
    super();
    this.parseRules(ruleString);
    if (neighbourhood) {
      this.neighbourhood = neighbourhood;
    }
    this.lifeColor = lifeColor;
  }

  // Parse Birth/Survival notation rule string (see https://conwaylife.com/wiki/Rulestring)
  parseRules(ruleString) {
    const nbSize = this.neighbourhood.length;
    const regexBS = new RegExp(`B([0-${nbSize}]*)/S([0-${nbSize}]*)`);
    const regexSB = new RegExp(`S([0-${nbSize}]*)/B([0-${nbSize}]*)`); // Technically not a valid rulestring, but might as well include

    if (regexBS.test(ruleString)) {
      const [birth, survive] = ruleString
        .split("/")
        .map((r) => r.substring(1).split("").map(Number));
      this.surviveRules = new Set(survive);
      this.birthRules = new Set(birth);
    } else if (regexBS.test(ruleString)) {
      const [survive, birth] = ruleString
        .split("/")
        .map((r) => r.substring(1).split("").map(Number));
      this.surviveRules = new Set(survive);
      this.birthRules = new Set(birth);
    } else {
      console.log("INVALID RULESTRING: " + ruleString);
      this.surviveRules = new Set();
      this.birthRules = new Set();
    }
  }

  // Override getNextState
  getNextState(position) {
    const [x, y] = position;
    let neighbourCount = 0;
    for (let [dx, dy] of this.neighbourhood) {
      if (y + dy >= this.rows) dy -= this.rows;
      else if (y + dy < 0) dy += this.rows;
      if (x + dx >= this.cols) dx -= this.cols;
      else if (x + dx < 0) dx += this.cols;
      neighbourCount += this.grid[y + dy][x + dx];
    }

    // Update cell state
    if (this.grid[y][x] === 0 && this.birthRules.has(neighbourCount)) {
      return 1; // Birth condition
    }
    if (this.grid[y][x] === 1 && this.surviveRules.has(neighbourCount)) {
      return 1; // Survival condition
    }
    return 0;
  }

  // Override stateColor
  stateColor(state) {
    return state ? this.lifeColor : "black";
  }
}
