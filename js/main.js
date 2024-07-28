import { LifeLikeAutomata } from "./automata.js";

// Set the drawGrid function
export const automata = new LifeLikeAutomata("B3/S23"); // Automata Definition
automata.updateGrid();

// Handle rule changes
document
  .getElementById("rule-input")
  .addEventListener("input", function (event) {
    automata.setRules(event.target.value);
  });
