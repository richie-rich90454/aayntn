/**
 * Educational reference implementation: JavaScript is not a USACO submission language.
 *
 * Input: t, then t non-negative integers below 2^63.
 * Output: one line per integer, holding PRIME or COMPOSITE.
 */

"use strict";

const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

function powMod(base, exponent, modulus) {
    let result = 1n % modulus;
    let a = base % modulus;
    let e = exponent;
    while (e > 0n) {
        if ((e & 1n) === 1n) {
            result = (result * a) % modulus;
        }
        a = (a * a) % modulus;
        e >>= 1n;
    }
    return result;
}

function isPrime(n) {
    if (n < 2n) {
        return false;
    }

    // Small factors are cheap, and they leave n > 37 and coprime to every base.
    for (const p of BASES) {
        if (n % p === 0n) {
            return n === p;
        }
    }

    // Write n - 1 as 2^s * d with d odd.
    let d = n - 1n;
    let s = 0;
    while ((d & 1n) === 0n) {
        d >>= 1n;
        s += 1;
    }

    for (const a of BASES) {
        let x = powMod(a, d, n);
        if (x === 1n || x === n - 1n) {
            continue;
        }
        let passed = false;
        for (let r = 1; r < s; r += 1) {
            x = (x * x) % n;
            if (x === n - 1n) {
                passed = true;
                break;
            }
        }
        if (!passed) {
            return false;
        }
    }
    return true;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const count = Number(tokens[0]);
    const out = [];
    for (let i = 0; i < count && i + 1 < tokens.length; i += 1) {
        const value = BigInt(tokens[i + 1]);
        out.push(isPrime(value) ? "PRIME\n" : "COMPOSITE\n");
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
