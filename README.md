# Cellula

> [Online cellular automata playground](https://niyaz-mohamed.github.io/Cellula) with hardware acceleration using GPU.js, for both PC and mobile

![Made with pure HTML, CSS, and JS](images/Thumbnail/Thumbnail.gif)

> **SEIZURE WARNING: Some patterns may strain the eyes or cause seizure. Use with care.**

Perhaps the most famous Cellular Automaton is [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life), consisting of a grid of black (dead) and white (live) cells. Birth of a cell occurs when it has 2 neighbors and survival of a live cell occurs when it has 2 or 3 neighbors, meaning the rulestring for this automata B3/S23. Cellula allows for experimentation of [different rulestrings](https://conwaylife.com/wiki/List_of_Life-like_rules) to create automata with unique behavior.

Other, more complex automata like Brian's Brain, Rock Paper Scissors, and Neural Automata are also available, with more detailed explanations on the website. Each of these automata have customization options as well, which you can play around with to generate some very complex behavior!

## 🛠️ Usage

8 different automata are currently available. Each automata has settings which can be changed in the 'Settings' panel. Multiple utility actions (pausing, stepping, randomizing) are all available under the 'Controls' panel, with most utilities having an associated keyboard shortcut.

> **To resolve performance issues:** If FPS is low, attempt to enable hardware acceleration for your browser. If this is not possible, then reduce grid resolution/zoom in by pressing 'E' or make your window smaller.

## 🚀 Future Development

I intend to develop this project further in the future by implementing [multiple neighborhood cellular automata](https://slackermanz.com/understanding-multiple-neighborhood-cellular-automata/) (Credit to Slackermanz), which tend to display more complex behavior and form stable structures.

## 🖼️ Gallery

| ![Game of Life](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/Life.webp)        | ![Brian's Brain](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/BrianBrain.webp) |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ![Wireworld](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/Wireworld.webp)      | ![Rock Paper Scissors](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/RPS.webp)  |
| ![Elementary](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/Elementary.webp)    | ![Neural](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/Neural.webp)            |
| ![Langton's Ant](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/LangtonAnt.webp) | ![Huegene](https://raw.githubusercontent.com/Niyaz-Mohamed/Cellula/main/images/Huegene.webp)          |
