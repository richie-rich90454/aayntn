"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 *
 * Floyd-Warshall over a directed weighted graph read from standard input.
 *
 * Input: n m, then m lines u v w (0-based, directed, integer weight). The
 * input ends after the edges.
 * Output: n lines of n integers, where the j-th number of the i-th line is the
 * shortest distance from i to j, and -1 when j is unreachable from i. A graph
 * with a negative cycle prints the single line "negative cycle" instead.
 */

/**
 * @param {number[]} distance the flat n by n matrix, modified in place
 * @param {number} n the number of vertices
 */
function floydWarshall(distance, n) {
    for (let k = 0; k < n; k += 1) {
        const rowK = k * n;
        for (let i = 0; i < n; i += 1) {
            const rowI = i * n;
            const through = distance[rowI + k];
            if (through === Number.POSITIVE_INFINITY) {
                continue;
            }
            for (let j = 0; j < n; j += 1) {
                const rest = distance[rowK + j];
                if (rest === Number.POSITIVE_INFINITY) {
                    continue;
                }
                const candidate = through + rest;
                if (candidate < distance[rowI + j]) {
                    distance[rowI + j] = candidate;
                }
            }
        }
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

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    if (n <= 0) {
        process.stdout.write("\n");
        return;
    }

    const distance = new Array(n * n).fill(Number.POSITIVE_INFINITY);
    for (let v = 0; v < n; v += 1) {
        distance[v * n + v] = 0;
    }

    let index = 2;
    for (let e = 0; e < m; e += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        const w = Number(tokens[index + 2]);
        index += 3;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        if (w < distance[u * n + v]) {
            // Parallel edges are allowed, and only the cheaper one matters.
            distance[u * n + v] = w;
        }
    }

    floydWarshall(distance, n);

    for (let v = 0; v < n; v += 1) {
        if (distance[v * n + v] < 0) {
            process.stdout.write("negative cycle\n");
            return;
        }
    }

    const lines = [];
    for (let i = 0; i < n; i += 1) {
        const row = [];
        for (let j = 0; j < n; j += 1) {
            const value = distance[i * n + j];
            row.push(value === Number.POSITIVE_INFINITY ? -1 : value);
        }
        lines.push(row.join(" "));
    }
    process.stdout.write(lines.join("\n") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
