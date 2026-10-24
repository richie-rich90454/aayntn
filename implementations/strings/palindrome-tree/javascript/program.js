// Educational reference implementation: JavaScript is not a USACO submission language.

/*
 * Palindrome tree (eertree) over the lowercase Latin alphabet.
 *
 * Input: one line holding the string.
 * Output: two lines, the number of distinct nonempty palindromic substrings and
 * the number of palindromic substrings counting multiplicity.
 *
 * Two roots are kept. Node 0 has length -1 and stands for the imaginary string
 * that makes a single character the child of a real node. Node 1 has length 0
 * and stands for the empty palindrome. Every other node is one distinct
 * palindrome. An edge labeled c adds c to both ends of its parent, and the
 * suffix link of a node is its longest proper palindromic suffix.
 */

import { readFileSync } from "node:fs";

function main() {
    let text = readFileSync(0, "utf8").split("\n", 1)[0];
    if (text.endsWith("\r")) {
        text = text.slice(0, -1);
    }

    const n = text.length;
    const size = n + 2;
    const len = new Int32Array(size);
    const link = new Int32Array(size);
    const head = new Int32Array(size).fill(-1);
    const to = new Int32Array(size);
    const next = new Int32Array(size);
    const label = new Int32Array(size);
    const occ = new Int32Array(size);

    len[0] = -1;
    let nodes = 2;
    let last = 1;
    let edges = 0;

    for (let i = 0; i < n; i += 1) {
        const code = text.charCodeAt(i);
        let cur = last;
        let at;

        for (;;) {
            at = i - 1 - len[cur];
            if (at >= 0 && text.charCodeAt(at) === code) {
                break;
            }
            cur = link[cur];
        }

        let child = -1;
        for (let edge = head[cur]; edge !== -1; edge = next[edge]) {
            if (label[edge] === code) {
                child = to[edge];
                break;
            }
        }

        if (child === -1) {
            child = nodes;
            nodes += 1;
            len[child] = len[cur] + 2;
            head[child] = -1;
            label[edges] = code;
            to[edges] = child;
            next[edges] = head[cur];
            head[cur] = edges;
            edges += 1;

            if (len[child] === 1) {
                link[child] = 1;
            } else {
                let temp = link[cur];
                for (;;) {
                    at = i - 1 - len[temp];
                    if (at >= 0 && text.charCodeAt(at) === code) {
                        break;
                    }
                    temp = link[temp];
                }
                let found = -1;
                for (let edge = head[temp]; edge !== -1; edge = next[edge]) {
                    if (label[edge] === code) {
                        found = to[edge];
                        break;
                    }
                }
                link[child] = found;
            }
        }

        last = child;
        occ[last] += 1;
    }

    for (let v = nodes - 1; v >= 2; v -= 1) {
        occ[link[v]] += occ[v];
    }

    let total = 0;
    for (let v = 2; v < nodes; v += 1) {
        total += occ[v];
    }

    process.stdout.write(`${nodes - 2}\n${total}\n`);
}

main();
