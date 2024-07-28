import { ctx } from "./canvas.js";
import {
  backgroundColor,
  cellSize,
  fillRadius,
  paused,
  waitTime,
} from "./controls.js";
import {
  fillCircle,
  getConsoleText,
  midpointCircle,
  mooreNeighborhod,
  padArray,
  updateConsole,
} from "./utils.js";
import { mouseX, mouseY, outlinePoints } from "./mouse.js";

export class Automata {
  // Create an automata for a grid of dim [rows, cols]
  constructor() {
    const rows = Math.floor(ctx.canvas.height / cellSize);
    const cols = Math.floor(ctx.canvas.width / cellSize);
    this.grid = new Array(rows).fill(null).map(() => new Array(cols).fill(0));
    this.rows = rows;
    this.cols = cols;
    // Moore neighbourhood by default
    this.neighbourhood = mooreNeighborhod();
    // Cell state that pen draws
    this.penState = 1;
    // Prepare for FPS throttling
    this.lastUpdateTime = Date.now();
  }

  // Draw a grid on the canvas
  drawGrid() {
    //// console.time("Draw");
    // Create an ImageData object to batch update the canvas
    const imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    // Calculate cell colors and draw
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * cellSize;
        const y = row * cellSize;
        const color = this.stateColor(this.grid[row][col]);
        const index = (y * ctx.canvas.width + x) * 4;
        // Fill the cell color
        for (let dy = 0; dy < cellSize; dy++) {
          for (let dx = 0; dx < cellSize; dx++) {
            const cellIndex = index + (dy * ctx.canvas.width + dx) * 4;
            data[cellIndex] = color[0]; // Red
            data[cellIndex + 1] = color[1]; // Green
            data[cellIndex + 2] = color[2]; // Blue
            data[cellIndex + 3] = 255; // Alpha (Opaque)
          }
        }
      }
    }
    // Apply the imageData to the canvas
    ctx.putImageData(imageData, 0, 0);

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
    //// console.timeEnd("Draw");
  }

  // Calculate color required by a specific state as rgb value
  stateColor(state) {
    return state ? [256, 256, 256] : backgroundColor;
  }

  // Calculates the next state for the grid
  updateGrid() {
    if (!paused) {
      //// console.time("Update");
      let newGrid = this.getNextState();
      //// console.timeEnd("Update");
      // Update grid state and draw, only if enough time has passed
      const currentTime = Date.now();
      if (currentTime - this.lastUpdateTime >= waitTime) {
        this.lastUpdateTime = currentTime;
        this.grid = newGrid;
        this.drawGrid();
      }
      // Automatically loop animation
      window.requestAnimationFrame(() => this.updateGrid());
    } else {
      // Handles mouse drawings
      window.requestAnimationFrame(() => this.drawGrid());
    }
  }

  // TODO: Override for custom automata
  // Calculates the next grid state
  getNextState() {
    return this.grid;
  }

  // Randomizes the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols).fill(null).map(() => (Math.random() < 0.5 ? 1 : 0))
      );
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
  }
}

export class LifeLikeAutomata extends Automata {
  // Common lifelike automata with Moore neighbourhood n=1 can be represented by rulestrings (See https://conwaylife.com/wiki/List_of_Life-like_rules)
  // This class extends to neighbourhoods with more than 10 neighbours. Rulestrings have been adapted accordingly
  // Rulestring B1(10)/S3(11)(12) means birth when 1 or 10 neighbours, and survival if 3, 11 or 12 neighbours

  constructor(
    ruleString = "B/S",
    neighbourhood = mooreNeighborhod(),
    lifeColor = "white"
  ) {
    super();
    this.setRules(ruleString);
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

    // Create GPU, account for issues in chrome
    function initGPU() {
      try {
        return new window.GPU.GPU();
      } catch (e) {
        return new GPU({ mode: "dev" });
      }
    }
    const gpu = initGPU();
    // Implement GPU kernel to update grid
    this.gridUpdateKernel = gpu
      .createKernel(
        function (grid, neighbourhood, birthRules, survivalRules) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];
          let neighbors = 0;

          for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
            const dx = neighbourhood[i * 2];
            const dy = neighbourhood[i * 2 + 1];
            let n = (y + dy + this.constants.rows) % this.constants.rows;
            neighbors +=
              grid[(y + dy + this.constants.rows) % this.constants.rows][
                (x + dx + this.constants.cols) % this.constants.cols
              ];
          }

          let isBirth = 0;
          for (let i = 0; i < this.constants.rulesSize; i++) {
            if (birthRules[i] === neighbors) isBirth = 1;
          }

          let isSurvival = 0;
          for (let i = 0; i < this.constants.rulesSize; i++) {
            if (survivalRules[i] === neighbors) isSurvival = 1;
          }

          if (current === 0 && isBirth === 1) return 1;
          if (current === 1 && isSurvival === 1) return 1;
          return 0;
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighbourhoodSize: this.neighbourhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      });
  }

  // Parse Birth/Survival notation rule string, extended for a neighbourhood of size n
  setRules(ruleString) {
    const regex = /^B((\d*(\(\d+\))?)\/S)((\d*(\(\d+\))?)+)$/;
    ruleString = ruleString.replaceAll(" ", "");
    // Update rulestring selector
    document.getElementById("rule-input").value = ruleString;

    // Extract required rules
    if (ruleString.match(regex)) {
      // Update console
      if (getConsoleText() == "Invalid Rulestring!") {
        updateConsole("Valid Rulestring!");
      }

      // Parse rulestring
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
      updateConsole("Invalid Rulestring!");
    }

    // Update constants
    if (this.gridUpdateKernel) {
      this.gridUpdateKernel.setConstants({
        rows: this.rows,
        cols: this.cols,
        neighbourhoodSize: this.neighbourhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      });
    }
  }

  // Rules for life-like
  getNextState() {
    const maxRules = Math.max(this.birthRules.length, this.surviveRules.length);
    const newGrid = this.gridUpdateKernel(
      this.grid,
      this.neighbourhood.flat(),
      padArray(this.birthRules, maxRules, -1),
      padArray(this.surviveRules, maxRules, -1)
    );
    return newGrid;
  }
}
