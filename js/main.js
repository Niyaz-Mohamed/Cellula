import "./userinput/keys.js";
import { LifeLikeAutomata } from "./automata.js";
import { mooreNeighborhod, vonNeumannNeighbourhood } from "./utils.js";

// Set the drawGrid function
export const automata = new LifeLikeAutomata("B1/S123456789"); // Automata Definition
automata.updateGrid();
