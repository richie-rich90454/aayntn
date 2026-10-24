// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Persistent segment tree over the compressed values of a static array.
 *
 * Version i is the frequency tree of a[0..i), built from version i - 1 by
 * copying only the root-to-leaf path of the inserted value. The difference
 * between version r and version l - 1 is the frequency tree of a[l-1..r), so
 * one descent that subtracts the two left counts returns the k-th smallest.
 *
 * Input: n q, then the n values, then q lines "l r k" with 1-based inclusive
 * bounds. Output: one line per query, holding the k-th smallest value in
 * a[l..r].
 */

// Matching the other five languages, whose text streams use the platform
// separator, keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/** The first index in values whose element is at least key. */
function lowerBound(values, key) {
    let low = 0;
    let high = values.length;
    while (low < high) {
        const middle = low + ((high - low) >> 1);
        if (values[middle] < key) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
}

function main(input) {
    const text = input.trim();
    if (text.length === 0) {
        return;
    }
    const data = text.split(/\s+/).map(Number);
    let cursor = 0;
    const n = data[cursor];
    cursor += 1;
    const q = data[cursor];
    cursor += 1;
    if (n <= 0) {
        return;
    }

    const values = data.slice(cursor, cursor + n);
    cursor += n;

    const ordered = Array.from(new Set(values)).sort((a, b) => a - b);
    const m = ordered.length;
    const depth = m <= 1 ? 0 : Math.ceil(Math.log2(m));
    const capacity = (n + 1) * (depth + 2) + 1;

    const leftChild = new Int32Array(capacity);
    const rightChild = new Int32Array(capacity);
    const count = new Int32Array(capacity);
    let nodes = 0;

    /**
     * Copy the path to position and increment every count on it. Node 0 is the
     * empty node, so previous === 0 needs no special case.
     */
    function update(previous, low, high, position) {
        nodes += 1;
        const node = nodes;
        leftChild[node] = leftChild[previous];
        rightChild[node] = rightChild[previous];
        count[node] = count[previous] + 1;
        if (low < high) {
            const middle = low + ((high - low) >> 1);
            if (position <= middle) {
                leftChild[node] = update(leftChild[previous], low, middle, position);
            } else {
                rightChild[node] = update(rightChild[previous], middle + 1, high, position);
            }
        }
        return node;
    }

    const roots = new Int32Array(n + 1);
    for (let i = 1; i <= n; i += 1) {
        const position = lowerBound(ordered, values[i - 1]) + 1;
        roots[i] = update(roots[i - 1], 1, m, position);
    }

    const lines = [];
    for (let query = 0; query < q; query += 1) {
        const left = data[cursor];
        cursor += 1;
        const right = data[cursor];
        cursor += 1;
        let k = data[cursor];
        cursor += 1;

        let before = roots[left - 1];
        let after = roots[right];
        let low = 1;
        let high = m;
        while (low < high) {
            const middle = low + ((high - low) >> 1);
            const inLeft = count[leftChild[after]] - count[leftChild[before]];
            if (k <= inLeft) {
                before = leftChild[before];
                after = leftChild[after];
                high = middle;
            } else {
                k -= inLeft;
                before = rightChild[before];
                after = rightChild[after];
                low = middle + 1;
            }
        }
        lines.push(String(ordered[low - 1]));
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
