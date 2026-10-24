// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * The reference programs use a link-cut tree rather than an explicit top tree.
 * Preferred paths are the compress clusters and path-parent edges are the
 * rakes. Vertices are 0-based and index 0 is the null splay node.
 */
import { readFileSync } from "node:fs";

const data = readFileSync(0, "utf8").trim().split(/\s+/);
if (data.length >= 2) {
    const n = Number(data[0]);
    const q = Number(data[1]);
    if (n > 0) {
        run(n, q, data);
    }
}

function run(n, q, tokens) {
    const left = new Int32Array(n + 1);
    const right = new Int32Array(n + 1);
    const parent = new Int32Array(n + 1);
    const reversed = new Uint8Array(n + 1);
    const stack = new Int32Array(n + 1);
    const value = new Float64Array(n + 1).fill(1);
    const sum = new Float64Array(n + 1).fill(1);
    value[0] = 0;
    sum[0] = 0;

    function isAuxRoot(x) {
        const p = parent[x];
        return p === 0 || (left[p] !== x && right[p] !== x);
    }

    function pull(x) {
        sum[x] = sum[left[x]] + sum[right[x]] + value[x];
    }

    function applyReverse(x) {
        if (x === 0) {
            return;
        }
        const swap = left[x];
        left[x] = right[x];
        right[x] = swap;
        reversed[x] ^= 1;
    }

    function push(x) {
        if (reversed[x] === 0) {
            return;
        }
        applyReverse(left[x]);
        applyReverse(right[x]);
        reversed[x] = 0;
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
        const xIsRight = right[y] === x;
        const middle = xIsRight ? left[x] : right[x];
        if (!isAuxRoot(y)) {
            if (left[z] === y) {
                left[z] = x;
            } else {
                right[z] = x;
            }
        }
        parent[x] = z;
        if (xIsRight) {
            left[x] = y;
            right[y] = middle;
        } else {
            right[x] = y;
            left[y] = middle;
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
                const xIsLeft = left[y] === x;
                const yIsLeft = left[z] === y;
                if (xIsLeft === yIsLeft) {
                    rotate(y);
                } else {
                    rotate(x);
                }
            }
            rotate(x);
        }
    }

    function accessPath(x) {
        let last = 0;
        let y = x;
        while (y !== 0) {
            splay(y);
            right[y] = last;
            pull(y);
            last = y;
            y = parent[y];
        }
        splay(x);
    }

    function makeRoot(x) {
        accessPath(x);
        applyReverse(x);
    }

    function findRoot(x) {
        accessPath(x);
        for (;;) {
            push(x);
            if (left[x] === 0) {
                break;
            }
            x = left[x];
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
        accessPath(y);
        if (left[y] === x && right[x] === 0) {
            left[y] = 0;
            parent[x] = 0;
            pull(y);
        }
    }

    function setValue(x, v) {
        accessPath(x);
        value[x] = v;
        pull(x);
    }

    function pathSum(x, y) {
        if (findRoot(x) !== findRoot(y)) {
            return 0;
        }
        makeRoot(x);
        accessPath(y);
        return sum[y];
    }

    const out = [];
    let index = 2;
    for (let i = 0; i < q; i++) {
        const operation = tokens[index];
        const a = Number(tokens[index + 1]);
        const b = Number(tokens[index + 2]);
        index += 3;
        if (operation === "set") {
            if (a >= 0 && a < n) {
                setValue(a + 1, b);
            }
        } else if (!(a >= 0 && a < n && b >= 0 && b < n)) {
            if (operation === "path") {
                out.push("0");
            }
        } else if (operation === "link") {
            link(a + 1, b + 1);
        } else if (operation === "cut") {
            cut(a + 1, b + 1);
        } else {
            out.push(String(pathSum(a + 1, b + 1)));
        }
    }
    process.stdout.write(out.length > 0 ? `${out.join("\n")}\n` : "");
}
