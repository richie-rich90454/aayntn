// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * The dominator tree of a directed graph, read from standard input.
 *
 * The algorithm is the iterative dataflow version of Cooper, Harvey and
 * Kennedy, not Lengauer-Tarjan. Vertices are visited in reverse postorder of a
 * depth-first search from the source, and the immediate dominator of a vertex
 * is the deepest common ancestor of its predecessors in the partially built
 * dominator tree. The passes repeat until no immediate dominator changes.
 *
 * Input: n m s, then m lines u v (0-based, directed).
 * Output: the immediate dominator of every vertex in index order. The source
 * prints 0, and a vertex the source cannot reach prints -1.
 */

/**
 * The deepest common ancestor of a and b in the partially built dominator
 * tree.
 *
 * order[v] is the position of v in the reverse postorder, so an ancestor
 * always has a smaller number than its descendants. The walk climbs the
 * vertex with the larger number until the two meet.
 *
 * @param {number} a the first vertex
 * @param {number} b the second vertex
 * @param {number[]} idom the current immediate dominators
 * @param {number[]} order the reverse-postorder positions
 * @returns {number} the deepest common ancestor
 */
function intersect(a, b, idom, order) {
    while (a !== b) {
        while (order[a] > order[b]) {
            a = idom[a];
        }
        while (order[b] > order[a]) {
            b = idom[b];
        }
    }
    return a;
}

/**
 * Computes the immediate dominator of every vertex.
 *
 * @param {number[][]} adj the successor lists
 * @param {number[][]} pred the predecessor lists
 * @param {number} source the start vertex
 * @returns {number[]} the immediate dominator of every vertex, -1 when
 *   unreachable and source for the source itself
 */
function immediateDominators(adj, pred, source) {
    const n = adj.length;
    const idom = new Array(n).fill(-1);
    if (source < 0 || source >= n) {
        return idom;
    }

    // Iterative depth-first search. A vertex enters the postorder when its
    // last successor has been examined, and the reverse of that order is the
    // order the dominator computation needs.
    const visited = new Array(n).fill(false);
    const nextEdge = new Array(n).fill(0);
    const postorder = [];
    const stack = [source];
    visited[source] = true;
    while (stack.length > 0) {
        const v = stack[stack.length - 1];
        if (nextEdge[v] < adj[v].length) {
            const w = adj[v][nextEdge[v]];
            nextEdge[v] += 1;
            if (!visited[w]) {
                visited[w] = true;
                stack.push(w);
            }
        } else {
            postorder.push(v);
            stack.pop();
        }
    }

    const rpo = postorder.reverse();
    const order = new Array(n).fill(-1);
    for (let i = 0; i < rpo.length; i += 1) {
        order[rpo[i]] = i;
    }

    idom[source] = source;
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 1; i < rpo.length; i += 1) {
            const v = rpo[i];
            let candidate = -1;
            for (const p of pred[v]) {
                if (idom[p] === -1) {
                    // The predecessor is not reachable from the source.
                    continue;
                }
                candidate = candidate === -1 ? p : intersect(p, candidate, idom, order);
            }
            if (candidate !== -1 && idom[v] !== candidate) {
                idom[v] = candidate;
                changed = true;
            }
        }
    }
    return idom;
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 3) {
        return;
    }

    const n = Number(tokens[0]);
    const m = Number(tokens[1]);
    const source = Number(tokens[2]);
    if (n <= 0) {
        process.stdout.write("\n");
        return;
    }

    const adj = [];
    const pred = [];
    for (let v = 0; v < n; v += 1) {
        adj.push([]);
        pred.push([]);
    }

    let index = 3;
    const limit = Math.max(0, m);
    for (let i = 0; i < limit; i += 1) {
        if (index + 2 > tokens.length) {
            break;
        }
        const u = Number(tokens[index]);
        const v = Number(tokens[index + 1]);
        index += 2;
        if (u < 0 || u >= n || v < 0 || v >= n) {
            continue;
        }
        adj[u].push(v);
        pred[v].push(u);
    }

    const idom = immediateDominators(adj, pred, source);
    const answer = new Array(n);
    for (let v = 0; v < n; v += 1) {
        if (v === source) {
            answer[v] = "0";
        } else {
            answer[v] = String(idom[v]);
        }
    }
    process.stdout.write(answer.join(" ") + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
