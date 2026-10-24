// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * Li Chao tree over the query coordinates read from standard input.
 *
 * Input: q, then q lines of either 1 m b or 2 x.
 * Output: one line per 2 x operation, holding the minimum value at x over
 * every line inserted so far.
 */

/**
 * @param {bigint} m
 * @param {bigint} b
 * @param {bigint} x
 * @returns {bigint}
 */
function evaluate(m, b, x) {
    return m * x + b;
}

/**
 * @param {bigint[]} xs
 * @param {Array<bigint|null>} slope
 * @param {Array<bigint|null>} intercept
 */
function buildTree(xs, slope, intercept) {
    /**
     * @param {bigint} m
     * @param {bigint} b
     * @param {number} node
     * @param {number} left
     * @param {number} right
     */
    function addLine(m, b, node, left, right) {
        if (slope[node] === null) {
            slope[node] = m;
            intercept[node] = b;
            return;
        }

        const mid = left + ((right - left) >> 1);
        const betterLeft =
            evaluate(m, b, xs[left]) < evaluate(slope[node], intercept[node], xs[left]);
        const betterMid = evaluate(m, b, xs[mid]) < evaluate(slope[node], intercept[node], xs[mid]);

        if (betterMid) {
            const oldM = slope[node];
            const oldB = intercept[node];
            slope[node] = m;
            intercept[node] = b;
            m = oldM;
            b = oldB;
        }

        if (left === right) {
            return;
        }

        if (betterLeft !== betterMid) {
            addLine(m, b, node * 2, left, mid);
        } else {
            addLine(m, b, node * 2 + 1, mid + 1, right);
        }
    }

    /**
     * @param {number} index
     * @returns {bigint}
     */
    function query(index) {
        const x = xs[index];
        let node = 1;
        let left = 0;
        let right = xs.length - 1;
        let best = null;

        while (true) {
            if (slope[node] !== null) {
                const value = evaluate(slope[node], intercept[node], x);
                if (best === null || value < best) {
                    best = value;
                }
            }

            if (left === right) {
                break;
            }

            const mid = left + ((right - left) >> 1);
            if (index <= mid) {
                node *= 2;
                right = mid;
            } else {
                node = node * 2 + 1;
                left = mid + 1;
            }
        }

        return best;
    }

    return { addLine, query };
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let position = 0;
    const q = Number(tokens[position]);
    position += 1;

    const operations = [];
    const coordinates = [];
    for (let i = 0; i < q; i += 1) {
        const kind = Number(tokens[position]);
        position += 1;
        if (kind === 1) {
            const m = BigInt(tokens[position]);
            const b = BigInt(tokens[position + 1]);
            position += 2;
            operations.push({ kind: 1, m, b });
        } else {
            const x = BigInt(tokens[position]);
            position += 1;
            operations.push({ kind: 2, x });
            coordinates.push(x);
        }
    }

    const unique = Array.from(new Set(coordinates.map((value) => value.toString())))
        .map((value) => BigInt(value))
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    if (unique.length === 0) {
        return;
    }

    const rank = new Map();
    for (let i = 0; i < unique.length; i += 1) {
        rank.set(unique[i].toString(), i);
    }

    const slope = new Array(4 * unique.length).fill(null);
    const intercept = new Array(4 * unique.length).fill(null);
    const tree = buildTree(unique, slope, intercept);

    const answers = [];
    for (const operation of operations) {
        if (operation.kind === 1) {
            tree.addLine(operation.m, operation.b, 1, 0, unique.length - 1);
        } else {
            answers.push(String(tree.query(rank.get(operation.x.toString()))));
        }
    }

    if (answers.length > 0) {
        process.stdout.write(answers.join(EOL) + EOL);
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
