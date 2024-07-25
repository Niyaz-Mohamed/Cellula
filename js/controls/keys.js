import {
  fps,
  fillRadius,
  setFps,
  setFillRadius,
  changePaused,
  changeStroke,
} from "./controls.js";

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    // Controls for fillRadius increase
    case "=":
    case "+":
      setFillRadius(fillRadius + 1);
      break;
    case "-":
      setFillRadius(fillRadius < 0 ? 0 : fillRadius - 1);
      break;

    // Controls for FPS throttling
    case "ArrowUp":
      setFps(fps + 5);
      break;
    case "ArrowDown":
      setFps(fps - 5 < 1 ? 1 : fps - 5);
      break;

    // Controls for pausing
    case "p":
      changePaused();
      break;

    // Controls for grid stroke
    case "s":
      changeStroke();
      break;

    default:
      break;
  }
});
