// Polyfill for Array.prototype.toReversed (ES2023) for Node.js < 20
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

// Polyfill for Array.prototype.toSorted (ES2023) for Node.js < 20
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

// Polyfill for Array.prototype.toSpliced (ES2023) for Node.js < 20
if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function(start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}
