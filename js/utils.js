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
export function reshape2DArray(array, targetRows, targetCols, fillValue = 0) {
  const newArray = Array.from({ length: targetRows }, () =>
    Array(targetCols).fill(fillValue)
  );

  // Copy values from the old array to the new array (within bounds)
  for (let r = 0; r < Math.min(array.length, targetRows); r++) {
    for (let c = 0; c < Math.min(array[r].length, targetCols); c++) {
      newArray[r][c] = array[r][c];
    }
  }
  return newArray;
}

// Generates random number using a normal distribution
export function gaussianRandom(mean, variance) {
  let u1 = Math.random();
  let u2 = Math.random();
  let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // Standard distribution
  return mean + Math.sqrt(variance) * z;
}

export function stripStringToDecimal(str) {
  str = str
    .replace(/[^0-9.-]/g, "") // Remove all non-digits, dots, or minus signs
    .replace(/(?!^)-/g, "") // Remove all "-" except if it's the first character
    .replace(/(?<=\..*)\./g, ""); // Remove all dots except the first one
  return str;
}
