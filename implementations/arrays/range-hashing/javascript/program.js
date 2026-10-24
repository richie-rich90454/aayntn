// Educational reference implementation: JavaScript/Pascal is not a USACO submission language.

import { readFileSync } from "node:fs";

const BASE = 911382323n;
const MASK = (1n << 64n) - 1n;

const tokens = readFileSync(0, "utf8")
    .split(/\s+/)
    .filter((token) => token.length > 0);

if (tokens.length > 0) {
    let position = 0;
    const next = () => tokens[position++];

    const n = Number(next());
    const prefix = new Array(n + 1).fill(0n);
    const power = new Array(n + 1).fill(0n);
    power[0] = 1n;

    for (let i = 1; i <= n; i++) {
        const value = BigInt(next());
        prefix[i] = (prefix[i - 1] * BASE + value) & MASK;
        power[i] = (power[i - 1] * BASE) & MASK;
    }

    const q = Number(next());
    const output = [];
    for (let k = 0; k < q; k++) {
        const l1 = Number(next());
        const r1 = Number(next());
        const l2 = Number(next());
        const r2 = Number(next());

        if (r1 - l1 !== r2 - l2) {
            output.push("NO");
            continue;
        }

        const length = r1 - l1 + 1;
        const first = (prefix[r1] - prefix[l1 - 1] * power[length]) & MASK;
        const second = (prefix[r2] - prefix[l2 - 1] * power[length]) & MASK;
        output.push(first === second ? "YES" : "NO");
    }

    process.stdout.write(output.join("\n") + (output.length > 0 ? "\n" : ""));
}
