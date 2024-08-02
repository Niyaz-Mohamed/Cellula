import {
  backgroundColor,
  cellSize,
  changePaused,
  fillRadius,
  paused,
  waitTime,
} from "./input/controls.js";
import {
  fillCircle,
  getConsoleText,
  setConsoleText,
  midpointCircle,
  mooreNeighborhod,
  padArray,
} from "./utils.js";
import {
  mouseX,
  mouseY,
  outlinePoints,
  registerCanvasCallbacks,
} from "./input/userInput.js";

//! Intialize Canvas
const canvas = document.getElementById("cellGrid");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
export const ctx = canvas.getContext("2d");

// Handle any instance of window becoming smaller
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();
registerCanvasCallbacks();

//! Define types of automata
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
    // Apply the imageData to the canvas (done in drawCursor)
    this.gridImageData = imageData;
    this.drawCursor();
    //// console.timeEnd("Draw");
  }

  drawCursor() {
    ctx.putImageData(this.gridImageData, 0, 0);

    // Draw the cursor/pen outline
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
        new Array(this.cols).fill(null).map(() => Math.floor(Math.random() * 2))
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
    window.requestAnimationFrame(() => this.drawGrid());
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
  constructor(ruleString = "B3/S23", neighbourhood = mooreNeighborhod()) {
    super();
    this.setRules(ruleString);
    this.neighbourhood = neighbourhood;

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
        neighbourhoodSize: this.neighbourhood.length,
        rulesSize: Math.max(this.birthRules.length, this.surviveRules.length),
      });
      this.updateGrid();
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
  constructor(ruleString = "2", neighbourhood = mooreNeighborhod()) {
    super();
    this.setRules(ruleString);
    this.neighbourhood = neighbourhood;

    // Create GPU, account for issues in chrome
    function initGPU() {
      try {
        return new window.GPU.GPU();
      } catch (e) {
        return new GPU();
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
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
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

export class WireWorld extends Automata {
  constructor() {
    super();
    this.neighbourhood = mooreNeighborhod();
    this.penState = 3;

    // Create GPU, account for issues in chrome
    function initGPU() {
      try {
        return new window.GPU.GPU();
      } catch (e) {
        return new GPU();
      }
    }
    const gpu = initGPU();
    // Implement GPU kernel to update grid
    this.gridUpdateKernel = gpu
      .createKernel(
        function (grid, neighbourhood) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Cell transitions
          if (current == 0) {
            return 0;
          } else if (current == 1) {
            return 2;
          } else if (current == 2) {
            return 3;
          } else {
            // Handle conductor becoming electron on 1 or 2 electron head neighbors
            let headNeighbors = 0;

            // Count electron head neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 1) {
                headNeighbors++;
              }
            }

            // Update cell value
            if (headNeighbors === 1 || headNeighbors === 2) {
              return 1;
            } else return 3;
          }
        },
        { output: [this.cols, this.rows] }
      )
      .setConstants({
        rows: this.rows,
        cols: this.cols,
        neighbourhoodSize: this.neighbourhood.length,
      });
  }

  // Override calculation of color required by a specific state as rgb value
  stateColor(state) {
    const stateSpace = {
      0: backgroundColor,
      1: [0, 0, 256],
      2: [255, 0, 0],
      3: [255, 255, 0],
    };
    return stateSpace[state];
  }

  // Override calculating the next grid state
  getNextState() {
    return this.gridUpdateKernel(this.grid, this.neighbourhood.flat());
  }

  // Override randomizing the grid
  randomize() {
    // Construct a wirelike pattern using life-like rule B1/S12345678
    let randEngine = new LifeLikeAutomata("B1/S1234568");
    randEngine.grid = new Array(this.rows).fill(null).map(
      () =>
        new Array(this.cols)
          .fill(null)
          .map(() => (Math.random() < 0.001 ? 1 : 0)) // Change probability of 1 to get sparser/denser patterns
    );
    for (let i = 0; i <= 20; i++) {
      randEngine.updateGrid(false, false);
    }

    this.grid = randEngine.grid.map((row) =>
      row.map((value) => (value == 1 ? 3 : value))
    );
    this.drawGrid();
  }

  // Override drawing the grid
  draw() {
    let x = Math.floor(mouseX / cellSize);
    let y = Math.floor(mouseY / cellSize);
    let points = fillCircle(x, y, fillRadius);

    for (const [x, y] of points) {
      if (x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length) {
        // Fill only conductors when penstate is electrons
        if (this.penState == 1 || this.penState == 2) {
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
      1: "Electron Head",
      2: "Electron Tail",
      3: "Conductor",
    };
    // Change pen state
    this.penState = (this.penState + 1) % 4;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    this.drawGrid();
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 255, 255, 0.6)",
      1: "rgba(0, 0, 255, 0.6)",
      2: "rgba(255, 0, 0, 0.6)",
      3: "rgba(255, 255, 0, 0.6)",
    };
    return stateColors[this.penState];
  }
}

