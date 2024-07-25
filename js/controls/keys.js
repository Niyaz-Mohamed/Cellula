import { fps, fillRadius, setFps, setFillRadius } from "./controls.js";

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    // Controls for fillRadius increase
    case "=":
    case "+":
      setFillRadius(fillRadius + 1);
      break;
    case "-":
      setFillRadius(fillRadius - 1 < 1 ? 1 : fillRadius - 1);
      break;

    // Controls for FPS throttling
    case "ArrowUp":
      setFps(fps + 5);
      break;
    case "ArrowDown":
      setFps(fps - 5 < 10 ? 10 : fps - 5);
      break;

    default:
      break;
  }
});
