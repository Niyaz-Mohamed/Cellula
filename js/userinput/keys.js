import { automata } from "../main.js";
import {
  fillRadius,
  setFillRadius,
  waitTime,
  setWaitTime,
  changePaused,
} from "./controls.js";

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    // Controls for fillRadius increase
    case "ArrowUp":
      setFillRadius(fillRadius + 1);
      break;
    case "ArrowDown":
      setFillRadius(fillRadius - 1 < 0 ? 0 : fillRadius - 1);
      break;

    // Controls for FPS throttling
    case "=":
    case "+":
      setWaitTime(waitTime + 50);
      break;
    case "-":
      setWaitTime(waitTime - 50 < 0 ? 0 : waitTime - 50);
      break;

    // Controls for pausing on space
    case "p":
    case " ":
      changePaused();
      break;

    //TODO: Add grid randomizing with tab
    case "Tab":
    case "r":
      automata.randomize();

    default:
      break;
  }
});
