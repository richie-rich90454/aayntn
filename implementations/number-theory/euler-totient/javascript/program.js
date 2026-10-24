// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * Euler's totient function driver.
 *
 * Reads n, m and a, then prints phi(n) on the first line and a^phi(m) mod m
 * on the second. The totient fits in a double, but the products inside the
 * power reach 10^18, so the power uses BigInt to stay exact.
 */

// The C, C++, Java and Pascal listings write the platform line ending, so
// JavaScript writes the same one and every language emits identical bytes.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

function phi(n) {
    let result = n;
    let rest = n;
    for (let p = 2; p * p <= rest; p += 1) {
        if (rest % p === 0) {
            while (rest % p === 0) {
                rest /= p;
            }
            result -= result / p;
        }
    }
    if (rest > 1) {
        result -= result / rest;
    }
    return result;
}

function modPow(base, exponent, modulus) {
    const m = BigInt(modulus);
    let result = 1n % m;
    let square = BigInt(base) % m;
    let remaining = BigInt(exponent);

    while (remaining > 0n) {
        if ((remaining & 1n) === 1n) {
            result = (result * square) % m;
        }
        square = (square * square) % m;
        remaining >>= 1n;
    }
    return result;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 3) {
        return;
    }

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    const a = Number(tokens[2]);
    const answer = modPow(a, phi(m), m);

    process.stdout.write(String(phi(n)) + EOL + answer.toString() + EOL);
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
