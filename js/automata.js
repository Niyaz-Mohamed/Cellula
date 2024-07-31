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
  setConsoleText,
  midpointCircle,
  mooreNeighborhod,
  padArray,
} from "./utils.js";
import { mouseX, mouseY, outlinePoints } from "./userInput.js";

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
        ctx.fillStyle = this.getPenColor();
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    } else {
      for (const [col, row] of outlinePoints) {
        ctx.fillStyle = this.getPenColor();
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
    //// console.timeEnd("Draw");
  }

  // TODO: Override for custom automata with >2 states
  // Calculate color required by a specific state as rgb value
  stateColor(state) {
    return state ? [256, 256, 256] : backgroundColor;
  }

  // Calculates the next state for the grid
  updateGrid(ignorePaused = false) {
    if (!paused && !ignorePaused) {
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

  // TODO: Override for automata with >2 states
  // Randomizes the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols).fill(null).map(() => (Math.random() < 0.5 ? 1 : 0))
      );
    this.drawGrid();
  }

  // Handles updates of the grid for a single click of the mouse (Call multiple times for press & hold)
  draw() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length)
        this.grid[y][x] = this.penState;
    }
  }

  // TODO: Override for automata with >2 states
  // Cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = { 0: "Dead", 1: "Alive" };

    // Change pen state
    this.penState = (this.penState + 1) % 2;
    setConsoleText(
      `Updated pen to draw ${this.penState} [${stateNames[this.penState]}]`
    );
    this.drawGrid();
  }

  // TODO: Override for automata with >2 states
  // Calculate color of the fill circle depending on pen state, as rgba string
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.6)",
      1: "rgba(255, 0, 0, 0.6)",
    };
    return stateColors[this.penState];
  }
}

export class LifeLikeAutomata extends Automata {
  constructor(ruleString = "B2/S23", neighbourhood = mooreNeighborhod()) {
    super();
    this.setRules(ruleString);
    this.neighbourhood = neighbourhood;

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
        function (grid, neighbourhood, birthRules, surviveRules) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];
          let neighbors = 0;

          for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
            const dx = neighbourhood[i * 2];
            const dy = neighbourhood[i * 2 + 1];
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
            if (surviveRules[i] === neighbors) isSurvival = 1;
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
        setConsoleText("Valid Rulestring!");
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
      setConsoleText("Invalid Rulestring!");
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
    return this.gridUpdateKernel(
      this.grid,
      this.neighbourhood.flat(),
      padArray(this.birthRules, maxRules, -1),
      padArray(this.surviveRules, maxRules, -1)
    );
  }
}

export class BriansBrain extends Automata {
  constructor(ruleString = "/2", neighbourhood = mooreNeighborhod()) {
    super();
    this.setRule(ruleString);
    this.neighbourhood = neighbourhood;

    // Log stats
    console.log(
      `Initialized Brian's Brain with neighbourhood size ${
        this.neighbourhood.length
      }\nBirth Rules: ${JSON.stringify(this.birthRules)}`
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
        function (grid, neighbourhood, birthRules) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Cell transitions
          if (current == 0) {
            let liveNeighbors = 0;

            // Count live neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 1) {
                liveNeighbors++;
              }
            }

            // Update cell value
            for (let i = 0; i < this.constants.ruleSize; i++) {
              if (birthRules[i] === liveNeighbors) return 1;
            }
            return 0;
          } else if (current == 1) {
            return 2;
          } else return 0;
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighbourhoodSize: this.neighbourhood.length,
        ruleSize: this.birthRules.length,
      });
  }

  // Parse the rule required for Brian's Brain to come alive
  setRule(ruleString) {
    const regex = /^\/\d+(\/\d+)*$/;

    // Extract required rules
    if (ruleString.match(regex)) {
      // Update console
      if (getConsoleText() == "Invalid Rulestring!") {
        setConsoleText("Valid Rulestring!");
      }

      // Parse rulestring
      let ruleList = ruleString.split("/").slice(1).map(Number);
      this.birthRules = [...new Set(ruleList)];
    } else {
      setConsoleText("Invalid Rulestring!");
    }
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: backgroundColor,
      1: [256, 256, 256],
      2: [0, 0, 256],
    };
    return stateSpace[state];
  }

  // Override calculating the next grid state
  getNextState() {
    return this.gridUpdateKernel(
      this.grid,
      this.neighbourhood.flat(),
      this.birthRules
    );
  }

  // Override randomizing the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols)
          .fill(null)
          .map(() => (Math.random() < 0.2 ? (Math.random() < 0.5 ? 1 : 2) : 0))
      );
    this.drawGrid();
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = { 0: "Ready", 1: "Firing", 2: "Refactory" };
    // Change pen state
    this.penState = (this.penState + 1) % 3;
    setConsoleText(
      `Updated pen to draw ${this.penState} [${stateNames[this.penState]}]`
    );
    this.drawGrid();
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.6)",
      1: "rgba(255, 0, 0, 0.6)",
      2: "rgba(0, 0, 255, 0.6)",
    };
    return stateColors[this.penState];
  }
}
