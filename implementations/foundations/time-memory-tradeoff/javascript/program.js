// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 1) {
        return;
    }

    let index = 0;
    const n = Number(tokens[index++]);
    if (n < 1) {
        return;
    }

    const inside = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i += 1) {
        inside[i] = Number(tokens[index++]);
    }

    let block = 1;
    while ((block + 1) * (block + 1) <= n) {
        block += 1;
    }
    const blocks = Math.ceil(n / block);
    const base = new Array(blocks + 1).fill(0);

    let total = 0;
    for (let b = 0; b < blocks; b += 1) {
        base[b] = total;
        let run = 0;
        const start = b * block + 1;
        const end = Math.min(n, start + block - 1);
        for (let i = start; i <= end; i += 1) {
            run += inside[i];
            inside[i] = run;
        }
        total += run;
    }
    base[blocks] = total;

    const q = Number(tokens[index++]);
    const lines = [];
    for (let k = 0; k < q; k += 1) {
        const left = Number(tokens[index++]);
        const right = Number(tokens[index++]);
        const prefixRight = right === 0 ? 0 : base[Math.floor((right - 1) / block)] + inside[right];
        const before = left - 1;
        const prefixLeft =
            before === 0 ? 0 : base[Math.floor((before - 1) / block)] + inside[before];
        lines.push(String(prefixRight - prefixLeft));
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join(EOL) + EOL);
    }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
