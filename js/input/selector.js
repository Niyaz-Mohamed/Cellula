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
      // Process innerHTML if required
      const nameMap = {
        "Rock, Paper, Scissors": "RPS",
      };
      document.getElementById("automata-btn").innerHTML = nameMap[
        this.innerHTML
      ]
        ? nameMap[this.innerHTML]
        : this.innerHTML;

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
      document.getElementById(infoMap[this.innerHTML]).style.display = "block";

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
      document.getElementById(settingsMap[this.innerHTML]).style.display =
        "block";

      // Update automata to new class chosen
      setAutomata(this.innerHTML);
    }
  });
});
