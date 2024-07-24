// Create canvas
export const canvas = document.getElementById("cellGrid");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
export const ctx = canvas.getContext("2d");
console.log(window.innerWidth, window.innerHeight);

// Handle any instance of window becoming smaller
export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