// Rock Paper Scissors Game
export class RPSGame extends Automata {
  constructor(
    winCondition = 3,
    stateCount = 3,
    neighbourhood = mooreNeighborhod()
  ) {
    super();
    this.neighbourhood = neighbourhood;
    // Minimum number of cells that beat current cells in the neighborhood for conversion to occur
    this.winCondition = winCondition;
    // Number of states played with, ranges between 3 and 5
    this.stateCount = [3, 4, 5].includes(stateCount) ? 3 : stateCount;

    // Create GPU, account for issues in chrome
    function initGPU() {
      try {
        return new window.GPU.GPU();
      } catch (e) {
        return new GPU();
      }
    }
    const gpu = initGPU();
    // Implement GPU kernel to update grid
    this.gridUpdateKernel = gpu
      .createKernel(
        function (grid, neighbourhood, winCondition, stateCount) {
          const x = this.thread.x;
          const y = this.thread.y;
          const current = grid[y][x];

          // Cell transitions
          if (current == 0) {
            // Rock (0) beaten by Paper (1) or Spock (4)
            let paperNeighbors = 0;
            let spockNeighbors = 0;

            // Count neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 1) {
                paperNeighbors++;
              } else if (neighborValue == 4) {
                spockNeighbors++;
              }
            }

            // Update cell value
            if (paperNeighbors + spockNeighbors >= winCondition) {
              if (paperNeighbors > spockNeighbors) {
                return 1;
              } else return 4;
            } else if (paperNeighbors >= winCondition) {
              return 1;
            } else if (spockNeighbors >= winCondition && stateCount == 5) {
              return 4;
            } else return current;
          } else if (current == 1) {
            // Paper (1) beaten by Scissors (2) and Lizard (3)
            let scissorNeighbors = 0;
            let lizardNeighbors = 0;

            // Count neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 2) {
                scissorNeighbors++;
              } else if (neighborValue == 3) {
                lizardNeighbors++;
              }
            }

