// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * A merge sort tree over a static array.
 *
 * Every node of a segment tree stores the sorted values of its interval, and a
 * rank query binary searches the O(log n) nodes that partition the requested
 * range.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * The sorted merge of two sorted lists, the merge sort step of the tree.
 *
 * @param {number[]} left
 * @param {number[]} right
 * @returns {number[]}
 */
function merge(left, right) {
    const merged = new Array(left.length + right.length);
    let i = 0;
    let j = 0;
    let k = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            merged[k] = left[i];
            i += 1;
        } else {
            merged[k] = right[j];
            j += 1;
        }
        k += 1;
    }
    while (i < left.length) {
        merged[k] = left[i];
        i += 1;
        k += 1;
    }
    while (j < right.length) {
        merged[k] = right[j];
        j += 1;
        k += 1;
    }
    return merged;
}

/**
 * The number of values in the sorted list that are at most limit.
 *
 * @param {number[]} values
 * @param {number} limit
 * @returns {number}
 */
function upperBound(values, limit) {
    let low = 0;
    let high = values.length;
    while (low < high) {
        const middle = low + ((high - low) >> 1);
        if (values[middle] <= limit) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

/**
 * The number of positions in [left, right) whose value is at most limit.
 *
 * @param {(number[] | null)[]} tree
 * @param {number} size
 * @param {number} left
 * @param {number} right
 * @param {number} limit
 * @returns {number}
 */
function countAtMost(tree, size, left, right, limit) {
    let total = 0;
    let l = left + size;
    let r = right + size;
    while (l < r) {
        if ((l & 1) !== 0) {
            total += upperBound(tree[l], limit);
            l += 1;
        }
        if ((r & 1) !== 0) {
            r -= 1;
            total += upperBound(tree[r], limit);
        }
        l >>= 1;
        r >>= 1;
    }
    return total;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Number(tokens[0]);
    const q = Number(tokens[1]);
    if (n <= 0) {
        return;
    }

    const values = tokens.slice(2, 2 + n).map(Number);

    let size = 1;
    while (size < n) {
        size *= 2;
    }

    const tree = new Array(2 * size).fill(null);
    for (let i = 0; i < n; i += 1) {
        tree[size + i] = [values[i]];
    }
    for (let i = size - 1; i >= 1; i -= 1) {
        const left = tree[2 * i];
        const right = tree[2 * i + 1];
        if (left === null) {
            tree[i] = right;
        } else if (right === null) {
            tree[i] = left;
        } else {
            tree[i] = merge(left, right);
        }
    }

    let minimum = values[0];
    let maximum = values[0];
    for (let i = 1; i < n; i += 1) {
        if (values[i] < minimum) {
            minimum = values[i];
        }
        if (values[i] > maximum) {
            maximum = values[i];
        }
    }

    const lines = [];
    let index = 2 + n;
    for (let query = 0; query < q; query += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const left = Number(tokens[index]) - 1;
        const right = Number(tokens[index + 1]);
        const k = Number(tokens[index + 2]);
        index += 3;

        // The least value whose rank in the range reaches k is the k-th
        // smallest, and the rank is monotone in the value.
        let low = minimum;
        let high = maximum;
        while (low < high) {
            const middle = low + Math.floor((high - low) / 2);
            if (countAtMost(tree, size, left, right, middle) >= k) {
                high = middle;
            } else {
                low = middle + 1;
            }
        }
        lines.push(String(low));
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
