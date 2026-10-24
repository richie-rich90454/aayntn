"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language, and its numbers are exact only below 2^53.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * A lazy segment tree over a 1-indexed array, supporting range addition and
 * range sum queries.
 *
 * tree[node] holds the sum of the node's range, and lazy[node] holds the
 * addition that has already been applied to tree[node] but not yet to its
 * children.
 */
class LazySum {
    /**
     * @param {number} n the number of positions, numbered from 1
     */
    constructor(n) {
        this.n = n;
        this.tree = new Array(4 * n + 4).fill(0);
        this.lazy = new Array(4 * n + 4).fill(0);
    }

    /**
     * Applies delta to every position in the node's range [lo, hi].
     *
     * @param {number} node the node index
     * @param {number} lo the first position of the node's range
     * @param {number} hi the last position of the node's range
     * @param {number} delta the amount to add
     */
    apply(node, lo, hi, delta) {
        this.tree[node] += delta * (hi - lo + 1);
        this.lazy[node] += delta;
    }

    /**
     * Pushes the node's pending addition to its two children.
     *
     * @param {number} node the node index
     * @param {number} lo the first position of the node's range
     * @param {number} hi the last position of the node's range
     */
    push(node, lo, hi) {
        if (this.lazy[node] === 0 || lo === hi) {
            return;
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        this.apply(node * 2, lo, mid, this.lazy[node]);
        this.apply(node * 2 + 1, mid + 1, hi, this.lazy[node]);
        this.lazy[node] = 0;
    }

    add(node, lo, hi, left, right, delta) {
        if (right < lo || hi < left) {
            return;
        }
        if (left <= lo && hi <= right) {
            this.apply(node, lo, hi, delta);
            return;
        }
        this.push(node, lo, hi);
        const mid = lo + Math.floor((hi - lo) / 2);
        this.add(node * 2, lo, mid, left, right, delta);
        this.add(node * 2 + 1, mid + 1, hi, left, right, delta);
        this.tree[node] = this.tree[node * 2] + this.tree[node * 2 + 1];
    }

    sum(node, lo, hi, left, right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return this.tree[node];
        }
        this.push(node, lo, hi);
        const mid = lo + Math.floor((hi - lo) / 2);
        return (
            this.sum(node * 2, lo, mid, left, right) +
            this.sum(node * 2 + 1, mid + 1, hi, left, right)
        );
    }

    /**
     * Adds delta to every position in the inclusive range [left, right].
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @param {number} delta the amount to add
     */
    rangeAdd(left, right, delta) {
        if (this.n > 0) {
            this.add(1, 1, this.n, left, right, delta);
        }
    }

    /**
     * The sum of the inclusive range [left, right].
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @returns {number} the range sum
     */
    rangeSum(left, right) {
        if (this.n === 0) {
            return 0;
        }
        return this.sum(1, 1, this.n, left, right);
    }
}

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
    const tree = new LazySum(n);

    const lines = [];
    let index = 2;
    for (let k = 0; k < q; k += 1) {
        if (index >= tokens.length) {
            break;
        }
        const kind = Number(tokens[index]);
        index += 1;
        if (kind === 1) {
            if (index + 2 >= tokens.length) {
                break;
            }
            const left = Number(tokens[index]);
            const right = Number(tokens[index + 1]);
            const delta = Number(tokens[index + 2]);
            index += 3;
            tree.rangeAdd(left, right, delta);
        } else if (kind === 2) {
            if (index + 1 >= tokens.length) {
                break;
            }
            const left = Number(tokens[index]);
            const right = Number(tokens[index + 1]);
            index += 2;
            lines.push(String(tree.rangeSum(left, right)));
        } else {
            break;
        }
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
