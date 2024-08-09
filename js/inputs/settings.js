import { automata, setAutomata } from "../automata.js";
import { getConsoleText, reshape2DArray, setConsoleText } from "../utils.js";
import { infoMap, nameMap, settingsMap } from "./config.js";

//! Respond to specific automata being selected
document.querySelectorAll(".select-btn").forEach((button) => {
  button.addEventListener("click", function () {
    if (!this.classList.contains("selected")) {
      // Reassign the selected class
      document
        .querySelectorAll(".select-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");

      // Update info & settings panels, and also automata select button
      updateAutomataSelect(this.innerHTML);
      // Update automata to new class chosen
      setAutomata(this.innerHTML);
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
}

//! Neighborhood selectors
// Generate the grid dynamically
function createGrid(automataSettingsId) {
  // Get required row elements based on automata settings element
  const settingsContainer = document.getElementById(automataSettingsId);
  const rows = parseInt(settingsContainer.querySelector(".row-select").value);
  const columns = parseInt(
    settingsContainer.querySelector(".column-select").value
  );
  const grid = settingsContainer.querySelector(".neighbor-grid");
  const automataCurrentlySelected =
    settingsContainer.style.display == "block" ? true : false;
  grid.innerHTML = ""; // Reset the grid

  // Calculate the size of each checkbox
  settingsContainer.style.display = "block";
  const containerWidth = grid.closest(".automata-settings").clientWidth;
  let maxCheckboxWidth = (containerWidth - (columns - 1) * 2) / columns; // Account for 2px gap
  let checkboxSize = maxCheckboxWidth <= 30 ? maxCheckboxWidth : 30; // Change the number based on max width allowed in px
  const gridWidth = checkboxSize * columns + 2 * (columns - 1);

  // Rehide settings if it isn't current settings
  if (automataCurrentlySelected) {
    settingsContainer.style.display = "block";
  } else {
    settingsContainer.style.display = "none";
  }

  // Generate grid with dimensions
  grid.style.gridTemplateColumns = `repeat(${columns}, ${checkboxSize}px)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${checkboxSize}px)`;
  grid.style.width = gridWidth + "px";

  // Create checkboxes
  const centerRow = Math.floor(rows / 2);
  const centerColumn = Math.floor(columns / 2);
  const currentNeighborhood = automata.neighborhood;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.row = i - centerRow;
      checkbox.dataset.column = j - centerColumn;
      checkbox.addEventListener("change", updateNeighborhood);

      // Check cells already in neighborhood (using JSON strings)
      if (
        JSON.stringify(currentNeighborhood).indexOf(
          JSON.stringify([j - centerColumn, i - centerRow])
        ) != -1
      ) {
        checkbox.checked = true;
      }

      // Set the middle cell as the center reference cell
      if (i === centerRow && j === centerColumn) {
        checkbox.checked = false;
        checkbox.disabled = true; // Apply css to this disabled box
      }

      grid.appendChild(checkbox);
    }
  }
}

// Generate the grids only when settings are opened
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

// Update the neighborhood when its values change
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

document.getElementById("rps-state-select").selectedIndex = 0;
document.getElementById("rps-state-select").onchange = (event) => {
  automata.stateCount = Number(event.target.value);
};
