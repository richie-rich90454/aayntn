// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

function modPow(base, exponent, mod) {
    let result = 1n;
    base %= mod;
    while (exponent > 0n) {
        if ((exponent & 1n) === 1n) {
            result = (result * base) % mod;
        }
        base = (base * base) % mod;
        exponent >>= 1n;
    }
    return result;
}

function ntt(a, invert, mod) {
    const n = a.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        while ((j & bit) !== 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            const t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
    }

    for (let len = 2; len <= n; len <<= 1) {
        let wlen = modPow(3n, (mod - 1n) / BigInt(len), mod);
        if (invert) {
            wlen = modPow(wlen, mod - 2n, mod);
        }
        const half = len >> 1;
        for (let start = 0; start < n; start += len) {
            let w = 1n;
            for (let k = 0; k < half; k++) {
                const u = a[start + k];
                const v = (a[start + k + half] * w) % mod;
                a[start + k] = (u + v) % mod;
                a[start + k + half] = (u - v + mod) % mod;
                w = (w * wlen) % mod;
            }
        }
    }

    if (invert) {
        const invN = modPow(BigInt(n), mod - 2n, mod);
        for (let i = 0; i < n; i++) {
            a[i] = (a[i] * invN) % mod;
        }
    }
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 3) {
        return;
    }
    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    const mod = BigInt(tokens[2]);
    if (n <= 0 || m <= 0) {
        return;
    }

    const total = n + m - 1;
    let size = 1;
    while (size < total) {
        size <<= 1;
    }

    const a = new Array(size).fill(0n);
    const b = new Array(size).fill(0n);
    for (let i = 0; i < n; i++) {
        a[i] = BigInt(tokens[3 + i]) % mod;
    }
    for (let i = 0; i < m; i++) {
        b[i] = BigInt(tokens[3 + n + i]) % mod;
    }

    ntt(a, false, mod);
    ntt(b, false, mod);
    for (let i = 0; i < size; i++) {
        a[i] = (a[i] * b[i]) % mod;
    }
    ntt(a, true, mod);

    process.stdout.write(a.slice(0, total).map(String).join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
