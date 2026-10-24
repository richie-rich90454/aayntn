// Educational reference implementation: JavaScript is not a USACO submission language.

"use strict";

/**
 * Dynamic trees (link-cut trees): link, cut, and path sums on a forest.
 *
 * The vertices are 0-based on the input and 1-based inside the splay forest,
 * so index 0 is the null node. Vertex v carries the value v + 1, which makes
 * the answer the sum of the labels of the vertices on the path.
 */

const childLeft = [];
const childRight = [];
const parent = [];
const reversedFlag = [];
const stack = [];
const value = [];
const total = [];

function isAuxRoot(x) {
    const p = parent[x];
    return p === 0 || (childLeft[p] !== x && childRight[p] !== x);
}

function pull(x) {
    total[x] = total[childLeft[x]] + total[childRight[x]] + value[x];
}

function applyReverse(x) {
    if (x === 0) {
        return;
    }
    const swap = childLeft[x];
    childLeft[x] = childRight[x];
    childRight[x] = swap;
    reversedFlag[x] ^= 1;
}

function push(x) {
    if (reversedFlag[x] === 0) {
        return;
    }
    applyReverse(childLeft[x]);
    applyReverse(childRight[x]);
    reversedFlag[x] = 0;
}

function pushPath(x) {
    let top = 0;
    let y = x;
    stack[top++] = y;
    while (!isAuxRoot(y)) {
        y = parent[y];
        stack[top++] = y;
    }
    while (top > 0) {
        push(stack[--top]);
    }
}

function rotate(x) {
    const y = parent[x];
    const z = parent[y];
    const xIsRight = childRight[y] === x;
    const middle = xIsRight ? childLeft[x] : childRight[x];
    if (!isAuxRoot(y)) {
        if (childLeft[z] === y) {
            childLeft[z] = x;
        } else {
            childRight[z] = x;
        }
    }
    parent[x] = z;
    if (xIsRight) {
        childLeft[x] = y;
        childRight[y] = middle;
    } else {
        childRight[x] = y;
        childLeft[y] = middle;
    }
    if (middle !== 0) {
        parent[middle] = y;
    }
    parent[y] = x;
    pull(y);
    pull(x);
}

function splay(x) {
    pushPath(x);
    while (!isAuxRoot(x)) {
        const y = parent[x];
        const z = parent[y];
        if (!isAuxRoot(y)) {
            const xIsLeft = childLeft[y] === x;
            const yIsLeft = childLeft[z] === y;
            if (xIsLeft === yIsLeft) {
                rotate(y);
            } else {
                rotate(x);
            }
        }
        rotate(x);
    }
}

function expose(x) {
    let last = 0;
    let y = x;
    while (y !== 0) {
        splay(y);
        childRight[y] = last;
        pull(y);
        last = y;
        y = parent[y];
    }
    splay(x);
}

function makeRoot(x) {
    expose(x);
    applyReverse(x);
}

function findRoot(x) {
    expose(x);
    for (;;) {
        push(x);
        if (childLeft[x] === 0) {
            break;
        }
        x = childLeft[x];
    }
    splay(x);
    return x;
}

function link(x, y) {
    makeRoot(x);
    if (findRoot(y) !== x) {
        parent[x] = y;
    }
}

function cut(x, y) {
    makeRoot(x);
    expose(y);
    if (childLeft[y] === x && childRight[x] === 0) {
        childLeft[y] = 0;
        parent[x] = 0;
        pull(y);
    }
}

function pathSum(x, y) {
    makeRoot(x);
    expose(y);
    return total[y];
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
    const q = Number(tokens[1]);
    if (n <= 0) {
        return;
    }
    for (let i = 0; i <= n; i += 1) {
        childLeft[i] = 0;
        childRight[i] = 0;
        parent[i] = 0;
        reversedFlag[i] = 0;
        value[i] = i;
        total[i] = i;
    }

    const out = [];
    let index = 2;
    for (let i = 0; i < q; i += 1) {
        const operation = tokens[index];
        const u = Number(tokens[index + 1]) + 1;
        const v = Number(tokens[index + 2]) + 1;
        index += 3;
        if (operation === "link") {
            link(u, v);
        } else if (operation === "cut") {
            cut(u, v);
        } else {
            out.push(String(pathSum(u, v)));
        }
    }
    if (out.length > 0) {
        process.stdout.write(out.join("\n") + "\n");
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
