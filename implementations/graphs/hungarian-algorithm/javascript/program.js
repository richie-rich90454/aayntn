// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * The Hungarian algorithm for the assignment problem.
 *
 * Input: n, then an n by n matrix of integer costs.
 * Output: the minimum total cost, then a 0-based permutation that assigns
 * each row to a column.
 */

const INFINITY = Number.MAX_SAFE_INTEGER / 4;

/**
 * @param {number[][]} cost the n by n cost matrix
 * @returns {{total: number, assignment: number[]}} the optimum and its columns
 */
function hungarian(cost) {
    const n = cost.length;
    const u = new Array(n + 1).fill(0);
    const v = new Array(n + 1).fill(0);
    const p = new Array(n + 1).fill(0);
    const way = new Array(n + 1).fill(0);

    // Row minima are feasible dual potentials for costs of either sign.
    for (let i = 1; i <= n; i += 1) {
        u[i] = cost[i - 1][0];
        for (let j = 1; j < n; j += 1) {
            if (cost[i - 1][j] < u[i]) {
                u[i] = cost[i - 1][j];
            }
        }
    }

    for (let i = 1; i <= n; i += 1) {
        p[0] = i;
        let j0 = 0;
        const minv = new Array(n + 1).fill(INFINITY);
        const used = new Array(n + 1).fill(false);
        for (;;) {
            used[j0] = true;
            const i0 = p[j0];
            let delta = INFINITY;
            let j1 = 0;
            for (let j = 1; j <= n; j += 1) {
                if (used[j]) {
                    continue;
                }
                const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
                if (cur < minv[j]) {
                    minv[j] = cur;
                    way[j] = j0;
                }
                if (minv[j] < delta) {
                    delta = minv[j];
                    j1 = j;
                }
            }
            for (let j = 0; j <= n; j += 1) {
                if (used[j]) {
                    u[p[j]] += delta;
                    v[j] -= delta;
                } else {
                    minv[j] -= delta;
                }
            }
            j0 = j1;
            if (p[j0] === 0) {
                break;
            }
        }
        while (j0 !== 0) {
            const j1 = way[j0];
            p[j0] = p[j1];
            j0 = j1;
        }
    }

    const assignment = new Array(n).fill(0);
    for (let j = 1; j <= n; j += 1) {
        assignment[p[j] - 1] = j - 1;
    }
    let total = 0;
    for (let i = 0; i < n; i += 1) {
        total += cost[i][assignment[i]];
    }
    return { total: total, assignment: assignment };
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }
    const n = Number(tokens[0]);
    if (n <= 0) {
        process.stdout.write("0\n\n");
        return;
    }

    const cost = [];
    let index = 1;
    for (let i = 0; i < n; i += 1) {
        const row = [];
        for (let j = 0; j < n; j += 1) {
            row.push(Number(tokens[index]));
            index += 1;
        }
        cost.push(row);
    }

    const result = hungarian(cost);
    process.stdout.write(result.total + "\n");
    process.stdout.write(result.assignment.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
