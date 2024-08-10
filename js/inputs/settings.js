import { automata, NeuralCA, setAutomata } from "../automata.js";
import {
  getConsoleText,
  reshape2DArray,
  setConsoleText,
  stripStringToDecimal,
} from "../utils.js";
import { infoMap, nameMap, settingsMap } from "./config.js";

//! Respond to specific automata being selected
document.querySelectorAll(".select-btn").forEach((button) => {
  button.addEventListener("click", function () {
    if (!this.classList.contains("selected")) {
      // Update automata to new class chosen
      setAutomata(this.innerHTML);

      // Ensure the select button shows that the automata is selected
      document
        .querySelectorAll(".select-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");

      // Update info & settings panels, and also automata select button
      updateAutomataSelect(this.innerHTML);
    }
  });
});

export function updateAutomataSelect(automataName) {
  // Process innerHTML if required
  document.getElementById("automata-btn").innerHTML = nameMap[automataName]
    ? nameMap[automataName]
    : automataName;

  // Reassign the content shown
  document
    .querySelectorAll(".side-content")
    .forEach((content) => (content.style.display = "none"));
  document.getElementById(infoMap[automataName]).style.display = "block";

  // Reassign the settings shown
  document
    .querySelectorAll(".automata-settings")
    .forEach((setting) => (setting.style.display = "none"));
  document.getElementById(settingsMap[automataName]).style.display = "block";

  // Only update the grid if it exists
  try {
    createGrid(settingsMap[automataName]);
  } catch (e) {}
}

//! Neighborhood selectors
// Generate the grid dynamically
function createGrid(automataSettingsId) {
  // Get required row elements based on automata settings element
  const settingsContainer = document.getElementById(automataSettingsId);
  const rows = parseInt(settingsContainer.querySelector(".row-select").value);
  const cols = parseInt(
    settingsContainer.querySelector(".column-select").value
  );
  const grid = settingsContainer.querySelector(".neighbor-grid");
  const automataCurrentlySelected =
    settingsContainer.style.display == "block" ? true : false;
  grid.innerHTML = ""; // Reset the grid

  // Account for neural CA
  const isNeural = automata instanceof NeuralCA;
  let currentWeights = automata.weights ? automata.weights : []; // For Neural CA only
  currentWeights = reshape2DArray(currentWeights, rows, cols);

  // Calculate the size of each checkbox
  settingsContainer.style.display = "block";
  const containerWidth = grid.closest(".automata-settings").clientWidth;
  let maxCheckboxWidth = (containerWidth - (cols - 1) * 2) / cols; // Account for 2px gap
  let checkboxSize = maxCheckboxWidth <= 30 ? maxCheckboxWidth : 30; // Change the number based on max width allowed in px
  const gridWidth = checkboxSize * cols + 2 * (cols - 1);
  // Different width only for neural CA
  let checkboxWidth = null;
  if (isNeural) checkboxWidth = maxCheckboxWidth;

  // Rehide settings if it isn't current settings
  if (automataCurrentlySelected) {
    settingsContainer.style.display = "block";
  } else {
    settingsContainer.style.display = "none";
  }

  // Generate grid with required dimensions
  grid.style.gridTemplateColumns = `repeat(${cols}, ${
    checkboxWidth ? checkboxWidth : checkboxSize
  }px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${checkboxSize}px)`;
  grid.style.width = gridWidth + "px";

  // Create checkboxes
  const centerRow = Math.floor(rows / 2);
  const centerColumn = Math.floor(cols / 2);
  const currentNeighborhood = automata.neighborhood;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (isNeural) {
        // Create numerical input for neural automata
        const numInput = document.createElement("input");
        numInput.type = "text";
        numInput.dataset.row = y - centerRow;
        numInput.dataset.column = x - centerColumn;
        numInput.addEventListener("input", (event) => {
          // Sanitise inputs
          let value = event.target.value;
          value = value ? value : stripStringToDecimal(event.target.value);
          value = value == "" || value == "0" ? "0." : value;
          event.target.value = value;
          // Update the weights
          updateWeights(event, rows, cols);
        });
        numInput.value = currentWeights[y][x];
        if (numInput.value == 0) numInput.classList.add("neural-inactive");

        // Set the middle cell as the center reference cell
        if (y === centerRow && x === centerColumn) {
          numInput.classList.add("center");
        }

        // Add the numerical input to DOM
        grid.appendChild(numInput);
      } else {
        // Create checkbox for non-neural automata
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.row = y - centerRow;
        checkbox.dataset.column = x - centerColumn;
        checkbox.addEventListener("change", updateNeighborhood);

        // Check cells already in neighborhood (using JSON strings)
        if (
          JSON.stringify(currentNeighborhood).indexOf(
            JSON.stringify([x - centerColumn, y - centerRow])
          ) != -1
        ) {
          checkbox.checked = true;
        }

        // Set the middle cell as the center reference cell
        if (y === centerRow && x === centerColumn) {
          checkbox.checked = false;
          checkbox.disabled = true; // Apply css to this disabled box
        }
        // Add the checkbox to DOM
        grid.appendChild(checkbox);
      }
    }
  }
}

