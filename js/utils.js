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

  return points;
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

export function mooreNeighborhod(n = 1) {
  points = [];
  // Draw a square
  for (let dx = -n; dx <= n; x++) {
    for (let dy = -n; dy <= n; y++) {
      points.push([dx, dy]);
    }
  }
  return points;
}

export function vonNeumannNeighborhood(n = 1) {
  points = [];
  // Subset of Moore neighbourhood with Manhattan distance <= n
  for (let dx = -n; dx <= n; dx++) {
    for (let dy = -n; dy <= n; dy++) {
      if (dx + dy <= n) {
        neighborhood.push([dx, dy]);
      }
    }
  }
  return points;
}
