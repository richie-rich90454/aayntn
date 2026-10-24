// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * Two-pointer pair count driver.
 *
 * Reads n, then n integers in non-decreasing order, then the target.
 * Prints the number of index pairs i < j whose sum is at most the target.
 */

function countPairs(values, target) {
    let left = 0;
    let right = values.length - 1;
    let total = 0;

    while (left < right) {
        if (values[left] + values[right] <= target) {
            total += right - left;
            left += 1;
        } else {
            right -= 1;
        }
    }
    return total;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);

    if (tokens.length === 0) {
        process.stdout.write("0\n");
        return;
    }

    const n = Number(tokens[0]);

    if (!Number.isInteger(n) || n < 0 || tokens.length < n + 2) {
        process.stdout.write("0\n");
        return;
    }

    const values = [];
    for (let i = 0; i < n; ++i) {
        values.push(Number(tokens[i + 1]));
    }

    const target = Number(tokens[n + 1]);
    process.stdout.write(String(countPairs(values, target)) + "\n");
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
