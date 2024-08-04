import { automata, setAutomata } from "../automata.js";
import { getConsoleText, reshape2DArray, setConsoleText } from "../utils.js";
import { settingsMap } from "./controls.js";
import { updateAutomataSelect } from "./selector.js";

//! Neighborhood selectors
function createGrid(automataSettingsId) {
  // Get required row elements based on automata settings element
  const rowElement = document
    .getElementById(automataSettingsId)
    .querySelector(".row-select");
  const columnElement = document
    .getElementById(automataSettingsId)
    .querySelector(".column-select");
  const rows = parseInt(rowElement.value);
  const columns = parseInt(columnElement.value);
  const grid = rowElement
    .closest(".automata-settings")
    .querySelector(".neighbor-grid");
  grid.innerHTML = "";

  // Calculate the size of each checkbox
  grid.closest(".automata-settings").style.display = "block";
  const containerWidth = grid.clientWidth;
  let maxCheckboxWidth = (containerWidth - (columns - 1) * 2) / columns; // Account for 2px gap
  const checkboxSize = maxCheckboxWidth <= 30 ? maxCheckboxWidth : 30; // Change the number based on max width allowed in px
  const gridWidth = checkboxSize * columns + 2 * (columns - 1);
  // Generate grid with dimensions
  grid.style.gridTemplateColumns = `repeat(${columns}, ${checkboxSize}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${checkboxSize}px)`;
  grid.style.width = gridWidth + "px";

  // Create checkboxes
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.row = i;
      checkbox.dataset.column = j;
      checkbox.addEventListener("change", updateNeighborhood);

      // Set the middle cell as the center reference cell
      if (i === Math.floor(rows / 2) && j === Math.floor(columns / 2)) {
        checkbox.checked = false;
        checkbox.disabled = true; // Apply css to this disabled box
      }

      grid.appendChild(checkbox);
    }
  }
}

function updateNeighborhood(event) {
  const checkbox = event.target;
  const row = checkbox.dataset.row;
  const column = checkbox.dataset.column;
  const value = checkbox.checked ? 1 : 0;

  console.log(`Cell (${row}, ${column}) updated to: ${value}`);
  // Handle the update logic here
}

// Generate the grids
document.getElementById("settings-btn").addEventListener("click", () => {
  if (typeof settingsMap === "object" && settingsMap !== null) {
    for (let automataSettings of Object.values(settingsMap)) {
      try {
        createGrid(automataSettings);
        // Update the grid size when the window is resized
        window.addEventListener("resize", () => createGrid(automataSettings));
      } catch (e) {}
    }
  }
});

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
      console.log(winCondition);
      if (winCondition) {
        event.target.value = winCondition;
      } else {
        setConsoleText("Invalid Rulestring!");
      }
    }
  });

document.getElementById("rps-state-select").selectedIndex = 0;
document.getElementById("rps-state-select").onchange = (event) => {
  automata.stateCount = Number(event.target.value);
  console.log(automata.stateCount);
};
