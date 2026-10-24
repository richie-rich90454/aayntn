// Educational reference implementation: JavaScript/Pascal is not a USACO submission language.

"use strict";

import { readFileSync } from "node:fs";

const MODULO = 1000000007n;

function modPower(baseValue, exponentValue) {
    let base = baseValue % MODULO;
    let exponent = exponentValue;
    let result = 1n;
    while (exponent > 0n) {
        if ((exponent & 1n) !== 0n) {
            result = (result * base) % MODULO;
        }
        base = (base * base) % MODULO;
        exponent >>= 1n;
    }
    return result;
}

function main() {
    const tokens = readFileSync(0, "utf8")
        .split(/\s+/)
        .filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let position = 0;
    const next = () => tokens[position++];

    const n = Number(next());
    const limit = n < 0 ? 0 : n;

    const value = new Array(limit + 1).fill(0n);
    const product = new Array(limit + 1).fill(1n);
    const inverse = new Array(limit + 1).fill(1n);
    const zeros = new Array(limit + 1).fill(0n);

    for (let i = 1; i <= limit; i += 1) {
        if (position >= tokens.length) {
            break;
        }
        let x = BigInt(next()) % MODULO;
        if (x < 0n) {
            x += MODULO;
        }
        value[i] = x;
        zeros[i] = zeros[i - 1] + (x === 0n ? 1n : 0n);
        product[i] = (product[i - 1] * (x === 0n ? 1n : x)) % MODULO;
    }

    inverse[limit] = modPower(product[limit], MODULO - 2n);
    for (let i = limit; i >= 1; i -= 1) {
        const factor = value[i] === 0n ? 1n : value[i];
        inverse[i - 1] = (inverse[i] * factor) % MODULO;
    }

    if (position >= tokens.length) {
        return;
    }
    const q = Number(next());
    const queryCount = q < 0 ? 0 : q;
    const lines = [];

    for (let j = 0; j < queryCount; j += 1) {
        if (position + 1 >= tokens.length) {
            break;
        }
        const l = Number(next());
        const r = Number(next());
        if (zeros[r] - zeros[l - 1] > 0n) {
            lines.push("0");
        } else {
            lines.push(((product[r] * inverse[l - 1]) % MODULO).toString());
        }
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join("\n") + "\n");
    }
}

main();
