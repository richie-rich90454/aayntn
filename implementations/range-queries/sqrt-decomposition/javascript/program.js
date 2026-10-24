"use strict";

/**
 * Square-root decomposition over a 1-indexed array, driven from standard input.
 *
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * An array cut into blocks of about sqrt(n) positions. sum[b] holds the total
 * of block b, so a point update changes one value and one block, while a range
 * query reads whole blocks in one step each and scans only the two partial
 * blocks at the ends.
 */
class SqrtDecomposition {
    /**
     * @param {number} n the number of positions, numbered from 1
     */
    constructor(n) {
        this.n = n;
        this.block = 1;
        while (this.block * this.block < n) {
            this.block += 1;
        }
        const blocks = Math.floor((n + this.block - 1) / this.block);
        this.value = new Array(n).fill(0);
        this.sum = new Array(blocks).fill(0);
    }

    /**
     * Adds delta to the value at the 1-based index.
     *
     * @param {number} index the 1-based position
     * @param {number} delta the amount to add
     */
    add(index, delta) {
        index -= 1;
        if (index >= 0 && index < this.n) {
            this.value[index] += delta;
            this.sum[Math.floor(index / this.block)] += delta;
        }
    }

    /**
     * The sum of the positions left..right, both inclusive.
     *
     * @param {number} left the first position of the range
     * @param {number} right the last position of the range
     * @returns {number} the range sum
     */
    rangeSum(left, right) {
        left -= 1;
        right -= 1;
        if (left < 0) {
            left = 0;
        }
        if (right >= this.n) {
            right = this.n - 1;
        }
        if (left > right) {
            return 0;
        }

        const firstFull = Math.floor((left + this.block - 1) / this.block);
        const lastFull = Math.floor((right + 1) / this.block) - 1;
        let total = 0;
        if (firstFull > lastFull) {
            for (let i = left; i <= right; i += 1) {
                total += this.value[i];
            }
            return total;
        }

        for (let i = left; i < firstFull * this.block; i += 1) {
            total += this.value[i];
        }
        for (let b = firstFull; b <= lastFull; b += 1) {
            total += this.sum[b];
        }
        for (let i = (lastFull + 1) * this.block; i <= right; i += 1) {
            total += this.value[i];
        }
        return total;
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
    const array = new SqrtDecomposition(n);

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
            array.add(first, second);
        } else {
            lines.push(String(array.rangeSum(first, second)));
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
