// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Nearest-site queries on a static set of points.
 *
 * The program answers the defining query directly and does not build the full
 * Voronoi diagram. Input: n and q, then n points, then q query points. Output:
 * for each query, the 1-based index of the nearest point by squared Euclidean
 * distance, with ties broken by the lowest index.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let at = 0;
    const n = Number(tokens[at]);
    const q = Number(tokens[at + 1]);
    at += 2;
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

    const out = [];
    for (let k = 0; k < q; k += 1) {
        if (at + 1 >= tokens.length) {
            break;
        }
        const qx = Number(tokens[at]);
        const qy = Number(tokens[at + 1]);
        at += 2;

        let best = 0;
        let bestIndex = -1;
        for (let i = 0; i < n; i += 1) {
            const dx = xs[i] - qx;
            const dy = ys[i] - qy;
            const d = dx * dx + dy * dy;
            if (bestIndex < 0 || d < best || (d === best && i < bestIndex)) {
                best = d;
                bestIndex = i;
            }
        }
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
