// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Nearest-neighbor queries on a static two-dimensional point set.
 *
 * Input: n, then n points, then q, then q query points. Output: for each query,
 * the 1-based index of the nearest input point by squared Euclidean distance,
 * with ties broken by the lowest index.
 *
 * The tree splits alternately on x and y at the median, so every subtree is a
 * rectangle and the recursion has depth O(log n).
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let at = 0;
    const n = Number(tokens[at]);
    at += 1;
    if (!(n > 0)) {
        return;
    }

    const xs = new Array(n);
    const ys = new Array(n);
    for (let i = 0; i < n; i += 1) {
        xs[i] = Number(tokens[at]);
        ys[i] = Number(tokens[at + 1]);
        at += 2;
    }

    const q = Number(tokens[at]);
    at += 1;

    const order = Array.from({ length: n }, (_, index) => index);
    const left = new Int32Array(n).fill(-1);
    const right = new Int32Array(n).fill(-1);

    function build(lo, hi, depth) {
        if (lo >= hi) {
            return -1;
        }
        const axis = depth & 1;
        const segment = order.slice(lo, hi);
        segment.sort((a, b) => {
            const va = axis === 0 ? xs[a] : ys[a];
            const vb = axis === 0 ? xs[b] : ys[b];
            if (va !== vb) {
                return va - vb;
            }
            return a - b;
        });
        for (let i = 0; i < segment.length; i += 1) {
            order[lo + i] = segment[i];
        }

        const mid = lo + ((hi - lo) >> 1);
        const node = order[mid];
        left[node] = build(lo, mid, depth + 1);
        right[node] = build(mid + 1, hi, depth + 1);
        return node;
    }

    const root = build(0, n, 0);

    let bestDist = 0;
    let bestIndex = -1;

    function nearest(node, qx, qy, depth) {
        if (node < 0) {
            return;
        }
        const dx = xs[node] - qx;
        const dy = ys[node] - qy;
        const d = dx * dx + dy * dy;
        if (bestIndex < 0 || d < bestDist || (d === bestDist && node < bestIndex)) {
            bestDist = d;
            bestIndex = node;
        }

        const axis = depth & 1;
        const delta = axis === 0 ? qx - xs[node] : qy - ys[node];
        const nearChild = delta <= 0 ? left[node] : right[node];
        const farChild = delta <= 0 ? right[node] : left[node];

        nearest(nearChild, qx, qy, depth + 1);
        // Equality is not pruned: a point at the same distance can have a lower index.
        if (delta * delta <= bestDist) {
            nearest(farChild, qx, qy, depth + 1);
        }
    }

    const out = [];
    for (let i = 0; i < q; i += 1) {
        const qx = Number(tokens[at]);
        const qy = Number(tokens[at + 1]);
        at += 2;
        bestDist = 0;
        bestIndex = -1;
        nearest(root, qx, qy, 0);
        out.push(String(bestIndex + 1));
    }

    if (out.length > 0) {
        process.stdout.write(out.join(EOL) + EOL);
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
