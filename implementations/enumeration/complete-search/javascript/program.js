// Educational reference implementation: JavaScript is not a USACO submission language.

import { readFileSync } from "node:fs";

/**
 * Count the subsets whose sum equals the target by trying every subset.
 *
 * Input: n, then n integers, then the target.
 * Output: one line holding the count.
 */
function search(index, running, values, target) {
    if (index === values.length) {
        return running === target ? 1 : 0;
    }
    return (
        search(index + 1, running, values, target) +
        search(index + 1, running + values[index], values, target)
    );
}

function main() {
    const tokens = readFileSync(0, "utf8").trim().split(/\s+/);
    if (tokens.length === 0 || tokens[0] === "") {
        return;
    }
    const n = Number(tokens[0]);
    const values = tokens.slice(1, 1 + n).map(Number);
    const target = Number(tokens[1 + n]);
    console.log(search(0, 0, values, target));
}

main();
