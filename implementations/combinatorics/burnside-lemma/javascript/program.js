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

function eulerPhi(x) {
    let result = x;
    let remaining = x;
    let p = 2;
    while (p * p <= remaining) {
        if (remaining % p === 0) {
            while (remaining % p === 0) {
                remaining /= p;
            }
            result -= Math.floor(result / p);
        }
        p += p === 2 ? 1 : 2;
    }
    if (remaining > 1) {
        result -= Math.floor(result / remaining);
    }
    return result;
}

function term(d, n, k) {
    return (eulerPhi(d) * modPow(k, Math.floor(n / d))) % MODULO;
}

function main() {
    const data = readFileSync(0, "utf8").trim().split(/\s+/);
    if (data.length < 2 || data[0] === "") {
        return;
    }
    const n = Number(data[0]);
    const k = Number(data[1]);
    if (!Number.isInteger(n) || !Number.isInteger(k)) {
        return;
    }
    if (n < 1 || n > 1000000 || k < 1 || k > 1000000000) {
        return;
    }

    let total = 0;
    for (let i = 1; i * i <= n; i++) {
        if (n % i !== 0) {
            continue;
        }
        total = (total + term(i, n, k)) % MODULO;
        if (i !== n / i) {
            total = (total + term(n / i, n, k)) % MODULO;
        }
    }

    total = mulMod(total, modPow(n, MODULO - 2));
    process.stdout.write(total.toString() + "\n");
}

main();
