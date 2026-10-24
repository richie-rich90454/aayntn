// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

import { readFileSync } from "node:fs";

function main() {
    const data = readFileSync(0, "utf8").trim().split(/\s+/);
    if (data.length === 0 || data[0] === "") {
        return;
    }
    const n = Number(data[0]);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
        return;
    }

    const lines = [];
    const total = 1 << n;
    for (let i = 0; i < total; i++) {
        const gray = i ^ (i >>> 1);
        lines.push(gray.toString(2).padStart(n, "0"));
    }
    process.stdout.write(lines.join("\n") + "\n");
}

main();
