import {
  backgroundColor,
  cellSize,
  changePaused,
  fillRadius,
  paused,
  setFillRadius,
} from "./inputs/config.js";
import {
  fillCircle,
  getConsoleText,
  setConsoleText,
  midpointCircle,
  mooreNeighborhood,
  padArray,
  downloadObjectAsJSON,
  unique2DArr,
  reshape2DArray,
  gaussianRandom,
} from "./utils.js";
import {
  mouseX,
  mouseY,
  outlinePoints,
  registerCanvasCallbacks,
} from "./inputs/userInput.js";

//! Intialize Canvas
const canvas = document.getElementById("cellGrid");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
export const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

//! Initialize Overlay Canvas
const overlayCanvas = document.getElementById("overlayCanvas");
overlayCanvas.width = window.innerWidth;
overlayCanvas.height = window.innerHeight;
const overlayCtx = overlayCanvas.getContext("2d");
registerCanvasCallbacks(overlayCtx);

//! Handle Canvas Resizing
// Function to resize the canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
  // Update automata
  let newRows = Math.floor(window.innerHeight / cellSize);
  let newCols = Math.floor(window.innerWidth / cellSize);
  automata.grid = reshape2DArray(
    automata.grid,
    newRows,
    newCols,
    automata.baseState ? automata.baseState : 0
  );
  automata.rows = newRows;
  automata.cols = newCols;
  automata.drawGrid();
}
window.addEventListener("resize", resizeCanvas);

//! General Automata Class
export class Automata {
  // Create an automata for a grid of dim [rows, cols]
  constructor() {
    const rows = Math.floor(ctx.canvas.height / cellSize);
    const cols = Math.floor(ctx.canvas.width / cellSize);
    this.grid = new Array(rows).fill(null).map((_) => new Array(cols).fill(0));
    this.rows = rows;
    this.cols = cols;
    // Moore neighborhood by default
    this.neighborhood = mooreNeighborhood();
    // Cell state that pen draws
    this.penState = 1;
    // Create GPU, account for issues in chrome
    function initGPU() {
      try {
        return new window.GPU.GPU({ mode: "dev" });
      } catch (e) {
        return new GPU({ mode: "dev" });
      }
    }
    this.gpu = initGPU();
  }

  // Draw a grid on the canvas
  drawGrid() {
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
    this.gridImageData = imageData;
    ctx.putImageData(this.gridImageData, 0, 0);
  }

  // Draw the cursor only when requried
  drawCursor() {
    // Draw the cursor/pen outline
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    overlayCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (outlinePoints[0] != [x + fillRadius + 1, y]) {
      // Draw outline of pen
      for (const [col, row] of midpointCircle(x, y, fillRadius + 1)) {
        overlayCtx.fillStyle = this.getPenColor();
        overlayCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    } else {
      for (const [col, row] of outlinePoints) {
        overlayCtx.fillStyle = this.getPenColor();
        overlayCtx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }

  // TODO: Override for custom automata with >2 states
  // Calculate color required by a specific state as rgb value
  stateColor(state) {
    return state ? [255, 255, 255] : backgroundColor;
  }

  // Calculates the next state for the grid
  updateGrid(ignorePaused = false, drawGrid = true) {
    if (!drawGrid) {
      this.grid = this.getNextState();
    } else if (!paused && !ignorePaused) {
      //// console.time("Update");
      let newGrid = this.getNextState();
      this.grid = newGrid;
      window.requestAnimationFrame(() => this.drawGrid());
      //// console.timeEnd("Update");
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
        new Array(this.cols).fill(null).map(() => Math.floor(Math.random() * 2))
      );
    window.requestAnimationFrame(() => this.drawGrid());
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

    if (paused) window.requestAnimationFrame(() => this.drawGrid());
  }

  // TODO: Override for automata with >2 states
  // Cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = { 0: "Dead", 1: "Alive" };

    // Change pen state
    this.penState = (this.penState + 1) % 2;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    window.requestAnimationFrame(() => this.drawCursor());
  }

  // TODO: Override for automata with >2 states
  // Calculate color of the fill circle depending on pen state, as rgba string
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.8)",
      1: "rgba(255, 0, 0, 0.8)",
    };
    return stateColors[this.penState];
  }

  //TODO: Override for automata that accept arguments
  // Create a JSON containing the data and download
  saveData() {
    const automataData = { name: "Automata", args: [], grid: this.grid };
    downloadObjectAsJSON(automataData, "automata.json");
  }
}