// Generate the grids when settings are opened
document.getElementById("settings-btn").addEventListener("click", () => {
  if (typeof settingsMap === "object" && settingsMap !== null) {
    for (let automataSettings of Object.values(settingsMap)) {
      try {
        createGrid(automataSettings, automata.neighborhood);
        // Update the grid size when the window is resized
        window.addEventListener("resize", () => createGrid(automataSettings));
      } catch (e) {}
    }
  }
});

// React to changes in row and column number
document.querySelectorAll(".row-select").forEach((element) =>
  element.addEventListener("input", (event) => {
    // Sanitise input
    if (/^\d+$/.test(event.target.value)) {
      createGrid(event.target.closest(".automata-settings").id);
    } else {
      event.target.value = event.target.value.replace(/\D/g, "");
    }
  })
);
document.querySelectorAll(".column-select").forEach((element) =>
  element.addEventListener("input", (event) => {
    // Sanitise input
    if (/^\d+$/.test(event.target.value)) {
      createGrid(event.target.closest(".automata-settings").id);
    } else {
      event.target.value = event.target.value.replace(/\D/g, "");
    }
  })
);

// Update the neighborhood when selected neighborhood changes
function updateNeighborhood(event) {
  let neighborhood = [];
  event.target
    .closest(".neighbor-grid")
    .querySelectorAll("input")
    .forEach((checkbox) => {
      if (checkbox.checked)
        neighborhood.push([
          Number(checkbox.dataset.column),
          Number(checkbox.dataset.row),
        ]);
    });
  automata.neighborhood = neighborhood;
}

// Update weights & neighborhood for neural CA
function updateWeights(event, rows, cols) {
  // Find offset in rows and columns that makes them negative
  const rowOffset = Math.floor(rows / 2);
  const colOffset = Math.floor(cols / 2);
  // Update neighborhood
  let neighborhood = [];
  let weights = new Array(rows).fill(null).map(() => new Array(cols).fill(0));
  event.target
    .closest(".neighbor-grid")
    .querySelectorAll("input")
    .forEach((input) => {
      const inputRow = Number(input.dataset.row); // Changed from column to row
      const inputColumn = Number(input.dataset.column); // Changed from row to column
      neighborhood.push([inputRow, inputColumn]);
      weights[inputRow + rowOffset][inputColumn + colOffset] = Number(
        input.value
      );
      // Update active status of input
      if (input.value == 0) {
        input.classList.add("neural-inactive");
      } else {
        input.classList.remove("neural-inactive");
      }
    });
  // Update the values
  automata.neighborhood = neighborhood;
  automata.weights = weights;
}

