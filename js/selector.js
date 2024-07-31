// Respond to a specific automata being selected
document.querySelectorAll(".select-btn").forEach((button) => {
  button.addEventListener("click", function () {
    if (!this.classList.contains("selected")) {
      // Reassign the selected class
      document
        .querySelectorAll(".select-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      this.classList.add("selected");
      document.getElementById("automata-btn").innerHTML = this.innerHTML;

      //TODO: Update the automata class to the new class chosen
    }
  });
});
