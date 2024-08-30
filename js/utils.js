// Removes all duplicate elements in a 2D array
export function unique2DArr(arr) {
  var unique = [];
  var elementsFound = {};
  for (var i = 0; i < arr.length; i++) {
    var stringified = JSON.stringify(arr[i]);
    if (elementsFound[stringified]) {
      continue;
    }
    unique.push(arr[i]);
    elementsFound[stringified] = true;
  }
  return unique;
}

// Pads an array shorter than a specific length to a specific length, filling up with pad value
export function padArray(arr, size, padValue) {
  if (arr.length < size)
    return [...arr, ...Array(size - arr.length).fill(padValue)];
  else return arr;
}

// Midpoint circle algorithm
export function midpointCircle(x, y, r) {
  // Special case r<0
  if (r < 0) {
    return [];
  }

  let points = [];
  let dx = r - 1;
  let dy = 0;
  let p = 1 - r;

  while (dx >= dy) {
    points.push(
      [x + dx, y + dy],
      [x - dx, y + dy],
      [x + dx, y - dy],
      [x - dx, y - dy],
      [x + dy, y + dx],
      [x - dy, y + dx],
      [x + dy, y - dx],
      [x - dy, y - dx]
    );

    dy++;
    if (p <= 0) {
      p = p + 2 * dy + 1;
    } else {
      dx--;
      p = p + 2 * dy - 2 * dx + 1;
    }
  }

  return unique2DArr(points);
}

// Generate full circles (extends midpoint circle algo)
export function fillCircle(x, y, r) {
  // Special case
  if (r < 0) {
    return [];
  }

  // Draw circle of radius r+1 and calculate inner points
  r++;
  let points = [];
  let dx = r - 1;
  let dy = 0;
  let p = 1 - r;

  while (dx >= dy) {
    let line1 = Array.from({ length: 2 * dx + 1 }, (_, i) => [
      x + (i - dx),
      y + dy,
    ]);
    let line2 = Array.from({ length: 2 * dy + 1 }, (_, i) => [
      x + (i - dy),
      y + dx,
    ]);
    let line3 = Array.from({ length: 2 * dx + 1 }, (_, i) => [
      x + (i - dx),
      y - dy,
    ]);
    let line4 = Array.from({ length: 2 * dy + 1 }, (_, i) => [
      x + (i - dy),
      y - dx,
    ]);
    points.push(...line1.concat(line2, line3, line4));

    dy++;
    if (p <= 0) {
      p = p + 2 * dy + 1;
    } else {
      dx--;
      p = p + 2 * dy - 2 * dx + 1;
    }
  }

  return unique2DArr(points);
}

// Generate Moore neighborhood relative to point (0,0)
export function mooreNeighborhood(n = 1, includeCentre = false) {
  let points = [];
  // Draw a square
  for (let dx = -n; dx <= n; dx++) {
    for (let dy = -n; dy <= n; dy++) {
      if (!(dx == 0 && dy == 0)) points.push([dx, dy]);
      else if (includeCentre) points.push([0, 0]);
    }
  }
  return points;
}

// Generate Von Neumann neighborhood relative to point (0,0)
export function vonNeumannNeighborhood(n = 1) {
  let points = [];
  // Subset of Moore neighbourhood with Manhattan distance <= n
  for (let dx = -n; dx <= n; dx++) {
    for (let dy = -n; dy <= n; dy++) {
      if (dx + dy <= n && !(dx == 0 && dy == 0)) points.push([dx, dy]);
    }
  }
  return points;
}

// Update the console element
export function setConsoleText(text) {
  document.getElementById("console").innerText = text;
}

// Get console text
export function getConsoleText() {
  return document.getElementById("console").innerText;
}

// Trigger download of a file
export function downloadObjectAsJSON(obj, filename) {
  // Convert to JSON string and then blob
  const jsonString = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });

  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const link = window.document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Reshape a grid to a specific dimension, filling up with 0
export function reshape2DArray(
  array,
  targetRows,
  targetCols,
  fillValue = 0,
  genFunction = null
) {
  // Fill the array with the fill value or call a function to generate the value
  const newArray = Array.from({ length: targetRows }, () =>
    Array(targetCols).fill(genFunction ? genFunction() : fillValue)
  );

  // Copy values from the old array to the new array (within bounds)
  for (let r = 0; r < Math.min(array.length, targetRows); r++) {
    for (let c = 0; c < Math.min(array[r].length, targetCols); c++) {
      newArray[r][c] = array[r][c];
    }
  }
  return newArray;
}

