"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let index = 0;
    const next = () => tokens[index++];

    const rows = Number(next());
    const cols = Number(next());
    const diff = Array.from({ length: rows + 2 }, () => new Array(cols + 2).fill(0n));

    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            diff[i][j] = BigInt(next());
        }
    }

    for (let i = 1; i <= rows; i++) {
        let previous = 0n;
        for (let j = 1; j <= cols; j++) {
            const current = diff[i][j];
            diff[i][j] = current - previous;
            previous = current;
        }
    }

    for (let j = 1; j <= cols; j++) {
        for (let i = rows; i >= 2; i--) {
            diff[i][j] -= diff[i - 1][j];
        }
    }

    const queries = Number(next());
    for (let k = 0; k < queries; k++) {
        const r1 = Number(next());
        const c1 = Number(next());
        const r2 = Number(next());
        const c2 = Number(next());
        const value = BigInt(next());
        diff[r1][c1] += value;
        diff[r2 + 1][c1] -= value;
        diff[r1][c2 + 1] -= value;
        diff[r2 + 1][c2 + 1] += value;
    }

    for (let i = 1; i <= rows; i++) {
        for (let j = 1; j <= cols; j++) {
            diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1];
        }
    }

    const output = [];
    for (let i = 1; i <= rows; i++) {
        const line = [];
        for (let j = 1; j <= cols; j++) {
            line.push(diff[i][j].toString());
        }
        output.push(line.join(" "));
    }
    process.stdout.write(output.join("\n") + "\n");
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