//! Discrete Automata
export class LifeLikeAutomata extends Automata {
  constructor(ruleString = "B3/S23", neighborhood = mooreNeighborhood()) {
    super();
    this.ruleString = ruleString;
    this.setRules(ruleString);
    this.neighborhood = neighborhood;

    // Implement GPU kernel to update grid
    this.gridUpdateKernel = this.gpu
      .createKernel(
        function (grid, neighborhood, birthRules, surviveRules) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];
          let neighbors = 0;

          for (let i = 0; i < this.constants.neighborhoodSize; i++) {
            const dx = neighborhood[i][0];
            const dy = neighborhood[i][1];
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
        neighborhoodSize: this.neighborhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      });
  }

  // Parse Birth/Survival notation rule string, extended for a neighborhood of size n
  setRules(ruleString) {
    const regex = /^B((\d*(\(\d+\))?)\/S)((\d*(\(\d+\))?)+)$/;
    ruleString = ruleString.replaceAll(" ", "");
    // Update rulestring selector
    document.getElementById("life-rule-input").value = ruleString;

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
        neighborhoodSize: this.neighborhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      });
    }
  }

  // Override getting next state
  getNextState() {
    // Reset constants
    this.gridUpdateKernel
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighborhoodSize: this.neighborhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      })
      .setOutput([this.cols, this.rows]);

    // Call the kernel
    const maxRules = Math.max(this.birthRules.length, this.surviveRules.length);
    return this.gridUpdateKernel(
      this.grid,
      this.neighborhood,
      padArray(this.birthRules, maxRules, -1),
      padArray(this.surviveRules, maxRules, -1)
    );
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Life",
      args: [this.ruleString, this.neighborhood],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "life.json");
  }
}

export class LangtonsAnt extends Automata {
  constructor(initialAnts = null) {
    super();
    this.penState = 2;
    if (!initialAnts)
      this.ants = [[Math.floor(this.cols / 2), Math.floor(this.rows / 2), 0]];
    else {
      this.ants = initialAnts;
    } // Ant directions are 0,1,2,3 (N,E,S,W)
  }

  // Override drawing of grid
  drawGrid() {
    super.drawGrid();

    // Draw the ants
    for (const [col, row] of this.ants) {
      ctx.fillStyle = this.getPenColor(2);
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: backgroundColor,
      1: [255, 255, 255],
    };
    return stateSpace[state];
  }

  // Override calculating the next grid state
  getNextState() {
    let newAnts = this.ants.map((ant) => ant.slice());
    let newGrid = this.grid.map((row) => row.slice());

    for (let i = 0; i < this.ants.length; i++) {
      let ant = this.ants[i];
      let gridState = newGrid[ant[1]][ant[0]];
      newGrid[ant[1]][ant[0]] = (gridState + 1) % 2; // Update the grid

      // Update Ant Directions (Based on old grid!)
      if (gridState == 0) {
        newAnts[i][2] = (ant[2] + 3) % 4; // Turn left if black
      } else {
        newAnts[i][2] = (ant[2] + 1) % 4; // Turn right if white
      }

      // Update ant positions
      switch (newAnts[i][2]) {
        case 0:
          newAnts[i][1] = (newAnts[i][1] - 1 + this.rows) % this.rows; // North
          break;
        case 1:
          newAnts[i][0] = (newAnts[i][0] + 1) % this.cols; // East
          break;
        case 2:
          newAnts[i][1] = (newAnts[i][1] + 1) % this.cols; // South
          break;
        case 3:
          newAnts[i][0] = (newAnts[i][0] - 1 + this.cols) % this.cols; // West
          break;
      }
    }

    // Reassign ants
    this.ants = newAnts;
    return newGrid;
  }

  // Override randomizing the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols).fill(null).map(() => (Math.random() < 0.1 ? 1 : 0))
      );
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override drawing the grid
  draw() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      // Check for valid points
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length) {
        if (this.penState == 0 || this.penState == 1) {
          this.grid[y][x] = this.penState;
        } else if (this.penState == 2) {
          this.ants.push(new Float32Array([x, y, 0]));
        }
      }
    }

    // Also erase ants if pen is an eraser
    if (this.penState == 0) {
      this.ants = this.ants.filter(
        (ant) =>
          !points.some((point) => point[0] === ant[0] && point[1] === ant[1])
      );
    }
    // Ensure ants are unique (different coord and direction) and update kernel
    this.ants = unique2DArr(this.ants);
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = {
      0: "Empty",
      1: "Filled",
      2: "Ant",
    };
    // Change pen state
    this.penState = (this.penState + 1) % 3;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    window.requestAnimationFrame(() => this.drawCursor());
  }

  // Override get pen color
  getPenColor(state = null) {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.8)",
      1: "rgba(255, 0, 0, 0.8)",
      2: "rgba(0, 255, 0, 0.8)",
    };
    return state ? stateColors[state] : stateColors[this.penState];
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Langton's Ant",
      args: [this.ants.map((arr) => Array.from(arr))],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "langton_ants.json");
  }
}

