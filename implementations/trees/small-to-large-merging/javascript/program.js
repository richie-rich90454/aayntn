"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * The number of distinct colors in the subtree of every vertex, read from
 * standard input.
 *
 * Input: n, then n colors (0-based vertices), then the parents of vertices 1
 * through n-1. Every parent is smaller than its child, so vertex 0 is the root
 * and the vertices are listed in a topological order.
 * Output: n lines; line v holds the number of distinct colors in the subtree
 * of v.
 */

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    if (n === 0) {
        return;
    }

    const colors = [];
    for (let v = 0; v < n; v += 1) {
        colors.push(v + 1 < tokens.length ? Number(tokens[v + 1]) : 0);
    }

    const parent = new Array(n).fill(-1);
    let index = 1 + n;
    for (let v = 1; v < n; v += 1) {
        const value = index < tokens.length ? Number(tokens[index]) : 0;
        index += 1;
        // The contract numbers parents before children; a bad index falls back to the root.
        parent[v] = value >= 0 && value < v ? value : 0;
    }

    const sets = colors.map((color) => new Set([color]));
    const answer = new Array(n).fill(1);
    const weight = new Array(n).fill(1);

    // Every child has a larger index than its parent, so this reverse sweep is
    // a postorder: when v is reached, all of its children are already in its set.
    for (let v = n - 1; v >= 1; v -= 1) {
        answer[v] = sets[v].size;
        const p = parent[v];
        // Keep the larger live component as the base and pour the smaller one
        // into it. The weight counts the vertices the component represents, so
        // the component that holds a moved element at least doubles.
        if (weight[p] < weight[v]) {
            const setSwap = sets[p];
            sets[p] = sets[v];
            sets[v] = setSwap;
            const weightSwap = weight[p];
            weight[p] = weight[v];
            weight[v] = weightSwap;
        }
        for (const color of sets[v]) {
            sets[p].add(color);
        }
        weight[p] += weight[v];
        sets[v].clear();
    }
    answer[0] = sets[0].size;

    process.stdout.write(answer.join("\n") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
