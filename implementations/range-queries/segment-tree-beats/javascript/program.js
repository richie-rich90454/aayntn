// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

const NONE = -1;

/**
 * Segment tree beats over a 1-indexed array, supporting range chmin and range
 * sum queries.
 *
 * Every node stores its sum, its largest value, the second largest distinct
 * value, and how many positions hold the largest value. A chmin that lands
 * strictly between the two largest values changes only the largest group, so
 * the node can absorb it in constant time; anything deeper has to descend.
 */
class SegmentTreeBeats {
    /**
     * @param {number[]} values the array, indexed from 1
     */
    constructor(values) {
        this.n = values.length - 1;
        const size = 4 * this.n + 4;
        this.total = new Array(size).fill(0);
        this.max1 = new Array(size).fill(0);
        this.max2 = new Array(size).fill(NONE);
        this.count = new Array(size).fill(0);
        if (this.n > 0) {
            this.build(1, 1, this.n, values);
        }
    }

    static max64(a, b) {
        return a > b ? a : b;
    }

    pull(node) {
        const left = node * 2;
        const right = left + 1;
        this.total[node] = this.total[left] + this.total[right];
        if (this.max1[left] === this.max1[right]) {
            this.max1[node] = this.max1[left];
            this.count[node] = this.count[left] + this.count[right];
            this.max2[node] = SegmentTreeBeats.max64(this.max2[left], this.max2[right]);
        } else if (this.max1[left] > this.max1[right]) {
            this.max1[node] = this.max1[left];
            this.count[node] = this.count[left];
            this.max2[node] = SegmentTreeBeats.max64(this.max2[left], this.max1[right]);
        } else {
            this.max1[node] = this.max1[right];
            this.count[node] = this.count[right];
            this.max2[node] = SegmentTreeBeats.max64(this.max1[left], this.max2[right]);
        }
    }

    /**
     * Caps the node's maximum at x. The caller guarantees max2 < x < max1, so
     * exactly the positions holding the maximum change.
     *
     * @param {number} node the node index
     * @param {number} x the new upper bound
     */
    applyCap(node, x) {
        if (this.max1[node] <= x) {
            return;
        }
        this.total[node] -= (this.max1[node] - x) * this.count[node];
        this.max1[node] = x;
    }

    /**
     * Passes a cap that is already included in the node's aggregates down to
     * its two children. The child's second maximum is at most the parent's
     * second maximum, which the stored cap exceeded, so the child absorbs it
     * at once.
     *
     * @param {number} node the node index
     */
    push(node) {
        this.applyCap(node * 2, this.max1[node]);
        this.applyCap(node * 2 + 1, this.max1[node]);
    }

    build(node, lo, hi, values) {
        if (lo === hi) {
            this.total[node] = values[lo];
            this.max1[node] = values[lo];
            this.max2[node] = NONE;
            this.count[node] = 1;
            return;
        }
        const mid = lo + Math.floor((hi - lo) / 2);
        this.build(node * 2, lo, mid, values);
        this.build(node * 2 + 1, mid + 1, hi, values);
        this.pull(node);
    }

    chmin(node, lo, hi, left, right, x) {
        if (right < lo || hi < left || this.max1[node] <= x) {
            return;
        }
        if (left <= lo && hi <= right && this.max2[node] < x) {
            this.applyCap(node, x);
            return;
        }
        if (lo === hi) {
            this.applyCap(node, x);
            return;
        }
        this.push(node);
        const mid = lo + Math.floor((hi - lo) / 2);
        this.chmin(node * 2, lo, mid, left, right, x);
        this.chmin(node * 2 + 1, mid + 1, hi, left, right, x);
        this.pull(node);
    }

    query(node, lo, hi, left, right) {
        if (right < lo || hi < left) {
            return 0;
        }
        if (left <= lo && hi <= right) {
            return this.total[node];
        }
        this.push(node);
        const mid = lo + Math.floor((hi - lo) / 2);
        return (
            this.query(node * 2, lo, mid, left, right) +
            this.query(node * 2 + 1, mid + 1, hi, left, right)
        );
    }

    rangeChmin(left, right, x) {
        if (this.n > 0) {
            this.chmin(1, 1, this.n, left, right, x);
        }
    }

    rangeSum(left, right) {
        if (this.n === 0) {
            return 0;
        }
        return this.query(1, 1, this.n, left, right);
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
    if (n === 0) {
        return;
    }

    const values = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i += 1) {
        values[i] = Number(tokens[1 + i]);
    }
    const tree = new SegmentTreeBeats(values);

    const lines = [];
    let index = 2 + n;
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
            const x = Number(tokens[index + 2]);
            index += 3;
            tree.rangeChmin(left, right, x);
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
