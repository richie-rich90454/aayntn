// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Reads n weights and a capacity, then prints the largest number of weights
 * whose total is at most the capacity.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Number(tokens[0]);
    const capacity = Number(tokens[1]);
    if (!Number.isFinite(n) || n <= 0 || tokens.length < 2 + n) {
        process.stdout.write("0\n");
        return;
    }

    const weights = [];
    for (let i = 0; i < n; i += 1) {
        weights.push(Number(tokens[2 + i]));
    }

    weights.sort((x, y) => x - y);

    let used = 0;
    let count = 0;
    for (const weight of weights) {
        if (weight > capacity - used) {
            break;
        }
        used += weight;
        count += 1;
    }

    process.stdout.write(`${count}\n`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
