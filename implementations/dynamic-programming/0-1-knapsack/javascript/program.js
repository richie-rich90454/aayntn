"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * 0/1 knapsack read from standard input.
 *
 * Input: n W, then n lines w v.
 * Output: the maximum achievable total value, on one line.
 */

/**
 * Maximum total value of a subset of the items whose total weight is at most
 * capacity.
 *
 * @param {number[]} weights the weight of every item
 * @param {number[]} values the value of every item, parallel to weights
 * @param {number} capacity the weight budget
 * @returns {number} the largest total value that fits in capacity
 */
function knapsackMaxValue(weights, values, capacity) {
    if (capacity < 0) {
        return 0;
    }

    const table = new Array(capacity + 1).fill(0);
    const count = Math.min(weights.length, values.length);
    for (let i = 0; i < count; i += 1) {
        const weight = Math.max(0, weights[i]);

        // The capacity must run downwards: table[c - weight] has to still hold the
        // answer for the items before this one. With an upwards sweep that cell
        // would already include this item, so the item would be counted more than
        // once and the table would solve the unbounded knapsack.
        for (let c = capacity; c >= weight; c -= 1) {
            const candidate = table[c - weight] + values[i];
            if (candidate > table[c]) {
                table[c] = candidate;
            }
        }
    }

    return table[capacity];
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const capacity = Math.max(0, Number(tokens[1]));

    const weights = [];
    const values = [];
    let index = 2;
    for (let i = 0; i < n; i += 1) {
        if (index + 1 >= tokens.length) {
            break;
        }
        weights.push(Number(tokens[index]));
        values.push(Number(tokens[index + 1]));
        index += 2;
    }

    process.stdout.write(String(knapsackMaxValue(weights, values, capacity)) + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
