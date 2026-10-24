// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Reads a lattice polygon and prints twice its area, its boundary count and
 * its interior count.
 *
 * Numbers are exact integers below 2^53, which the stated coordinate bound
 * keeps every product and sum under.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n < 3 || tokens.length < 1 + 2 * n) {
        return;
    }

    const xs = new Array(n);
    const ys = new Array(n);
    let position = 1;
    for (let i = 0; i < n; i += 1) {
        xs[i] = Number(tokens[position]);
        ys[i] = Number(tokens[position + 1]);
        position += 2;
    }

    let twiceArea = 0;
    let boundary = 0;
    for (let i = 0; i < n; i += 1) {
        const j = (i + 1) % n;
        twiceArea += xs[i] * ys[j] - xs[j] * ys[i];
        boundary += gcd(xs[j] - xs[i], ys[j] - ys[i]);
    }

    twiceArea = Math.abs(twiceArea);
    const interior = (twiceArea - boundary + 2) / 2;

    process.stdout.write(String(twiceArea) + EOL);
    process.stdout.write(String(boundary) + EOL);
    process.stdout.write(String(interior) + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
