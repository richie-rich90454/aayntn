// Educational reference implementation: JavaScript is not a USACO submission
// language.

"use strict";

/**
 * Reads a set of allowed moves and a list of heap sizes, tabulates the Grundy
 * value of one heap, prints the value of every heap, and reports whether the
 * combined position is a win for the first player.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let position = 0;
    const k = Math.max(0, Number(tokens[position]));
    position += 1;
    const moves = [];
    for (let i = 0; i < k && position < tokens.length; i += 1) {
        moves.push(Number(tokens[position]));
        position += 1;
    }

    if (position >= tokens.length) {
        return;
    }
    const h = Math.max(0, Number(tokens[position]));
    position += 1;
    const heaps = [];
    let maxHeap = 0;
    for (let i = 0; i < h && position < tokens.length; i += 1) {
        const size = Number(tokens[position]);
        position += 1;
        heaps.push(size);
        if (size > maxHeap) {
            maxHeap = size;
        }
    }

    const grundy = new Array(maxHeap + 1).fill(0);
    const seen = new Array(k + 2).fill(0);

    for (let size = 1; size <= maxHeap; size += 1) {
        for (const move of moves) {
            if (move <= size) {
                // The stamp size marks a value reachable from this heap size.
                seen[grundy[size - move]] = size;
            }
        }
        let value = 0;
        while (value <= k && seen[value] === size) {
            value += 1;
        }
        grundy[size] = value;
    }

    const lines = [];
    let total = 0;
    for (const size of heaps) {
        const value = grundy[size];
        lines.push(String(value));
        total ^= value;
    }
    lines.push(total !== 0 ? "first" : "second");
    process.stdout.write(lines.join("\n") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
