"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 *
 * Mo's algorithm over a static array, driven from standard input: n q, then n
 * signed integers, then q pairs "l r" with 1 <= l <= r <= n. The maintained
 * answer is the number of distinct values in the current window, and the
 * queries are answered in the order they appear in the input.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const q = Math.max(0, Number(tokens[1]));

    const values = [];
    for (let i = 0; i < n && 2 + i < tokens.length; i += 1) {
        values.push(Number(tokens[2 + i]));
    }
    while (values.length < n) {
        values.push(0);
    }

    const unique = Array.from(new Set(values)).sort((a, b) => a - b);
    const rankOf = new Map();
    unique.forEach((value, index) => {
        rankOf.set(value, index);
    });
    const rank = values.map((value) => rankOf.get(value));

    const block = Math.max(1, Math.floor(Math.sqrt(n)));

    const queries = [];
    let offset = 2 + n;
    for (let id = 0; id < q; id += 1) {
        if (offset + 1 >= tokens.length) {
            break;
        }
        const left = Number(tokens[offset]);
        const right = Number(tokens[offset + 1]);
        offset += 2;
        queries.push({
            left,
            right,
            id,
            block: Math.floor((left - 1) / block),
        });
    }

    queries.sort((x, y) => {
        if (x.block !== y.block) {
            return x.block - y.block;
        }
        if (x.block % 2 === 0) {
            return x.right - y.right;
        }
        return y.right - x.right;
    });

    const frequency = new Int32Array(unique.length);
    const answers = new Array(q).fill(0);
    let curLeft = 1;
    let curRight = 0;
    let distinct = 0;

    for (const query of queries) {
        while (curLeft > query.left) {
            curLeft -= 1;
            const value = rank[curLeft - 1];
            if (frequency[value] === 0) {
                distinct += 1;
            }
            frequency[value] += 1;
        }
        while (curRight < query.right) {
            curRight += 1;
            const value = rank[curRight - 1];
            if (frequency[value] === 0) {
                distinct += 1;
            }
            frequency[value] += 1;
        }
        while (curLeft < query.left) {
            const value = rank[curLeft - 1];
            frequency[value] -= 1;
            if (frequency[value] === 0) {
                distinct -= 1;
            }
            curLeft += 1;
        }
        while (curRight > query.right) {
            const value = rank[curRight - 1];
            frequency[value] -= 1;
            if (frequency[value] === 0) {
                distinct -= 1;
            }
            curRight -= 1;
        }

        answers[query.id] = distinct;
    }

    const lines = [];
    for (let i = 0; i < q; i += 1) {
        lines.push(String(answers[i]));
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