//! Change in file load
document.getElementById("file-input").addEventListener(
  "change",
  (event) => {
    const file = event.target.files[0];
    // Read the file if it exists
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          // Reshape the grid
          data["grid"] = reshape2DArray(
            data["grid"],
            automata.grid.length,
            automata.grid[0].length
          );
          // Update required info
          updateAutomataSelect(data["name"]);
          setAutomata(data["name"], data["args"], data["grid"]);
        } catch (error) {
          console.log(error);
          // Handle errors
          document.getElementById("invalid-file-notice").style.display =
            "block";
        }
      };
      reader.readAsText(file);
    } else {
      document.getElementById("invalid-file-notice").style.display = "block";
    }
  },
  false
);

//! Life-like rules
document
  .getElementById("life-rule-input")
  .addEventListener("input", function (event) {
    automata.setRules(event.target.value);
  });

//! Elementary CA rules
document
  .getElementById("elementary-rule-input")
  .addEventListener("input", function (event) {
    // Strip non-digit characters from the input
    let ruleNumber = Number(event.target.value.replace(/\D/g, ""), 10);
    ruleNumber = ruleNumber < 0 ? 0 : ruleNumber > 255 ? 255 : ruleNumber;
    event.target.value = ruleNumber;
    // Assign rule
    automata.ruleNumber = ruleNumber;
    automata.ruleMap = automata.parseEcaRule(automata.ruleNumber);
    // Reset cells to prevent strobing
    automata.grid = automata.grid.map((row) =>
      row.map((state) => (state == 1 ? state : 2))
    );
  });

//! Brian's Brain rules
document
  .getElementById("brain-rule-input")
  .addEventListener("input", function (event) {
    automata.setRules(event.target.value);
  });

//! Rock Paper Scissors Rule Input
document
  .getElementById("rps-rule-input")
  .addEventListener("input", function (event) {
    let winCondition = event.target.value;
    // Update the automata
    if (/^\d+$/.test(winCondition)) {
      winCondition = Number(winCondition);
      if (winCondition == 0) {
        setConsoleText("Invalid Rulestring!");
      } else {
        automata.winCondition = event.target.value;
        if (getConsoleText() == "Invalid Rulestring!")
          setConsoleText("Valid Rulestring");
      }
    } else {
      winCondition = winCondition.replace(/\D/g, "");
      if (winCondition) {
        event.target.value = winCondition;
      } else {
        setConsoleText("Invalid Rulestring!");
      }
    }
  });

// Handle changes in state
document.getElementById("rps-state-select").selectedIndex = 0;
document.getElementById("rps-state-select").onchange = (event) => {
  automata.stateCount = Number(event.target.value);
};

//! Neural CA Rules
document.getElementById("neural-randomize").onclick = (_) => {
  const settingsContainer = document.getElementById("neural-settings");
  const rows = parseInt(settingsContainer.querySelector(".row-select").value);
  const cols = parseInt(
    settingsContainer.querySelector(".column-select").value
  );

  // Get random weights
  let randomWeights = new Array(rows)
    .fill(null)
    .map((_) =>
      new Array(cols)
        .fill(null)
        .map((_) => Number((Math.random() * 2 - 1).toFixed(4)))
    );

  // Populate the grid
  automata.weights = randomWeights;
  createGrid(settingsContainer.id);
  automata.randomize();
};

// Handle changes in activation
const activationSelector = document.getElementById("neural-activation-select");
activationSelector.selectedIndex = activationSelector.options.length - 1;
activationSelector.onchange = (event) => {
  setActivation(event.target.value);
};

function setActivation(type, args = []) {
  const funcMap = {
    identity: (x) => x,
    power: (x) => Math.pow(x, 2),
    absolute: (x) => Math.abs(x),
    tanh: (x) => (Math.exp(2 * x) - 1) / (Math.exp(2 * x) + 1),
    "inverse-gaussian": (x) => -(1 / Math.pow(2, 0.6 * Math.pow(x, 2))) + 1,
  };
  automata.activation = funcMap[type];
}

// Handle changes in skip frame
document
  .getElementById("neural-skip-input")
  .addEventListener("input", function (_) {
    automata.skipFrames = document.getElementById("neural-skip-input").checked;
  });
