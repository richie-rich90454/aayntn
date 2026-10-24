// Educational reference implementation: JavaScript is not a USACO submission language.

/**
 * The discrete logarithm by baby-step giant-step.
 *
 * Input: q, then q lines holding a, b and m with gcd(a, m) = 1.
 * Output: the smallest non-negative x with a^x = b (mod m), or -1.
 */

"use strict";

function mulMod(a, b, m) {
    return (a * b) % m;
}

function powMod(base, exponent, modulus) {
    let result = 1n % modulus;
    let a = base % modulus;
    let e = exponent;
    while (e > 0n) {
        if ((e & 1n) === 1n) {
            result = mulMod(result, a, modulus);
        }
        a = mulMod(a, a, modulus);
        e >>= 1n;
    }
    return result;
}

function discreteLog(a, b, m) {
    if (b === 1n) {
        return 0n;
    }

    let n = 1n;
    while (n * n < m) {
        n += 1n;
    }

    // Baby steps: key b * a^q, keeping the largest q for a repeated key.
    const table = new Map();
    let cur = b % m;
    for (let q = 0n; q < n; q += 1n) {
        table.set(cur, q);
        cur = mulMod(cur, a, m);
    }

    // Giant steps: a^(p * n), matched against the baby-step keys.
    const stride = powMod(a, n, m);
    cur = 1n;
    for (let p = 1n; p <= n; p += 1n) {
        cur = mulMod(cur, stride, m);
        const q = table.get(cur);
        if (q !== undefined) {
            return p * n - q;
        }
    }

    return -1n;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const count = Number(tokens[0]);
    const out = [];
    let index = 1;
    for (let i = 0; i < count && index + 2 < tokens.length; i += 1) {
        const a = BigInt(tokens[index]);
        const b = BigInt(tokens[index + 1]);
        const m = BigInt(tokens[index + 2]);
        index += 3;
        out.push(`${discreteLog(a, b, m)}\n`);
    }
    process.stdout.write(out.join(""));
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