// Parses a function string and shields against misuse
export function genShieldedFunction(func) {
  return (x) => {
    // Create a new scope for `f`
    return (function () {
      const document = null;
      const window = null;
      return func(x);
    })();
  };
}
// Generates random number using a normal distribution
export function gaussianRandom(mean, variance) {
  let u1 = Math.random();
  let u2 = Math.random();
  let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // Standard distribution
  return mean + Math.sqrt(variance) * z;
}

// Removes letters in a string to force it to be a decimal
export function stripStringToDecimal(str) {
  str = str
    .replace(/[^0-9.-]/g, "") // Remove all non-digits, dots, or minus signs
    .replace(/(?!^)-/g, "") // Remove all "-" except if it's the first character
    .replace(/(?<=\..*)\./g, ""); // Remove all dots except the first one
  return str;
}

// Packing and unpacking RGB color arrays into integers
export function packRGB(colorArray) {
  colorArray = colorArray.map((i) => Math.min(Math.max(i, 0), 255));
  return (colorArray[0] << 16) | (colorArray[1] << 8) | colorArray[2];
}

export function unpackRGB(colorInt) {
  const r = (colorInt >> 16) & 0xff;
  const g = (colorInt >> 8) & 0xff;
  const b = colorInt & 0xff;
  return [r, g, b];
}

// Function to shift the hue of RGB color directly using matrix mult
export function shiftHue(rgbColor, hueShift = 0) {
  // Function translated from https://stackoverflow.com/a/8510751
  const [r, g, b] = rgbColor;
  // Calculate all angles with radians (input shift is degrees)
  const cosA = Math.cos((hueShift * Math.PI) / 180);
  const sinA = Math.sin((hueShift * Math.PI) / 180);

  // Calculate the rotation matrix to modify hue only
  const matrix = [
    [
      cosA + (1.0 - cosA) / 3.0,
      (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA,
      (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA,
    ],
    [
      (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA,
      cosA + (1.0 / 3.0) * (1.0 - cosA),
      (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA,
    ],
    [
      (1.0 / 3.0) * (1.0 - cosA) - Math.sqrt(1.0 / 3.0) * sinA,
      (1.0 / 3.0) * (1.0 - cosA) + Math.sqrt(1.0 / 3.0) * sinA,
      cosA + (1.0 / 3.0) * (1.0 - cosA),
    ],
  ];

  // Use the rotation matrix to convert the RGB directly
  const newR = r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2];
  const newG = r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2];
  const newB = r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2];
  // Clamp values within range of RGB
  return [
    Math.round(Math.max(Math.min(newR, 255), 0)),
    Math.round(Math.max(Math.min(newG, 255), 0)),
    Math.round(Math.max(Math.min(newB, 255), 0)),
  ];
}

// Functions to shift between HSB and RGB
// Source: https://www.rapidtables.com/convert/color/rgb-to-hsv.html
export function rgbToHsv(rgbColor) {
  const [r, g, b] = rgbColor.map((color) => color / 255);

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let [h, s, v] = [max, max, max];
  let d = max - min;
  // Calculate saturation
  s = max == 0 ? 0 : d / max;

  // Calculate hue
  if (d == 0) {
    h = 0; // Color is greyscale
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = 60 * h;
  }

  return [h, s, v];
}

// Source: https://www.rapidtables.com/convert/color/hsv-to-rgb.html
export function hsvToRgb(hsvColor) {
  const [h, s, v] = hsvColor;

  // Calculate constants required
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  // Calculate order of values
  const colorMap = {
    0: [c, x, 0],
    1: [x, c, 0],
    2: [0, c, x],
    3: [0, x, c],
    4: [x, 0, c],
    5: [c, 0, x],
  };
  return colorMap[Math.floor(h / 60) % 6].map((color) =>
    Math.round(255 * (color + m))
  ); // Round value to prevent issues with RGB packing
}

// Fade any rgb color to black
export function fadeRGB(color, fadeKeepRate) {
  const colorSum = color[0] + color[1] + color[2];
  if (colorSum < 20) return [0, 0, 0]; // When difference is too small to see, just return black
  return color.map((channel) => Math.floor(channel * fadeKeepRate));
}
