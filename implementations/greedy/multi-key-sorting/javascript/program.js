// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * The required order: a ascending, then b descending, then c ascending.
 * The keys are compared directly rather than subtracted, so the result is
 * always negative, zero or positive as Array.prototype.sort requires, and the
 * descending key is a reversed comparison rather than a negated value.
 *
 * @param {{a: number, b: number, c: number}} x
 * @param {{a: number, b: number, c: number}} y
 * @returns {number}
 */
function compareRecords(x, y) {
    if (x.a !== y.a) {
        return x.a < y.a ? -1 : 1;
    }
    if (x.b !== y.b) {
        return x.b > y.b ? -1 : 1;
    }
    if (x.c !== y.c) {
        return x.c < y.c ? -1 : 1;
    }
    return 0;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isFinite(n) || n <= 0 || tokens.length < 1 + 3 * n) {
        return;
    }

    const records = [];
    let index = 1;
    for (let i = 0; i < n; i += 1) {
        records.push({
            a: Number(tokens[index]),
            b: Number(tokens[index + 1]),
            c: Number(tokens[index + 2]),
        });
        index += 3;
    }

    records.sort(compareRecords);

    let out = "";
    for (const r of records) {
        out += `${r.a} ${r.b} ${r.c}\n`;
    }
    process.stdout.write(out);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
