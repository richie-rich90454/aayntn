"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * A Fenwick tree (binary indexed tree) over a 1-indexed array: tree[i] holds
 * the sum of the positions in the block (i - lowbit(i), i], where lowbit(i) is
 * the largest power of two that divides i.
 */
class Fenwick {
    /**
     * @param {number} n the number of positions, numbered from 1
     */
    constructor(n) {
        this.n = n;
        this.tree = new Array(n + 1).fill(0);
    }

    /**
     * Adds delta to the value at the 1-based index.
     *
     * @param {number} index the 1-based position
     * @param {number} delta the amount to add
     */
    add(index, delta) {
        if (index < 1) {
            return;
        }
        // Stepping up by lowbit visits exactly the blocks that contain the index.
        let i = index;
        while (i <= this.n) {
            this.tree[i] += delta;
            i += i & -i;
        }
    }

    /**
     * The sum of the positions 1..index.
     *
     * @param {number} index the last position of the prefix
     * @returns {number} the prefix sum
     */
    prefixSum(index) {
        const last = Math.min(index, this.n);
        let total = 0;
        // Stepping down by lowbit visits disjoint blocks that partition 1..index.
        let i = last;
        while (i > 0) {
            total += this.tree[i];
            i -= i & -i;
        }
        return total;
    }

    /**
     * The sum of the positions left..right, both inclusive.
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @returns {number} the range sum
     */
    rangeSum(left, right) {
        return this.prefixSum(right) - this.prefixSum(left - 1);
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
    const tree = new Fenwick(n);

    const lines = [];
    let index = 2;
    for (let k = 0; k < q; k += 1) {
        if (index >= tokens.length) {
            break;
        }
        const kind = Number(tokens[index]);
        index += 1;
        if (kind !== 1 && kind !== 2) {
            break;
        }
        if (index + 1 >= tokens.length) {
            break;
        }
        const first = Number(tokens[index]);
        const second = Number(tokens[index + 1]);
        index += 2;
        if (kind === 1) {
            tree.add(first, second);
        } else {
            lines.push(String(tree.rangeSum(first, second)));
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