export class ElementaryCA extends Automata {
  constructor(ruleNumber = 90) {
    super();
    // Fill with 2 initially
    this.baseState = 2;
    this.grid = new Array(this.rows)
      .fill(null)
      .map((_) => new Array(this.cols).fill(this.baseState));
    // Parse Rule
    this.ruleNumber = ruleNumber < 0 ? 0 : ruleNumber > 255 ? 255 : ruleNumber;
    this.ruleMap = this.parseEcaRule(ruleNumber);
  }

  // Parse rule number into a rule map
  parseEcaRule(ruleNumber) {
    // Convert to 8 bit binary string
    const binaryString = ruleNumber.toString(2).padStart(8, "0");
    const neighborhoods = [
      "111",
      "110",
      "101",
      "100",
      "011",
      "010",
      "001",
      "000",
    ];

    // Map neighborhood to outputs
    let ruleMap = {};
    for (let i = 0; i < neighborhoods.length; i++) {
      ruleMap[neighborhoods[i]] = parseInt(binaryString[i], 10);
    }
    return ruleMap;
  }

  // Override calculating the next grid state
  getNextState() {
    let newGrid = this.grid.map((row) => row.slice());

    // Iterate through the grid
    for (let y = 0; y < this.rows; y++) {
      let rowAbove = (y - 1 + this.rows) % this.rows;
      for (let x = 0; x < this.cols; x++) {
        const pattern = [
          this.grid[rowAbove][(x - 1 + this.cols) % this.cols],
          this.grid[rowAbove][x],
          this.grid[rowAbove][(x + 1) % this.cols],
        ];

        if (pattern.every((value) => value === this.baseState)) {
          null; // Non-Update Case
        } else {
          const stringPattern = pattern
            .map((n) => (n === this.baseState ? 0 : n))
            .join("");
          newGrid[y][x] = this.ruleMap[stringPattern];
        }
      }
    }
    return newGrid;
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    let stateSpace = {
      0: backgroundColor,
      1: [255, 255, 255],
    };
    stateSpace[this.baseState] = backgroundColor;
    return stateSpace[state];
  }

  // Override randomizing the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols)
          .fill(null)
          .map(() => (Math.random() < 5e-5 ? 1 : this.baseState))
      );
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = { 0: "Black", 1: "White" };
    // Change pen state
    this.penState = (this.penState + 1) % 2;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    if (this.penState === 0) this.penState = 2;
    window.requestAnimationFrame(() => this.drawCursor());
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      2: "rgba(255, 255, 255, 0.8)",
      1: "rgba(255, 0, 0, 0.8)",
    };
    return stateColors[this.penState];
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Elementary",
      args: [this.ruleNumber],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "elementaryCA.json");
  }
}

