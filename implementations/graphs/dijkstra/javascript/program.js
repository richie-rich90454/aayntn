"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Dijkstra's algorithm over an undirected weighted graph read from standard
 * input.
 *
 * Input: n m, then m lines u v w (0-based, undirected, nonnegative weight),
 * then the start vertex.
 * Output: the distance from the start vertex to every vertex, separated by
 * spaces, and -1 for the vertices the start cannot reach.
 */

/**
 * A binary min-heap of (distance, vertex) pairs ordered by distance.
 *
 * Ties are broken by the heap layout, which cannot change the result: the
 * shortest distance of a vertex is unique.
 */
class MinHeap {
    constructor() {
        this.entries = [];
    }

    /**
     * Adds an entry.
     *
     * @param {number} distance the distance of the vertex
     * @param {number} vertex the vertex
     */
    push(distance, vertex) {
        this.entries.push({ distance: distance, vertex: vertex });
        let index = this.entries.length - 1;
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (this.entries[parent].distance <= this.entries[index].distance) {
                break;
            }
            this.swap(parent, index);
            index = parent;
        }
    }

    /**
     * Removes and returns the smallest entry, or null when the heap is empty.
     *
     * @returns {?{distance: number, vertex: number}} the smallest entry
     */
    pop() {
        if (this.entries.length === 0) {
            return null;
        }
        const top = this.entries[0];
        const last = this.entries.pop();
        if (this.entries.length > 0) {
            this.entries[0] = last;
            let index = 0;
            for (;;) {
                let child = 2 * index + 1;
                if (child >= this.entries.length) {
                    break;
                }
                if (
                    child + 1 < this.entries.length &&
                    this.entries[child + 1].distance < this.entries[child].distance
                ) {
                    child += 1;
                }
                if (this.entries[index].distance <= this.entries[child].distance) {
                    break;
                }
                this.swap(index, child);
                index = child;
            }
        }
        return top;
    }

    /**
     * Exchanges two entries of the heap.
     *
     * @param {number} a the first position
     * @param {number} b the second position
     */
    swap(a, b) {
        const swap = this.entries[a];
        this.entries[a] = this.entries[b];
        this.entries[b] = swap;
    }
}

/**
 * Dijkstra's algorithm from source over a graph whose edge weights are all
 * nonnegative.
 *
 * @param {number[][]} adj adjacency list; adj[v] lists the (neighbour, weight)
 *   pairs of the edges incident to v
 * @param {number} source the start vertex
 * @returns {number[]} the distance from source to every vertex, -1 when
 *   unreachable
 */
function dijkstra(adj, source) {
    const distance = new Array(adj.length).fill(-1);
    if (source < 0 || source >= adj.length) {
        return distance;
    }

    const heap = new MinHeap();
    distance[source] = 0;
    heap.push(0, source);
    for (;;) {
        const top = heap.pop();
        if (top === null) {
            break;
        }
        if (top.distance !== distance[top.vertex]) {
            // A shorter path was found after this entry was pushed.
            continue;
        }
        for (const edge of adj[top.vertex]) {
            const candidate = top.distance + edge[1];
            if (distance[edge[0]] >= 0 && candidate >= distance[edge[0]]) {
                // The relaxation would not improve the distance.
                continue;
            }
            distance[edge[0]] = candidate;
            heap.push(candidate, edge[0]);
        }
    }
    return distance;
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

    const adj = [];
    for (let v = 0; v < n; v += 1) {
        adj.push([]);
    }

    let index = 2;
    for (let i = 0; i < m; i += 1) {
        if (index + 2 >= tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        const w = Number(tokens[index + 2]);
        index += 3;
        if (u < 0 || u >= n || v < 0 || v >= n || w < 0) {
            continue;
        }
        adj[u].push([v, w]);
        adj[v].push([u, w]);
    }
    const source = index < tokens.length ? Number(tokens[index]) : -1;

    const distance = dijkstra(adj, source);
    process.stdout.write(distance.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
