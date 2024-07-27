import {
  fps,
  fillRadius,
  setFps,
  setFillRadius,
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
      setFps(fps + 3);
      break;
    case "ArrowDown":
      setFps(fps - 3 < 1 ? 1 : fps - 3);
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