export class BriansBrain extends Automata {
  constructor(ruleString = "2", neighborhood = mooreNeighborhood()) {
    super();
    this.ruleString = ruleString;
    this.setRules(ruleString);
    this.neighborhood = neighborhood;

    // Implement GPU kernel to update grid
    this.gridUpdateKernel = this.gpu
      .createKernel(
        function (grid, neighborhood, birthRules) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Cell transitions
          if (current == 0) {
            let liveNeighbors = 0;

            // Count live neighbors
            for (let i = 0; i < this.constants.neighborhoodSize; i++) {
              const dx = neighborhood[i][0];
              const dy = neighborhood[i][1];
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
        neighborhoodSize: this.neighborhood.length,
        ruleSize: this.birthRules.length,
      });
  }

  // Parse the rule required for Brian's Brain to come alive
  setRules(ruleString) {
    const regex = /\d+(\/\d+)*$/;

    // Extract required rules
    if (ruleString.match(regex)) {
      // Update console
      if (getConsoleText() == "Invalid Rulestring!") {
        setConsoleText("Valid Rulestring!");
      }
      // Update rulestring selector
      document.getElementById("brain-rule-input").value = ruleString;
      // Parse rulestring
      let ruleList = ruleString.split("/").map(Number);
      this.birthRules = [...new Set(ruleList)];
    } else if (ruleString == "") {
      this.birthRules = [0];
    } else {
      setConsoleText("Invalid Rulestring!");
    }
  }

  // Override calculating the next grid state
  getNextState() {
    // Reset constants
    this.gridUpdateKernel
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighborhoodSize: this.neighborhood.length,
        ruleSize: this.birthRules.length,
      })
      .setOutput([this.cols, this.rows]);
    // Call kernel
    return this.gridUpdateKernel(this.grid, this.neighborhood, this.birthRules);
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: backgroundColor,
      1: [255, 255, 255],
      2: [0, 0, 255],
    };
    return stateSpace[state];
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
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = { 0: "Ready", 1: "Firing", 2: "Refactory" };
    // Change pen state
    this.penState = (this.penState + 1) % 3;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    window.requestAnimationFrame(() => this.drawCursor());
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.8)",
      1: "rgba(255, 0, 0, 0.8)",
      2: "rgba(0, 0, 255, 0.8)",
    };
    return stateColors[this.penState];
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Brian's Brain",
      args: [this.ruleString, this.neighborhood],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "brianbrain.json");
  }
}

export class WireWorld extends Automata {
  constructor() {
    super();
    this.neighborhood = mooreNeighborhood();

    // Implement GPU kernel to update grid
    this.gridUpdateKernel = this.gpu
      .createKernel(
        function (grid, neighborhood) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Cell transitions
          if (current == 0) {
            return 0; // Empty case
          } else if (current == 2) {
            return 3; // Head electron case
          } else if (current == 3) {
            return 1; // Tail electron case
          } else {
            // Count electron head neighbors
            let headNeighbors = 0;
            for (let i = 0; i < this.constants.neighborhoodSize; i++) {
              const dx = neighborhood[i][0];
              const dy = neighborhood[i][1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 2) {
                headNeighbors++;
              }
            }

            // Update cell value
            if (headNeighbors === 1 || headNeighbors === 2) {
              return 2;
            } else return 1;
          }
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighborhoodSize: this.neighborhood.length,
      });
  }

  // Override calculating the next grid state
  getNextState() {
    return this.gridUpdateKernel(this.grid, this.neighborhood);
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: backgroundColor,
      1: [255, 255, 0],
      2: [0, 0, 255],
      3: [255, 0, 0],
    };
    return stateSpace[state];
  }

  // Override randomizing the grid
  randomize() {
    // Construct a wirelike pattern using life-like rule B1/S12345678
    let randEngine = new LifeLikeAutomata("B1/S123456");
    randEngine.grid = new Array(this.rows).fill(null).map(
      () =>
        new Array(this.cols)
          .fill(null)
          .map(() => (Math.random() < 0.001 ? 1 : 0)) // Change probability of 1 to get sparser/denser patterns
    );
    for (let i = 0; i <= 20; i++) {
      randEngine.updateGrid(false, false);
    }

    this.grid = randEngine.grid;
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override drawing the grid
  draw() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length) {
        // Fill only conductors when penstate is electrons
        if (this.penState == 2 || this.penState == 3) {
          if (this.grid[y][x] != 0) this.grid[y][x] = this.penState;
        } else this.grid[y][x] = this.penState;
      }
    }
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = {
      0: "Empty",
      1: "Conductor",
      2: "Electron Head",
      3: "Electron Tail",
    };
    // Change pen state
    this.penState = (this.penState + 1) % 4;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    window.requestAnimationFrame(() => this.drawCursor());
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.8)",
      1: "rgba(255, 255, 0, 0.8)",
      2: "rgba(0, 0, 255, 0.8)",
      3: "rgba(255, 0, 0, 0.8)",
    };
    return stateColors[this.penState];
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Wireworld",
      args: [],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "wireworld.json");
  }
}

