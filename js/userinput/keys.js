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
    case "=":
    case "+":
      setFillRadius(fillRadius + 1);
      break;
    case "-":
      setFillRadius(fillRadius - 1 < 0 ? 0 : fillRadius - 1);
      break;

    // Controls for FPS throttling
    case "ArrowUp":
      setWaitTime(waitTime + 50);
      break;
    case "ArrowDown":
      setWaitTime(waitTime - 50 < 0 ? 0 : waitTime - 50);
      break;

    // Controls for pausing
    case " ":
    case "p":
      changePaused();
      break;

    default:
      break;
  }
});
