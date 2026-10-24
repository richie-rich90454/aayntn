// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Reads n pairs of color and weight, then prints the maximum total weight of a
 * set that contains at most one item of each color.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 1) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isFinite(n) || n <= 0) {
        process.stdout.write("0\n");
        return;
    }
    if (tokens.length < 1 + 2 * n) {
        return;
    }

    const items = [];
    for (let i = 0; i < n; i += 1) {
        items.push({
            color: Number(tokens[1 + 2 * i]),
            weight: Number(tokens[2 + 2 * i]),
        });
    }

    items.sort((a, b) => (a.color !== b.color ? a.color - b.color : b.weight - a.weight));

    let total = 0;
    let first = true;
    let previous = 0;
    for (const item of items) {
        if (first || item.color !== previous) {
            total += item.weight;
            previous = item.color;
            first = false;
        }
    }

    process.stdout.write(`${total}\n`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