export class RPSGame extends Automata {
  constructor(
    winCondition = 3,
    stateCount = 3,
    neighborhood = mooreNeighborhood()
  ) {
    super();
    this.neighborhood = neighborhood;
    // Minimum number of cells that beat current cells in the neighborhood for conversion to occur
    this.winCondition = winCondition;
    // Number of states played with, ranges between 3 and 5
    this.stateCount = [3, 4, 5].includes(stateCount) ? 3 : stateCount;

    // Implement GPU kernel to update grid
    this.gridUpdateKernel = this.gpu
      .createKernel(
        function (grid, neighborhood, winCondition, stateCount) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Count up all neighbors just once
          let rockNeighbors = 0;
          let paperNeighbors = 0;
          let scissorNeighbors = 0;
          let lizardNeighbors = 0;
          let spockNeighbors = 0;

          // Iterate through neighborhood and count
          for (let i = 0; i < this.constants.neighborhoodSize; i++) {
            const dx = neighborhood[i][0];
            const dy = neighborhood[i][1];
            const neighborValue =
              grid[(y + dy + this.constants.rows) % this.constants.rows][
                (x + dx + this.constants.cols) % this.constants.cols
              ];
            if (neighborValue == 0) {
              rockNeighbors += 1;
            } else if (neighborValue == 1) {
              paperNeighbors += 1;
            } else if (neighborValue == 2) {
              scissorNeighbors += 1;
            } else if (neighborValue == 3) {
              lizardNeighbors += 1;
            } else if (neighborValue == 4) {
              spockNeighbors += 1;
            }
          }

          // Cell transitions
          if (current == 0) {
            // Rock (0) beaten by Paper (1) or Spock (4)
            if (paperNeighbors >= winCondition) {
              return 1;
            } else if (spockNeighbors >= winCondition) {
              return 4;
            } else return current;
          } else if (current == 1) {
            // Paper (1) beaten by Scissors (2) and Lizard (3)
            if (scissorNeighbors >= winCondition) {
              return 2;
            } else if (lizardNeighbors >= winCondition) {
              return 3;
            } else return current;
          } else if (current == 2) {
            // Scissors (2) beaten by Rock (0) and Spock (4)
            //! SPECIAL CASE: Scissors beaten by Lizard (3) if stateCount is 4 (unbalanced rules)
            if (stateCount == 4) {
              if (rockNeighbors >= winCondition) {
                return 0;
              } else if (lizardNeighbors >= winCondition) {
                return 3;
              } else return current;
            } else if (rockNeighbors >= winCondition) {
              return 0;
            } else if (spockNeighbors >= winCondition) {
              return 4;
            } else return current;
          } else if (current == 3) {
            // Lizard beaten by Rock (0) and Scissors (2)
            //! SPECIAL CASE: Lizard not defeated by Scissors when stateCount = 4
            if (stateCount == 4) {
              if (rockNeighbors >= winCondition) {
                return 0;
              } else return current;
            } else if (rockNeighbors >= winCondition) {
              return 0;
            } else if (scissorNeighbors >= winCondition) {
              return 2;
            } else return current;
          } else if (current == 4) {
            // Spock beaten by Paper (1) and Lizard (4)
            if (paperNeighbors >= winCondition) {
              return 1;
            } else if (lizardNeighbors >= winCondition) {
              return 3;
            } else return current;
          }
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighborhoodSize: this.neighborhood.length,
      });
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: [127, 0, 0], // Rock
      1: [0, 127, 0], // Paper
      2: [0, 0, 127], // Scissors
      3: [0, 255, 127], // Lizard
      4: [0, 127, 255], // Spock
    };
    return stateSpace[state];
  }

  // Override calculating the next grid state
  getNextState() {
    this.gridUpdateKernel
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighborhoodSize: this.neighborhood.length,
      })
      .setOutput([this.cols, this.rows]);
    return this.gridUpdateKernel(
      this.grid,
      this.neighborhood,
      this.winCondition,
      this.stateCount
    );
  }

  // Override randomizing the grid
  randomize() {
    this.grid = new Array(this.rows).fill(null).map(
      () =>
        new Array(this.cols)
          .fill(null)
          .map(() => Math.floor(Math.random() * this.stateCount)) // Randomize from 0 to (stateCount-1)
    );
    window.requestAnimationFrame(() => this.drawGrid());
  }

  // Override cycle between draw state
  cycleDraw() {
    // Define state names
    let stateNames = {
      0: "Rock",
      1: "Paper",
      2: "Scissors",
      3: "Lizard",
      4: "Spock",
    };
    // Change pen state
    this.penState = (this.penState + 1) % this.stateCount;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    this.requestAnimationFrame(() => this.drawCursor());
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 0, 0, 0.8)", // Rock
      1: "rgba(0, 255, 0, 0.8)", // Paper
      2: "rgba(0, 0, 255, 0.8)", // Scissors
      3: "rgba(0, 255, 127, 0.8)", // Lizard
      4: "rgba(0, 127, 255, 0.8)", // Spock
    };
    return stateColors[this.penState];
  }

  // Override downloading the data
  saveData() {
    const automataData = {
      name: "Rock, Paper, Scissors",
      args: [this.winCondition, this.stateCount, this.neighborhood],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "rock-paper-scissor.json");
  }
}

