"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
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
 * The heap holds (distance, vertex) pairs and an entry is never removed from
 * the middle of the heap: a shorter path to a vertex pushes a second entry and
 * the stale one is discarded when it surfaces. That replaces a decrease-key
 * operation by at most one extra entry per successful relaxation, so the heap
 * holds O(E) entries.
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

// Self-check only: the function above is the reusable part, so this file
// asserts the documented contract instead of reading input.
const graph = [
    [
        [1, 4],
        [2, 2],
    ],
    [
        [0, 4],
        [2, 1],
    ],
    [
        [0, 2],
        [1, 1],
        [3, 8],
    ],
    [[2, 8]],
    [],
];

const distance = dijkstra(graph, 0);
if (distance.join(" ") !== "0 3 2 10 -1") {
    throw new Error("dijkstra contract broken");
}
// The start vertex is the only one reachable from an isolated vertex.
if (dijkstra(graph, 4).join(" ") !== "-1 -1 -1 -1 0") {
    throw new Error("dijkstra contract broken");
}
// A start vertex outside the graph leaves every distance unknown.
if (dijkstra(graph, 5).join(" ") !== "-1 -1 -1 -1 -1") {
    throw new Error("dijkstra contract broken");
}
