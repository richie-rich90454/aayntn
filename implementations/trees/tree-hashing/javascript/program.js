// Educational reference implementation: JavaScript/Pascal is not a USACO submission language.

import { readFileSync } from "node:fs";

const BASE_FIRST = 1000003;
const BASE_SECOND = 999983;

function mixFirst(value) {
    let x = value >>> 0;
    x = (x ^ (x << 13)) >>> 0;
    x = (x ^ (x >>> 17)) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    return x;
}

function mixSecond(value) {
    let x = (value + 0x9e3779b9) >>> 0;
    x = (x ^ (x << 5)) >>> 0;
    x = (x ^ (x >>> 13)) >>> 0;
    x = (x ^ (x << 17)) >>> 0;
    return x;
}

function readTree(tokens, position) {
    if (position >= tokens.length) {
        return { count: 0, position };
    }
    const n = tokens[position];
    position += 1;
    if (n < 1) {
        return { count: 0, position };
    }

    const parent = tokens.slice(position, position + n);
    position += n;

    let root = -1;
    for (let i = 0; i < n; i += 1) {
        if (parent[i] < 0 || parent[i] >= n) {
            parent[i] = -1;
            if (root < 0) {
                root = i;
            }
        }
    }
    if (root < 0) {
        root = 0;
        parent[0] = -1;
    }

    const childCount = new Array(n).fill(0);
    for (let i = 0; i < n; i += 1) {
        if (i !== root && parent[i] >= 0) {
            childCount[parent[i]] += 1;
        }
    }

    const start = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i += 1) {
        start[i + 1] = start[i] + childCount[i];
    }

    const children = new Array(Math.max(n - 1, 1)).fill(0);
    const cursor = new Array(n).fill(0);
    for (let i = 0; i < n; i += 1) {
        if (i !== root && parent[i] >= 0) {
            const p = parent[i];
            children[start[p] + cursor[p]] = i;
            cursor[p] += 1;
        }
    }

    const order = [root];
    for (let head = 0; head < order.length; head += 1) {
        const u = order[head];
        for (let e = start[u]; e < start[u + 1]; e += 1) {
            order.push(children[e]);
        }
    }

    const first = new Array(n).fill(0);
    const second = new Array(n).fill(0);

    for (let index = order.length - 1; index >= 0; index -= 1) {
        const u = order[index];
        const pairs = [];
        for (let e = start[u]; e < start[u + 1]; e += 1) {
            const c = children[e];
            pairs.push([first[c], second[c]]);
        }
        pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

        let foldFirst = 0;
        let foldSecond = 0;
        for (const [childFirst, childSecond] of pairs) {
            foldFirst = (foldFirst * BASE_FIRST + mixFirst(childFirst)) >>> 0;
            foldSecond = (foldSecond * BASE_SECOND + mixSecond(childSecond)) >>> 0;
        }
        first[u] = (foldFirst * BASE_FIRST + 1) >>> 0;
        second[u] = (foldSecond * BASE_SECOND + 1) >>> 0;
    }

    return {
        count: n,
        root,
        first: first[root],
        second: second[root],
        position,
    };
}

function main() {
    const text = readFileSync(0, "utf8");
    const tokens = text
        .split(/\s+/)
        .filter((token) => token.length > 0)
        .map(Number);

    const firstTree = readTree(tokens, 0);
    const secondTree = readTree(tokens, firstTree.position);

    const same =
        firstTree.count > 0 &&
        firstTree.count === secondTree.count &&
        firstTree.first === secondTree.first &&
        firstTree.second === secondTree.second;
    process.stdout.write(same ? "SAME\n" : "DIFFERENT\n");
}

main();
