// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Parametric search driver.
 *
 * Reads n, n nonnegative values and a budget, then prints the largest level x
 * whose capped sum, the sum of min(a[i], x), is at most the budget.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function feasible(values, level, budget) {
    let total = 0;
    for (const value of values) {
        total += value < level ? value : level;
        if (total > budget) {
            return false;
        }
    }
    return true;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        process.stdout.write("0" + EOL);
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n <= 0 || tokens.length < n + 2) {
        process.stdout.write("0" + EOL);
        return;
    }

    const values = [];
    let maxValue = 0;
    for (let i = 0; i < n; i += 1) {
        const value = Number(tokens[i + 1]);
        values.push(value);
        if (value > maxValue) {
            maxValue = value;
        }
    }
    const budget = Number(tokens[n + 1]);

    let lo = 0;
    let hi = maxValue;
    let answer = 0;
    while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        if (feasible(values, mid, budget)) {
            answer = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    process.stdout.write(String(answer) + EOL);
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
