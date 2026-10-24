// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Maximum-weight spanning forest by Kruskal's algorithm.
 *
 * Input: n, m, then m triples u v w describing an undirected edge of weight w.
 * Output: the total weight of a maximum-weight spanning forest.
 */

const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    let index = 0;
    const n = Number(tokens[index]);
    index += 1;
    const m = Number(tokens[index]);
    index += 1;
    if (n < 0 || m < 0) {
        return;
    }

    const edges = [];
    for (let k = 0; k < m; k += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]) - 1;
        index += 1;
        const v = Number(tokens[index]) - 1;
        index += 1;
        const weight = BigInt(tokens[index]);
        index += 1;
        edges.push({ u, v, weight });
    }

    if (n < 1) {
        process.stdout.write("0" + EOL);
        return;
    }

    edges.sort((a, b) => {
        if (a.weight === b.weight) {
            return 0;
        }
        return a.weight > b.weight ? -1 : 1;
    });

    const parent = new Array(n);
    const size = new Array(n);
    for (let k = 0; k < n; k += 1) {
        parent[k] = k;
        size[k] = 1;
    }

    const find = (start) => {
        let x = start;
        while (parent[x] !== x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    };

    const unite = (a, b) => {
        let ra = find(a);
        let rb = find(b);
        if (ra === rb) {
            return false;
        }
        if (size[ra] < size[rb]) {
            const temporary = ra;
            ra = rb;
            rb = temporary;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
        return true;
    };

    let total = 0n;
    for (const edge of edges) {
        if (unite(edge.u, edge.v)) {
            total += edge.weight;
        }
    }

    process.stdout.write(total.toString() + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
