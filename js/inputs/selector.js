import { setAutomata } from "../automata.js";
import { infoMap, nameMap, settingsMap } from "./controls.js";

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
    .forEach((content) => (content.style.display = "none"));
  document.getElementById(settingsMap[automataName]).style.display = "block";
}
