import { BriansBrain, LifeLikeAutomata } from "./automata.js";

// Set the drawGrid function
export const automata = new BriansBrain(); // Automata Definition
automata.updateGrid();

// Handle rule changes
document
  .getElementById("rule-input")
  .addEventListener("input", function (event) {
    automata.setRules(event.target.value);
  });
