import { automata } from "../automata.js";
import { getConsoleText, setConsoleText } from "../utils.js";

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

document.getElementById("rps-state-select").onchange = (event) => {
  automata.stateCount = Number(event.target.value);
  console.log(automata.stateCount);
};
