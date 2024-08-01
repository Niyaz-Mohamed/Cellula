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
      document.getElementById("automata-btn").innerHTML = this.innerHTML;

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

      // Update automata to new class chosen
      setAutomata(this.innerHTML);
    }
  });
});

// Handle rule changes
document
  .getElementById("rule-input")
  .addEventListener("input", function (event) {
    automata.setRules(event.target.value);
  });
