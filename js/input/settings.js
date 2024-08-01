import { automata } from "../automata.js";

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
