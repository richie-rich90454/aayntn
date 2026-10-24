// Educational reference implementation: JavaScript is not a USACO submission language.

import { readFileSync } from "node:fs";

let count = 0;
let nodes = 0;

function search(row, cols, down, anti, n, full) {
    nodes += 1;
    if (row === n) {
        count += 1;
        return;
    }
    let available = full & ~(cols | down | anti);
    while (available !== 0) {
        const bit = available & -available;
        available ^= bit;
        search(row + 1, cols | bit, ((down | bit) << 1) & full, (anti | bit) >>> 1, n, full);
    }
}

function main() {
    const text = readFileSync(0, "utf8").trim();
    if (text === "") {
        return;
    }
    const n = Number(text.split(/\s+/)[0]);
    const full = (1 << n) - 1;
    search(0, 0, 0, 0, n, full);
    console.log(`${count} ${nodes}`);
}

main();