//! Continuous Automata
export class NeuralCA extends Automata {
  // Source for this automata: https://www.youtube.com/watch?v=3H79ZcBuw4M&t=12s
  constructor(weights = []) {
    super();
    this.neighborhood = mooreNeighborhood().push([0, 0]);
    this.weights =
      weights.length == 9
        ? weights
        : new Array(3)
            .fill(null)
            .map((_) => new Array(3).map((_) => Math.random()));

    // TODO: Remove this once testing is done
    this.weights = [
      [0.68, -0.9, 0.68],
      [-0.9, -0.66, -0.9],
      [0.68, -0.9, 0.68],
    ];

    // Implement GPU kernel to update grid
    this.gridUpdateKernel = this.gpu
      .createKernel(
        function (grid, weights, activation) {
          const x = this.thread.x;
          const y = this.thread.y;
          let convResult = 0;

          // Perform convolution
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              let neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              convResult += neighborValue * weights[dy + 1][dx + 1];
            }
          }

          // Apply activation
          convResult = activation(convResult);
          // Clamp results
          if (convResult > 1) convResult = 1;
          else if (convResult < 0) convResult = 0;
          return convResult;
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
      });
  }

  // Override getting next state
  getNextState() {
    // Reset constants
    this.gridUpdateKernel
      .setConstants({
        rows: this.rows,
        cols: this.cols,
      })
      .setOutput([this.cols, this.rows]);

    // Call the kernel
    return this.gridUpdateKernel(
      this.grid,
      this.weights,
      (x) => -(1 / Math.pow(2, 0.6 * Math.pow(x, 2))) + 1
    );
  }

  // Calculate color required by a specific state as rgb value
  stateColor(state) {
    return [Math.floor(state * 255), 0, 0];
  }

  // Override randomizing the grid
  randomize() {
    this.grid = new Array(this.rows)
      .fill(null)
      .map(() =>
        new Array(this.cols)
          .fill(null)
          .map((_) => Math.max(0, Math.min(1, gaussianRandom(0.3, 0.1))))
      );
    window.requestAnimationFrame(() => this.drawGrid());
  }

  //TODO: Override downloading the data
  saveData() {
    const automataData = {
      name: "Neural",
      args: [this.ruleString, this.neighborhood],
      grid: this.grid.map((arr) => Array.from(arr)),
    };
    downloadObjectAsJSON(automataData, "neural.json");
  }
}

//! Intialize and trigger automata class
export let automata = new LifeLikeAutomata(); // Automata Definition
export function setAutomata(newAutomataName, args = [], grid = null) {
  // Recast Elementary CA
  if (automata instanceof ElementaryCA) {
    automata.grid = automata.grid.map((row) =>
      row.map((cell) => (cell === 2 ? 0 : cell))
    );
    setFillRadius(3);
  }

  let oldGrid;
  if (!grid) {
    oldGrid = automata.grid;
  } else {
    oldGrid = grid;
  }

  // Change automata class
  switch (newAutomataName) {
    case "Life":
      automata = new LifeLikeAutomata(...args);
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to life-like");
      break;
    case "Langton's Ant":
      automata = new LangtonsAnt(...args);
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to Langton's Ant");
      break;
    case "Elementary CA":
      automata = new ElementaryCA(...args);
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => (state == 1 ? state : 2))
      );
      setFillRadius(0);
      setConsoleText("Changed automata to Elementary CA");
      break;
    case "Brian's Brain":
      automata = new BriansBrain(...args);
      // Convert non 0/1/2 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1, 2].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to Brian's Brain");
      break;
    case "Wireworld":
      automata = new WireWorld(...args);
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1, 2, 3].includes(state) ? state : 0))
      );
      setConsoleText("Changed automata to Wireworld");
      break;
    case "Rock, Paper, Scissors":
      automata = new RPSGame(...args);
      // Convert cells to 2 or below
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1, 2].includes(state) ? state : 0))
      );
      setConsoleText("Changed automata to Rock, Paper, Scissors");
      break;
    case "Neural CA":
      automata = new NeuralCA(...args);
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to neural");
      break;
    default:
      break;
  }
  automata.drawGrid();
  automata.drawCursor();
  automata.updateGrid();
  if (!paused) changePaused();
}
automata.updateGrid();
