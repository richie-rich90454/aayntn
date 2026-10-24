// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

import { readFileSync } from "node:fs";

const MODULO = 1000000007;

function mulMod(a, b) {
    let accumulated = 0;
    a %= MODULO;
    while (b > 0) {
        if (b % 2 === 1) {
            accumulated = (accumulated + a) % MODULO;
        }
        a = (a * 2) % MODULO;
        b = Math.floor(b / 2);
    }
    return accumulated;
}

function modPow(base, exponent) {
    let accumulated = 1;
    base %= MODULO;
    while (exponent > 0) {
        if (exponent % 2 === 1) {
            accumulated = mulMod(accumulated, base);
        }
        base = mulMod(base, base);
        exponent = Math.floor(exponent / 2);
    }
    return accumulated;
}

function binomial(n, k) {
    if (k < 0 || k > n) {
        return 0;
    }
    if (k > n - k) {
        k = n - k;
    }
    let numerator = 1;
    let denominator = 1;
    for (let i = 0; i < k; i++) {
        numerator = (numerator * (n - i)) % MODULO;
        denominator = (denominator * (i + 1)) % MODULO;
    }
    return mulMod(numerator, modPow(denominator, MODULO - 2));
}

function main() {
    const tokens = readFileSync(0, "utf8").trim().split(/\s+/);
    if (tokens.length === 0 || tokens[0] === "") {
        return;
    }
    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n < 0 || n > 1000000) {
        return;
    }

    const total = binomial(2 * n, n);
    const bad = binomial(2 * n, n - 1);
    process.stdout.write(((total - bad + MODULO) % MODULO).toString() + "\n");
}

main();
