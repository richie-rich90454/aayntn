// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Input: n m s t, then m undirected edges u v.
 * Output: one line holding the shortest distance and the total expansions.
 */

import { readFileSync } from "node:fs";

function main() {
    const text = readFileSync(0, "utf8").trim();
    if (text.length === 0) {
        return;
    }
    const data = text.split(/\s+/).map(Number);
    if (data.length < 4) {
        return;
    }
    const n = data[0];
    const m = data[1];
    const start = data[2];
    const target = data[3];

    const adjacency = Array.from({ length: n + 1 }, () => []);
    let position = 4;
    for (let i = 0; i < m; i++) {
        const u = data[position];
        const v = data[position + 1];
        position += 2;
        adjacency[u].push(v);
        adjacency[v].push(u);
    }

    const onPath = new Uint8Array(n + 1);
    let expanded = 0;

    function depthLimitedSearch(vertex, depth, limit) {
        onPath[vertex] = 1;
        expanded += 1;
        if (vertex === target) {
            return true;
        }
        if (depth === limit) {
            onPath[vertex] = 0;
            return false;
        }
        for (const neighbor of adjacency[vertex]) {
            if (onPath[neighbor] === 0 && depthLimitedSearch(neighbor, depth + 1, limit)) {
                return true;
            }
        }
        onPath[vertex] = 0;
        return false;
    }

    let answer = -1;
    for (let limit = 0; limit < n; limit++) {
        onPath.fill(0);
        if (depthLimitedSearch(start, 0, limit)) {
            answer = limit;
            break;
        }
    }

    console.log(`${answer} ${expanded}`);
}

main();
