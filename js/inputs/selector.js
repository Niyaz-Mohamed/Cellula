import { setAutomata } from "../automata.js";

// Respond to a specific automata being selected
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
  const nameMap = {
    "Brian's Brain": "BB",
    "Rock, Paper, Scissors": "RPS",
  };
  document.getElementById("automata-btn").innerHTML = nameMap[automataName]
    ? nameMap[automataName]
    : automataName;

  // Reassign the content shown
  const infoMap = {
    Life: "life-info",
    "Brian's Brain": "brain-info",
    Wireworld: "wire-info",
    "Rock, Paper, Scissors": "rps-info",
  }; //! This maps each automata name to the id of its info content
  document
    .querySelectorAll(".side-content")
    .forEach((content) => (content.style.display = "none"));
  document.getElementById(infoMap[automataName]).style.display = "block";

  // Reassign the settings shown
  const settingsMap = {
    Life: "life-settings",
    "Brian's Brain": "brain-settings",
    Wireworld: "wire-settings",
    "Rock, Paper, Scissors": "rps-settings",
  }; //! This maps each automata name to the id of its info content
  document
    .querySelectorAll(".automata-settings")
    .forEach((content) => (content.style.display = "none"));
  document.getElementById(settingsMap[automataName]).style.display = "block";
}
