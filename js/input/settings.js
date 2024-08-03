import { automata, setAutomata } from "../automata.js";
import { getConsoleText, setConsoleText } from "../utils.js";

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