            // Update cell value
            if (scissorNeighbors + lizardNeighbors >= winCondition) {
              if (scissorNeighbors > lizardNeighbors) {
                return 2;
              } else return 3;
            } else if (scissorNeighbors >= winCondition) {
              return 2;
            } else if (lizardNeighbors >= winCondition && stateCount >= 4) {
              return 3;
            } else return current;
          } else if (current == 2) {
            // Scissors (2) beaten by Rock (1) and Spock (4)
            //! SPECIAL CASE: Scissors beaten by Lizard (3) if stateCount is 4 (unbalanced rules)
            let rockNeighbors = 0;
            let spockNeighbors = 0;
            let lizardNeighbors = 0;

            // Count neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 0) {
                rockNeighbors++;
              } else if (neighborValue == 4) {
                spockNeighbors++;
              } else if (neighborValue == 3) {
                lizardNeighbors++;
              }
            }

            //! SPECIAL CASE: Update for stateCount 4
            if (stateCount == 4) {
              if (
                rockNeighbors >= winCondition &&
                lizardNeighbors >= winCondition
              ) {
                if (rockNeighbors > lizardNeighbors) {
                  return 0;
                } else return 4;
              } else if (rockNeighbors >= winCondition) {
                return 0;
              } else if (lizardNeighbors >= winCondition) {
                return 3;
              } else return current;
            }

            // Update cell value
            if (rockNeighbors + spockNeighbors >= winCondition) {
              if (rockNeighbors > spockNeighbors) {
                return 0;
              } else return 4;
            } else if (rockNeighbors >= winCondition) {
              return 0;
            } else if (spockNeighbors >= winCondition && stateCount == 5) {
              return 4;
            } else return current;
          } else if (current == 3) {
            // Lizard beaten by Rock (0) and Scissors (2)
            //! SPECIAL CASE: Lizard not defeated by Scissors when stateCount = 4
            let rockNeighbors = 0;
            let scissorNeighbors = 0;

            // Count neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 0) {
                rockNeighbors++;
              } else if (neighborValue == 2) {
                scissorNeighbors++;
              }
            }

            //! SPECIAL CASE
            if (stateCount == 4) {
              if (rockNeighbors >= winCondition) {
                return 0;
              } else return current;
            }

            // Update cell value
            if (rockNeighbors + scissorNeighbors >= winCondition) {
              if (rockNeighbors > scissorNeighbors) {
                return 0;
              } else return 2;
            } else if (rockNeighbors >= winCondition) {
              return 0;
            } else if (scissorNeighbors >= winCondition) {
              return 2;
            } else return current;
          } else {
            // Spock beaten by Paper (1) and Lizard (4)
            let paperNeighbors = 0;
            let lizardNeighbors = 0;

            // Count neighbors
            for (let i = 0; i < this.constants.neighbourhoodSize; i++) {
              const dx = neighbourhood[i * 2];
              const dy = neighbourhood[i * 2 + 1];
              const neighborValue =
                grid[(y + dy + this.constants.rows) % this.constants.rows][
                  (x + dx + this.constants.cols) % this.constants.cols
                ];
              if (neighborValue == 1) {
                paperNeighbors++;
              } else if (neighborValue == 3) {
                lizardNeighbors++;
              }
            }

            // Update cell value
            if (paperNeighbors + lizardNeighbors >= winCondition) {
              if (paperNeighbors > lizardNeighbors) {
                return 1;
              } else return 3;
            } else if (paperNeighbors >= winCondition) {
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
        neighbourhoodSize: this.neighbourhood.length,
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
    return this.gridUpdateKernel(
      this.grid,
      this.neighbourhood,
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
    this.drawGrid();
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
    this.penState = (this.penState + 1) % 5;
    setConsoleText(
      `Updated pen to draw ${stateNames[this.penState]} [${this.penState}]`
    );
    this.drawGrid();
  }

  // Override get pen color
  getPenColor() {
    let stateColors = {
      0: "rgba(255, 0, 0, 0.6)", // Rock
      1: "rgba(0, 255, 0, 0.6)", // Paper
      2: "rgba(0, 0, 255, 0.6)", // Scissors
      3: "rgba(0, 255, 127, 0.6)", // Lizard
      4: "rgba(0, 127, 255, 0.6)", // Spock
    };
    return stateColors[this.penState];
  }
}

//! Intialize and trigger automata class
export let automata = new LifeLikeAutomata(); // Automata Definition
export function setAutomata(newAutomataName) {
  const oldGrid = automata.grid;
  // Change automata class
  switch (newAutomataName) {
    case "Life":
      automata = new LifeLikeAutomata();
      // Convert non 0/1 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to life-like");
      break;
    case "Brian's Brain":
      automata = new BriansBrain();
      // Convert non 0/1/2 cells to 1
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1, 2].includes(state) ? state : 1))
      );
      setConsoleText("Changed automata to Brian's Brain");
      break;
    case "Wireworld":
      automata = new WireWorld();
      setConsoleText("Changed automata to Wireworld");
      break;
    case "Rock, Paper, Scissors":
      automata = new RPSGame();
      // Convert cells to 2 or below
      automata.grid = oldGrid.map((row) =>
        row.map((state) => ([0, 1, 2].includes(state) ? state : 0))
      );
      setConsoleText("Changed automata to Rock, Paper, Scissors");
      break;
    default:
      break;
  }
  automata.drawGrid();
  automata.updateGrid();
}
automata.updateGrid();
