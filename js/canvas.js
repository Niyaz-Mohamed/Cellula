// Create canvas
export const canvas = document.getElementById("cellGrid");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
export const ctx = canvas.getContext("2d");

// Handle any instance of window becoming smaller
export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
