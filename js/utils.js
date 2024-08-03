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
  // Special case r=0
  if (r <= 1) {
    return [[x, y]];
  }

  let points = [];
  let dx = r;
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
  if (r <= 0) {
    return [[x, y]];
  }

  // Draw circle of radius r+1 and calculate inner points
  r++;
  let points = [];
  let dx = r;
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
export function mooreNeighborhod(n = 1) {
  let points = [];
  // Draw a square
  for (let dx = -n; dx <= n; dx++) {
    for (let dy = -n; dy <= n; dy++) {
      if (!(dx == 0 && dy == 0)) points.push([dx, dy]);
    }
  }
  return points;
}

// Generate Von Neumann neighborhood relative to point (0,0)
export function vonNeumannNeighbourhood(n = 1) {
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

// Sleep time in milliseconds
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
