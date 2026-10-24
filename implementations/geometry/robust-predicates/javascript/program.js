// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Reads triples of integer points and prints the exact orientation sign of
 * each triple.
 *
 * The sign is the sign of the cross product of B - A and C - A. The
 * coordinates and the determinant are BigInt values, so the arithmetic is
 * exact for every input. The stated bound of 10^6 keeps the contract
 * identical to the other five implementations.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const q = Number(tokens[0]);
    if (!Number.isInteger(q) || q <= 0 || tokens.length < 1 + 6 * q) {
        return;
    }

    const out = [];
    let position = 1;
    for (let i = 0; i < q; i += 1) {
        const ax = BigInt(tokens[position]);
        const ay = BigInt(tokens[position + 1]);
        const bx = BigInt(tokens[position + 2]);
        const by = BigInt(tokens[position + 3]);
        const cx = BigInt(tokens[position + 4]);
        const cy = BigInt(tokens[position + 5]);
        position += 6;

        const ux = bx - ax;
        const uy = by - ay;
        const vx = cx - ax;
        const vy = cy - ay;
        const d = ux * vy - uy * vx;

        if (d > 0n) {
            out.push("1");
        } else if (d < 0n) {
            out.push("-1");
        } else {
            out.push("0");
        }
    }

    process.stdout.write(out.join("\n") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
