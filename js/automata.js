import { canvas, ctx } from "./canvas.js";
import { cellSize, fillRadius, paused, stroke } from "./controls/controls.js";
import {
  fillCircle,
  midpointCircle,
  mooreNeighborhod,
  vonNeumannNeighborhood,
} from "./utils.js";
import { mouseX, mouseY, outlinePoints } from "./controls/mouse.js";

export class Automata {
  // Create an automata for a grid of dim [rows, cols]
  constructor() {
    this.rows = Math.floor(canvas.height / cellSize);
    this.cols = Math.floor(canvas.width / cellSize);
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols).fill(null).map(() => (Math.random() < 0 ? 1 : 0))
      );
    this.prevGrid = this.grid.map((row) => row.slice());
    this.neighbourhood = mooreNeighborhod();
    this.penState = 1;
  }

  drawGrid() {
    // Canvas settings defined in canvas.js
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Update cell colors
    const drawRect = (x, y, width, height) => {
      if (stroke) {
        let strokeWidth = cellSize / 10;
        ctx.fillRect(
          x + strokeWidth,
          y + strokeWidth,
          width - 2 * strokeWidth,
          height - 2 * strokeWidth
        );
      } else {
        ctx.fillRect(x, y, width, height);
      }
    };

    // Render the grid
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
      // Run the GPU kernel to get the new grid state
      const newGrid = new Array(this.rows)
        .fill(null)
        .map(() => new Array(this.cols).fill(0));
      // Update prevGrid
      this.prevGrid = this.grid.map((row) => row.slice());
      this.grid = newGrid;
      // Draw the grid
      this.drawGrid();
    }
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
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length) {
        this.grid[y][x] = this.penState;
      }
    }
    this.drawGrid();
  }
}

export class LifeLikeAutomata extends Automata {
  // Lifelike automata with more Moore neighborhood n=1 can be defined by B/S format rulestrings (See https://conwaylife.com/wiki/List_of_Life-like_rules for more)
  // This class has been extended to accept neighborhoods with more than 10 cells. Rulestrings for such neighborhoods are formatted differently
  // B12(10)\S3(12) would result in cell birth if 1,2 or 10 neighbors, and survival if 3 or 12 neighbors

  constructor(
    ruleString = "B/S",
    neighbourhood = mooreNeighborhod(),
    lifeColor = "white"
  ) {
    super();
    this.parseRules(ruleString); // Defines this.birthRules and surviveRules
    this.neighbourhood = neighbourhood;
    this.lifeColor = lifeColor;

    // Log stats
    console.log(
      `Initialized life-like automata with neighbourhood size ${
        this.neighbourhood.length
      }\nBirth Rules: ${JSON.stringify(
        this.birthRules
      )}\nSurvive Rules: ${JSON.stringify(this.surviveRules)}`
    );

    //! Logic for determining next state here
    this.gpu = new GPU();
    this.getNextStateKernel = this.gpu
      .createKernel(function (grid, neighbourhood, birthRules, surviveRules) {
        const x = this.thread.x;
        const y = this.thread.y;
        // Unpack constants
        const neighbourhoodSize = this.constants.neighbourhoodSize;
        const rows = this.constants.dim[0];
        const cols = this.constants.dim[1];

        let neighbourCount = 0;
        for (let i = 0; i < neighbourhoodSize; i += 1) {
          const dx = neighbourhood[i];
          const dy = neighbourhood[i];
          // if (y + dy >= rows) dy -= rows;
          // else if (y + dy < 0) dy += rows;
          // if (x + dx >= cols) dx -= cols;
          // else if (x + dx < 0) dx += cols;
          // neighbourCount += grid[y + dy][x + dx];
        }

        // // Check birth and survival rules
        // const isBirth = birthRules[neighbourCount] || 0;
        // const isSurvive = surviveRules[neighbourCount] || 0;
        // if (grid[y][x] === 0 && isBirth) {
        //   return 1; // Birth condition
        // }
        // if (grid[y][x] === 1 && isSurvive) {
        //   return 1; // Survival condition
        // }

        return 0;
      })
      .setConstants({
        neighbourhoodSize: this.neighbourhood.length,
        dim: [this.grid.length, this.grid[0].length],
      })
      .setOutput([this.rows, this.cols]);
  }

  // Parse Birth/Survival notation rule string, extended for a neighborhood of size n
  parseRules(ruleString) {
    const regex = /^B((\d*(\(\d+\))?)\/S)((\d*(\(\d+\))?)+)$/;

    // Extract required rules
    if (ruleString.match(regex)) {
      let ruleList = ruleString.slice(1).split("/S");
      function parseSequence(seq) {
        const pattern = /(\d+|\(\d+\))/g;
        seq = seq.match(pattern) || [];
        let rules = [];

        // Iterate through each parenthesis/number and extract the rule
        seq.forEach((e) => {
          // Parse parenthesis number as base 10
          if (e.startsWith("(") && e.endsWith(")")) {
            rules.push(parseInt(e.slice(1, -1), 10));
          }
          // Parse singular number as base 10
          else {
            e = e.split("").map((e) => parseInt(e, 10));
            rules = rules.concat(e);
          }
        });
        return rules;
      }
      // Parse sequences to obtain rules
      this.birthRules = [...new Set(parseSequence(ruleList[0]))];
      this.surviveRules = [...new Set(parseSequence(ruleList[1]))];
    } else {
      console.log("INVALID RULESTRING: " + ruleString);
      this.surviveRules = new Set();
      this.birthRules = new Set();
    }
  }

  // Calculates the next state for the grid
  updateGrid() {
    if (!paused) {
      // Run the GPU kernel to get the new grid state
      const newGrid = this.getNextStateKernel(
        this.grid,
        this.neighbourhood,
        this.birthRules,
        this.surviveRules
      );
      // Update prevGrid
      this.prevGrid = this.grid.map((row) => row.slice());
      this.grid = newGrid;
      // Draw the grid
      this.drawGrid();
    }
  }

  // Override stateColor
  stateColor(state) {
    return state ? this.lifeColor : "black";
  }
}
