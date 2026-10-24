// Educational reference implementation: JavaScript is not a USACO submission language.
//
// String hashing of subsequences.
//
// Input: one string s, a query count q, and q pairs of 0-based indices.
// Output: SAME when deleting s[i] and deleting s[j] leave the same string,
// DIFFERENT otherwise.
//
// The hash of the string with s[i] deleted is the hash of the prefix before i
// shifted by the length of the remaining suffix, plus the hash of the suffix
// after i. Both pieces come from tables built once, so a query is constant
// time.
//
// The modulus is small enough that the square of a residue stays below 2^53,
// so every product is an exact integer in a JavaScript Number. A larger
// modulus would need BigInt.

"use strict";

const BASE = 8000011;
const MOD = 90000049;

function main(input) {
    const tokens = input.split(/\s+/);
    if (tokens.length < 2 || tokens[0] === "") {
        return;
    }

    const s = tokens[0];
    const n = s.length;
    const power = new Float64Array(n + 1);
    const prefix = new Float64Array(n + 1);
    const suffix = new Float64Array(n + 1);

    power[0] = 1;
    for (let i = 1; i <= n; i += 1) {
        power[i] = (power[i - 1] * BASE) % MOD;
    }
    for (let i = 0; i < n; i += 1) {
        prefix[i + 1] = (prefix[i] * BASE + (s.charCodeAt(i) - 96)) % MOD;
    }
    for (let i = n - 1; i >= 0; i -= 1) {
        suffix[i] = ((s.charCodeAt(i) - 96) * power[n - 1 - i] + suffix[i + 1]) % MOD;
    }

    const q = Number(tokens[1]);
    let at = 2;
    const out = [];
    for (let query = 0; query < q; query += 1) {
        const i = Number(tokens[at]);
        const j = Number(tokens[at + 1]);
        at += 2;
        const di = (prefix[i] * power[n - 1 - i] + suffix[i + 1]) % MOD;
        const dj = (prefix[j] * power[n - 1 - j] + suffix[j + 1]) % MOD;
        out.push(di === dj ? "SAME" : "DIFFERENT");
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
